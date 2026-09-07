import hashlib
import json
import shutil
from zipfile import ZIP_DEFLATED, ZipFile
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, get_db
from app.core.dependencies import require_approved_user
from app.models.learning import CourseEnrollment, LearningResource
from app.models.offline import ContentPack, SyncQueue
from app.models.trainer import Course, CourseModule, Lesson, Assessment, Question
from app.models.user import User
from app.offline.storage import content_root, verified_content_path
from app.schemas.offline import OfflineStatusResponse, PackExportRequest, SyncQueueItemResponse

router = APIRouter(tags=["Offline Architecture"])


@router.get("/offline/status", response_model=OfflineStatusResponse)
async def offline_status(current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    root = content_root()
    pending = await db.scalar(select(func.count(SyncQueue.id)).where(SyncQueue.status == "pending")) or 0
    return OfflineStatusResponse(app_mode=settings.APP_MODE, station_code=settings.STATION_CODE,
        database_dialect=engine.dialect.name, content_store_ready=root.is_dir(), pending_sync_events=pending)


@router.get("/offline/queue", response_model=list[SyncQueueItemResponse])
async def local_sync_queue(current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can inspect the local sync queue.")
    rows = (await db.execute(select(SyncQueue).order_by(SyncQueue.created_at.desc()))).scalars().all()
    return [SyncQueueItemResponse(id=row.id, entity_type=row.entity_type, action=row.action, status=row.status, created_at=row.created_at) for row in rows]


@router.get("/offline/resources/{resource_id}")
async def serve_local_resource(resource_id: str, current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    resource = await db.scalar(select(LearningResource).where(LearningResource.id == resource_id))
    if not resource:
        raise HTTPException(status_code=404, detail="Learning resource not found.")
    course_id = resource.course_id
    if not course_id and resource.lesson_id:
        course_id = await db.scalar(
            select(CourseModule.course_id).join(Lesson, Lesson.module_id == CourseModule.id).where(Lesson.id == resource.lesson_id)
        )
    course = await db.scalar(select(Course).where(Course.id == course_id)) if course_id else None
    if not course:
        raise HTTPException(status_code=404, detail="Resource course not found.")
    if current_user.role.name == "trainee":
        enrolled = await db.scalar(select(CourseEnrollment.id).where(
            CourseEnrollment.user_id == current_user.id, CourseEnrollment.course_id == course.id,
            CourseEnrollment.status.in_(["in_progress", "completed"]),
        ))
        if not enrolled:
            raise HTTPException(status_code=403, detail="Enrollment is required to access this local resource.")
    elif current_user.role.name != "admin" and course.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot access this local resource.")
    path = verified_content_path(resource.file_url, resource.sha256_checksum)
    return FileResponse(path, filename=resource.title)


@router.post("/packs/export")
async def export_content_pack(payload: PackExportRequest, current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name not in {"admin", "trainer"}:
        raise HTTPException(status_code=403, detail="Only administrators and trainers can export content packs.")
    courses = (await db.execute(select(Course).where(Course.id.in_(payload.course_ids)))).scalars().all()
    if len(courses) != len(set(payload.course_ids)):
        raise HTTPException(status_code=404, detail="One or more requested courses were not found.")
    if current_user.role.name == "trainer" and any(course.trainer_id != current_user.id for course in courses):
        raise HTTPException(status_code=403, detail="Trainers can export only their own courses.")
    root = content_root(); package_path = root / "packages" / f"{payload.package_title}.ccpack"
    manifest = {"format": "ccpack", "version": "1.0", "courses": [{"id": course.id, "code": course.code, "title": course.title} for course in courses]}
    with ZipFile(package_path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, sort_keys=True))
    checksum = hashlib.sha256(package_path.read_bytes()).hexdigest()
    record = ContentPack(title=payload.package_title, package_file_path=str(package_path), file_size_bytes=package_path.stat().st_size,
        sha256_checksum=checksum, manifest_json=json.dumps(manifest, sort_keys=True), created_by=current_user.id)
    db.add(record); await db.commit()
    return {"id": record.id, "title": record.title, "checksum": checksum, "download_url": f"/api/v1/packs/{record.id}/download"}


@router.get("/packs/{pack_id}/download")
async def download_content_pack(pack_id: str, current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    pack = await db.scalar(select(ContentPack).where(ContentPack.id == pack_id))
    if not pack or current_user.role.name not in {"admin", "trainer"}:
        raise HTTPException(status_code=404, detail="Content pack not found.")
    return FileResponse(pack.package_file_path, filename=f"{pack.title}.ccpack")


@router.post("/packs/import")
async def import_content_pack(package_file: UploadFile = File(...), current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    """Validate and retain an air-gapped pack; Phase 10 deliberately does not synchronize it."""
    if current_user.role.name != "admin" or not package_file.filename.endswith(".ccpack"):
        raise HTTPException(status_code=403 if current_user.role.name != "admin" else 422, detail="A .ccpack may only be imported by a local administrator.")
    destination = content_root() / "packages" / package_file.filename
    with destination.open("wb") as target:
        shutil.copyfileobj(package_file.file, target)
    try:
        with ZipFile(destination) as archive:
            manifest = json.loads(archive.read("manifest.json"))
        if manifest.get("format") != "ccpack" or manifest.get("version") != "1.0":
            raise ValueError("unsupported manifest")
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="Invalid Capacity Connect content pack.") from exc
    checksum = hashlib.sha256(destination.read_bytes()).hexdigest()
    record = ContentPack(title=destination.stem, package_file_path=str(destination), file_size_bytes=destination.stat().st_size,
        sha256_checksum=checksum, manifest_json=json.dumps(manifest, sort_keys=True), created_by=current_user.id)
    db.add(record); await db.commit()
    # The manifest is retained locally for Phase 10's authoritative content-delta
    # application. No remote synchronization or conflict handling occurs here.
    return {"id": record.id, "title": record.title, "checksum": checksum, "courses_registered": len(manifest.get("courses", []))}
