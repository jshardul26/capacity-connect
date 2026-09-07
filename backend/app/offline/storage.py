import hashlib
import json
from pathlib import Path
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.offline import SyncQueue


def content_root() -> Path:
    root = Path(settings.LOCAL_CONTENT_STORE_PATH).resolve()
    for name in ("videos", "presentations", "study_materials", "packages"):
        (root / name).mkdir(parents=True, exist_ok=True)
    return root


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
    db.add(SyncQueue(
        device_id=settings.STATION_CODE,
        entity_type=entity_type,
        action=action,
        payload_json=json.dumps(payload, sort_keys=True, default=str),
    ))
