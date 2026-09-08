import hashlib
import io
import json
import shutil
from datetime import datetime
from zipfile import ZIP_DEFLATED, ZipFile
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, get_db
from app.core.dependencies import require_approved_user
from app.models.learning import CourseEnrollment, LearningResource
from app.models.offline import ContentPack, SyncQueue
from app.models.trainer import Course, CourseModule, Lesson, Assessment, Question
from app.models.user import Role, User
from app.offline.storage import (content_root, verified_content_path, record_content_manifest,
    sign_pack_manifest, verify_pack_manifest, encrypt_pack, unwrap_pack_bytes)
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
    courses = (await db.execute(
        select(Course).options(
            selectinload(Course.trainer).selectinload(User.role),
            selectinload(Course.modules).selectinload(CourseModule.lessons).selectinload(Lesson.learning_resources),
            selectinload(Course.learning_resources),
            selectinload(Course.assessments).selectinload(Assessment.questions),
        ).where(Course.id.in_(payload.course_ids))
    )).scalars().all()
    if len(courses) != len(set(payload.course_ids)):
        raise HTTPException(status_code=404, detail="One or more requested courses were not found.")
    if current_user.role.name == "trainer" and any(course.trainer_id != current_user.id for course in courses):
        raise HTTPException(status_code=403, detail="Trainers can export only their own courses.")
    root = content_root(); package_path = root / "packages" / f"{payload.package_title}.ccpack"
    manifest = {"format": "ccpack", "version": "1.1", "courses": [], "assets": []}
    assets: list[tuple[str, object]] = []
    for course in courses:
        trainer = course.trainer
        course_data = {
            "id": course.id, "trainer": {"id": trainer.id, "email": trainer.email, "full_name": trainer.full_name,
                "password_hash": trainer.password_hash, "phone_number": trainer.phone_number, "station_code": trainer.station_code,
                "organization": trainer.organization, "role": trainer.role.name, "status": trainer.status},
            "code": course.code, "title": course.title, "description": course.description, "category": course.category,
            "level": course.level, "thumbnail_url": course.thumbnail_url, "is_published": course.is_published,
            "estimated_hours": course.estimated_hours, "modules": [], "resources": [], "assessments": [],
        }
        for module in course.modules:
            course_data["modules"].append({"id": module.id, "title": module.title, "description": module.description,
                "order_index": module.order_index, "lessons": [
                    {"id": lesson.id, "title": lesson.title, "content_text": lesson.content_text, "order_index": lesson.order_index,
                     "duration_minutes": lesson.duration_minutes, "resources": [
                        {"id": resource.id, "title": resource.title, "resource_type": resource.resource_type,
                         "file_size_bytes": resource.file_size_bytes, "sha256_checksum": resource.sha256_checksum}
                        for resource in lesson.learning_resources
                     ]}
                    for lesson in module.lessons
                ]})
        for resource in course.learning_resources:
            course_data["resources"].append({"id": resource.id, "title": resource.title, "resource_type": resource.resource_type,
                "file_size_bytes": resource.file_size_bytes, "sha256_checksum": resource.sha256_checksum})
        for assessment in course.assessments:
            course_data["assessments"].append({"id": assessment.id, "competency_id": assessment.competency_id,
                "title": assessment.title, "description": assessment.description, "subject": assessment.subject,
                "duration_minutes": assessment.duration_minutes, "passing_score": assessment.passing_score, "total_marks": assessment.total_marks,
                "deadline": assessment.deadline.isoformat() if assessment.deadline else None, "is_published": assessment.is_published,
                "questions": [{"id": question.id, "question_text": question.question_text, "question_type": question.question_type,
                    "options_json": question.options_json, "correct_option": question.correct_option, "explanation": question.explanation,
                    "marks": question.marks, "order_index": question.order_index} for question in assessment.questions]})
        manifest["courses"].append(course_data)
        for resource in [*course.learning_resources, *(r for m in course.modules for l in m.lessons for r in l.learning_resources)]:
            try:
                source = verified_content_path(resource.file_url, resource.sha256_checksum)
            except HTTPException:
                raise HTTPException(status_code=409, detail=f"Resource '{resource.title}' is not cached locally and cannot be included in an offline pack.")
            archive_name = f"assets/{resource.id}"
            manifest["assets"].append({"resource_id": resource.id, "archive_name": archive_name, "sha256_checksum": resource.sha256_checksum})
            assets.append((archive_name, source))
    signature = sign_pack_manifest(manifest)
    package_bytes = io.BytesIO()
    with ZipFile(package_bytes, "w", ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, sort_keys=True))
        archive.writestr("manifest.sig", signature)
        for archive_name, source in assets:
            archive.write(source, archive_name)
    sealed = encrypt_pack(package_bytes.getvalue()) if payload.encrypt else package_bytes.getvalue()
    package_bytes.close()
    package_path.write_bytes(sealed)
    checksum = hashlib.sha256(sealed).hexdigest()
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
        # AES-256-GCM sealed packs are unwrapped transparently; integrity and
        # authentication failures surface here as unprocessable packs.
        with ZipFile(io.BytesIO(unwrap_pack_bytes(destination.read_bytes()))) as archive:
            manifest = json.loads(archive.read("manifest.json"))
            signature = archive.read("manifest.sig").decode("utf-8")
            if not verify_pack_manifest(manifest, signature):
                raise ValueError("invalid manifest signature")
            if manifest.get("format") != "ccpack" or manifest.get("version") != "1.1":
                raise ValueError("unsupported manifest")
            for asset in manifest.get("assets", []):
                archive_name = asset["archive_name"]
                raw = archive.read(archive_name)
                if hashlib.sha256(raw).hexdigest() != asset["sha256_checksum"]:
                    raise ValueError("invalid asset checksum")
                resource_id = asset["resource_id"]
                stored_relative_path = f"packages/imported/{resource_id}"
                stored_path = content_root() / stored_relative_path
                stored_path.parent.mkdir(parents=True, exist_ok=True)
                stored_path.write_bytes(raw)
                record_content_manifest(resource_id, stored_relative_path, asset["sha256_checksum"])
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="Invalid Capacity Connect content pack.") from exc
    checksum = hashlib.sha256(destination.read_bytes()).hexdigest()
    for course_data in manifest.get("courses", []):
        trainer_data = course_data["trainer"]
        trainer = await db.get(User, trainer_data["id"])
        if not trainer:
            role = await db.scalar(select(Role).where(Role.name == trainer_data["role"]))
            if not role:
                raise HTTPException(status_code=422, detail="Content pack references an unknown role.")
            trainer = User(id=trainer_data["id"], email=trainer_data["email"], full_name=trainer_data["full_name"],
                password_hash=trainer_data["password_hash"], phone_number=trainer_data.get("phone_number"),
                station_code=trainer_data.get("station_code"), organization=trainer_data.get("organization") or "India Meteorological Department (IMD)",
                role_id=role.id, status=trainer_data.get("status", "approved"))
            db.add(trainer)
            await db.flush()
        course = await db.get(Course, course_data["id"])
        if not course:
            course = Course(id=course_data["id"], trainer_id=trainer.id, code=course_data["code"], title=course_data["title"],
                description=course_data["description"], category=course_data["category"], level=course_data["level"],
                thumbnail_url=course_data.get("thumbnail_url"), is_published=course_data["is_published"], estimated_hours=course_data["estimated_hours"])
            db.add(course)
        for module_data in course_data.get("modules", []):
            module = await db.get(CourseModule, module_data["id"])
            if not module:
                module = CourseModule(id=module_data["id"], course_id=course.id, title=module_data["title"], description=module_data.get("description"), order_index=module_data["order_index"])
                db.add(module)
            for lesson_data in module_data.get("lessons", []):
                lesson = await db.get(Lesson, lesson_data["id"])
                if not lesson:
                    lesson = Lesson(id=lesson_data["id"], module_id=module.id, title=lesson_data["title"], content_text=lesson_data.get("content_text"), order_index=lesson_data["order_index"], duration_minutes=lesson_data["duration_minutes"])
                    db.add(lesson)
                for resource_data in lesson_data.get("resources", []):
                    if not await db.get(LearningResource, resource_data["id"]):
                        db.add(LearningResource(id=resource_data["id"], lesson_id=lesson.id, course_id=course.id, title=resource_data["title"], resource_type=resource_data["resource_type"], file_url=f"packages/imported/{resource_data['id']}", file_size_bytes=resource_data["file_size_bytes"], sha256_checksum=resource_data["sha256_checksum"]))
        for resource_data in course_data.get("resources", []):
            if not await db.get(LearningResource, resource_data["id"]):
                db.add(LearningResource(id=resource_data["id"], course_id=course.id, title=resource_data["title"], resource_type=resource_data["resource_type"], file_url=f"packages/imported/{resource_data['id']}", file_size_bytes=resource_data["file_size_bytes"], sha256_checksum=resource_data["sha256_checksum"]))
        for assessment_data in course_data.get("assessments", []):
            assessment = await db.get(Assessment, assessment_data["id"])
            if not assessment:
                assessment = Assessment(id=assessment_data["id"], course_id=course.id, competency_id=assessment_data.get("competency_id"), created_by=trainer.id, title=assessment_data["title"], description=assessment_data.get("description"), subject=assessment_data["subject"], duration_minutes=assessment_data["duration_minutes"], passing_score=assessment_data["passing_score"], total_marks=assessment_data["total_marks"], deadline=datetime.fromisoformat(assessment_data["deadline"]) if assessment_data.get("deadline") else None, is_published=assessment_data["is_published"])
                db.add(assessment)
            for question_data in assessment_data.get("questions", []):
                if not await db.get(Question, question_data["id"]):
                    db.add(Question(id=question_data["id"], assessment_id=assessment.id, question_text=question_data["question_text"], question_type=question_data["question_type"], options_json=question_data["options_json"], correct_option=question_data["correct_option"], explanation=question_data.get("explanation"), marks=question_data["marks"], order_index=question_data["order_index"]))
    record = ContentPack(title=destination.stem, package_file_path=str(destination), file_size_bytes=destination.stat().st_size,
        sha256_checksum=checksum, manifest_json=json.dumps(manifest, sort_keys=True), created_by=current_user.id)
    db.add(record); await db.commit()
    # The manifest is retained locally for Phase 10's authoritative content-delta
    # application. No remote synchronization or conflict handling occurs here.
    return {"id": record.id, "title": record.title, "checksum": checksum, "courses_registered": len(manifest.get("courses", []))}
