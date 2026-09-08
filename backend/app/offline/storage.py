import hashlib
import hmac
import json
import os
from pathlib import Path
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings
from app.models.offline import SyncQueue


PACK_ENCRYPTION_MAGIC = b"CCPCKENC1"  # 9-byte envelope marker for AES-256-GCM sealed packs


def pack_encryption_key() -> bytes:
    """Derive the 256-bit pack sealing key from the content-pack secret."""
    return hashlib.sha256(settings.CONTENT_PACK_HMAC_SECRET.encode("utf-8")).digest()


def encrypt_pack(package_bytes: bytes) -> bytes:
    """Seal a .ccpack payload with AES-256-GCM. Nonce is prepended; the cipher
    text carries the GHASH tag so tampering is detected before a single asset
    is restored. Format: magic || 12-byte nonce || ciphertext."""
    key = pack_encryption_key()
    nonce = os.urandom(12)
    sealed = AESGCM(key).encrypt(nonce, package_bytes, None)
    return PACK_ENCRYPTION_MAGIC + nonce + sealed


def decrypt_pack(wrapped: bytes) -> bytes:
    """Open an AES-256-GCM sealed .ccpack. Raises ValueError on any
    envelope, integrity, or authentication failure."""
    if not wrapped.startswith(PACK_ENCRYPTION_MAGIC):
        raise ValueError("not an encrypted capacity connect pack")
    offset = len(PACK_ENCRYPTION_MAGIC)
    nonce, sealed = wrapped[offset:offset + 12], wrapped[offset + 12:]
    if len(nonce) != 12 or len(sealed) < 16:
        raise ValueError("malformed encrypted pack envelope")
    return AESGCM(pack_encryption_key()).decrypt(nonce, sealed, None)


def unwrap_pack_bytes(wrapped: bytes) -> bytes:
    """Return the raw zip payload, transparently decrypting sealed packs."""
    if wrapped.startswith(PACK_ENCRYPTION_MAGIC):
        return decrypt_pack(wrapped)
    return wrapped


def content_root() -> Path:
    root = Path(settings.LOCAL_CONTENT_STORE_PATH).resolve()
    for name in ("videos", "presentations", "study_materials", "packages"):
        (root / name).mkdir(parents=True, exist_ok=True)
    metadata = root.parent / "metadata"
    metadata.mkdir(parents=True, exist_ok=True)
    manifest = metadata / "content_manifest.json"
    if not manifest.exists():
        manifest.write_text(json.dumps({"format": "capacity-connect-content-manifest", "resources": {}}, sort_keys=True), encoding="utf-8")
    return root


def record_content_manifest(resource_id: str, relative_path: str, checksum: str) -> None:
    """Persist a small local catalog so content remains discoverable after restart."""
    root = content_root()
    manifest_path = root.parent / "metadata" / "content_manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        manifest = {"format": "capacity-connect-content-manifest", "resources": {}}
    manifest.setdefault("resources", {})[resource_id] = {"path": relative_path, "sha256": checksum}
    manifest_path.write_text(json.dumps(manifest, sort_keys=True), encoding="utf-8")


def sign_pack_manifest(manifest: dict) -> str:
    canonical = json.dumps(manifest, sort_keys=True, separators=(",", ":"), default=str)
    return hmac.new(settings.CONTENT_PACK_HMAC_SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def verify_pack_manifest(manifest: dict, signature: str) -> bool:
    return hmac.compare_digest(sign_pack_manifest(manifest), signature)


def verified_content_path(relative_path: str, expected_checksum: str) -> Path:
    root = content_root()
    path = (root / relative_path.lstrip("/")).resolve()
    if root not in path.parents or not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Local content is unavailable.")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if expected_checksum and digest != expected_checksum:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Local content checksum verification failed.")
    return path


async def enqueue_local_mutation(db: AsyncSession, entity_type: str, action: str, payload: dict) -> None:
    """Record a local mutation transactionally. It is intentionally not transmitted here."""
    if settings.APP_MODE.lower() != "local":
        return
    canonical_payload = json.dumps(payload, sort_keys=True, default=str)
    signature = hmac.new(settings.SYNC_HMAC_SECRET.encode(), f"{settings.STATION_CODE}:{entity_type}:{action}:{canonical_payload}".encode(), hashlib.sha256).hexdigest()
    db.add(SyncQueue(
        device_id=settings.STATION_CODE,
        entity_type=entity_type,
        action=action,
        payload_json=canonical_payload,
        client_signature=signature,
    ))
