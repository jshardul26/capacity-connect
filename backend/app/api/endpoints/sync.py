import hashlib
import hmac
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_approved_user
from app.models.admin import Announcement
from app.models.assessment import AssessmentAttempt, AssessmentAnswer
from app.models.competency import Competency, CourseCompetency, TraineeCompetency
from app.models.learning import CourseFeedback, LearningResource, LessonProgress
from app.models.offline import SyncEvent, SyncQueue, SyncState
from app.models.trainer import Assessment, Course, CourseModule, Lesson, Question
from app.models.user import Role, User
from app.schemas.sync import SyncPushRequest, SyncPushResponse, SyncStatusResponse
from app.offline.sync_service import flush_queue

router = APIRouter(prefix="/sync", tags=["Synchronization"])


def valid_signature(device_id: str, event) -> bool:
    payload = json.dumps(event.payload, sort_keys=True, default=str)
    expected = hmac.new(settings.SYNC_HMAC_SECRET.encode(), f"{device_id}:{event.entity_type}:{event.action}:{payload}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, event.client_signature)


async def apply_domain_event(db: AsyncSession, event) -> bool:
    """Apply an accepted offline mutation to canonical domain records."""
    data = event.payload
    if event.entity_type == "progress" and event.action == "UPDATE":
        user_id, lesson_id = data.get("user_id"), data.get("lesson_id")
        if not user_id or not lesson_id:
            return False
        progress = await db.scalar(select(LessonProgress).where(
            LessonProgress.user_id == user_id, LessonProgress.lesson_id == lesson_id
        ))
        if progress:
            progress.watch_time_seconds = max(progress.watch_time_seconds, int(data.get("watch_time_seconds", 0)))
            progress.is_completed = progress.is_completed or bool(data.get("is_completed"))
        else:
            db.add(LessonProgress(user_id=user_id, lesson_id=lesson_id,
                watch_time_seconds=max(0, int(data.get("watch_time_seconds", 0))),
                is_completed=bool(data.get("is_completed"))))
        return True
    if event.entity_type == "feedback" and event.action == "UPSERT":
        course_id, user_id = data.get("course_id"), data.get("user_id")
        if not course_id or not user_id:
            return False
        feedback = await db.scalar(select(CourseFeedback).where(
            CourseFeedback.course_id == course_id, CourseFeedback.user_id == user_id
        ))
        if feedback:
            feedback.rating = int(data["rating"])
            feedback.feedback_text = data.get("feedback_text")
        else:
            db.add(CourseFeedback(course_id=course_id, user_id=user_id,
                rating=int(data["rating"]), feedback_text=data.get("feedback_text")))
        return True
    if event.entity_type == "attempt" and event.action == "CREATE":
        attempt_id = data.get("attempt_id")
        if not attempt_id or await db.get(AssessmentAttempt, attempt_id):
            return bool(attempt_id)
        assessment = await db.get(Assessment, data.get("assessment_id"))
        user_id = data.get("user_id")
        if not assessment or not user_id:
            return False
        attempt = AssessmentAttempt(id=attempt_id, assessment_id=assessment.id, user_id=user_id,
            score_obtained=float(data.get("score_obtained", 0)), is_passed=bool(data.get("is_passed")),
            attempt_status=data.get("attempt_status", "completed"), attempt_signature=data.get("attempt_signature"))
        db.add(attempt)
        await db.flush()
        for answer in data.get("answers", []):
            question_id = answer.get("question_id")
            if question_id and await db.get(Question, question_id):
                db.add(AssessmentAnswer(attempt_id=attempt.id, question_id=question_id,
                    selected_option=answer.get("selected_option")))
        # Mirror the online assessment flow: a passed attempt provides verified
        # competency evidence for the assessment's competency and its course yields.
        if bool(data.get("is_passed")):
            earned_ratio = min(1.0, max(0.0, float(data.get("score_obtained", 0)) / max(1.0, assessment.total_marks)))
            now = datetime.now(timezone.utc)
            target_comps = []
            if assessment.competency_id:
                target_comps.append((assessment.competency_id, round(earned_ratio, 2)))
            if assessment.course_id:
                cc_rows = (await db.execute(select(CourseCompetency).where(CourseCompetency.course_id == assessment.course_id))).scalars().all()
                target_comps.extend((cc.competency_id, round(cc.yield_level * earned_ratio, 2)) for cc in cc_rows)
            for comp_id, score_lvl in target_comps:
                tc = await db.scalar(select(TraineeCompetency).where(
                    TraineeCompetency.user_id == user_id, TraineeCompetency.competency_id == comp_id))
                if tc:
                    if score_lvl > tc.proficiency_level:
                        tc.proficiency_level = score_lvl
                    tc.last_evaluated_at = now
                else:
                    db.add(TraineeCompetency(user_id=user_id, competency_id=comp_id,
                        proficiency_level=score_lvl, last_evaluated_at=now))
        return True
    # Retain approved non-domain events in the idempotency ledger for forward
    # compatible clients; recognized learner mutations are always applied above.
    return event.entity_type == "other"


@router.post("/push", response_model=SyncPushResponse)
async def push_events(payload: SyncPushRequest, current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    accepted, failed = [], []
    for event in payload.events:
        if not valid_signature(payload.device_id, event):
            failed.append(event.event_id)
            continue
        prior = await db.scalar(select(SyncEvent).where(SyncEvent.id == event.event_id))
        if prior:
            accepted.append(event.event_id)
            continue
        event_user_id = event.payload.get("user_id")
        if current_user.role.name == "trainee" and event_user_id != current_user.id:
            failed.append(event.event_id)
            continue
        if not await apply_domain_event(db, event):
            failed.append(event.event_id)
            continue
        db.add(SyncEvent(id=event.event_id, device_id=payload.device_id, entity_type=event.entity_type, action=event.action, payload_json=json.dumps(event.payload, sort_keys=True, default=str)))
        accepted.append(event.event_id)
    state = await db.get(SyncState, payload.device_id)
    if not state:
        state = SyncState(id=payload.device_id); db.add(state)
    state.last_push_at = datetime.now(timezone.utc)
    await db.commit()
    return SyncPushResponse(accepted_event_ids=accepted, failed_event_ids=failed)


def _serialize_question(question: Question) -> dict:
    return {"id": question.id, "assessment_id": question.assessment_id, "question_text": question.question_text,
        "question_type": question.question_type, "options_json": question.options_json,
        "correct_option": question.correct_option, "explanation": question.explanation,
        "marks": question.marks, "order_index": question.order_index}


def _serialize_assessment(assessment: Assessment) -> dict:
    return {"id": assessment.id, "course_id": assessment.course_id, "competency_id": assessment.competency_id,
        "created_by": assessment.created_by, "title": assessment.title, "description": assessment.description,
        "subject": assessment.subject, "duration_minutes": assessment.duration_minutes,
        "passing_score": assessment.passing_score, "total_marks": assessment.total_marks,
        "deadline": assessment.deadline.isoformat() if assessment.deadline else None,
        "is_published": assessment.is_published, "updated_at": assessment.updated_at.isoformat(),
        "questions": [_serialize_question(q) for q in sorted(assessment.questions, key=lambda q: q.order_index)]}


def _serialize_resource(resource: LearningResource) -> dict:
    return {"id": resource.id, "lesson_id": resource.lesson_id, "course_id": resource.course_id,
        "title": resource.title, "resource_type": resource.resource_type, "file_url": resource.file_url,
        "file_size_bytes": resource.file_size_bytes, "sha256_checksum": resource.sha256_checksum,
        "duration_seconds": resource.duration_seconds}


def _serialize_course(course: Course) -> dict:
    return {
        "id": course.id, "trainer_id": course.trainer_id, "code": course.code, "title": course.title,
        "description": course.description, "category": course.category, "level": course.level,
        "thumbnail_url": course.thumbnail_url, "is_published": course.is_published,
        "estimated_hours": course.estimated_hours, "updated_at": course.updated_at.isoformat(),
        "modules": [
            {"id": module.id, "course_id": module.course_id, "title": module.title, "description": module.description,
             "order_index": module.order_index,
             "lessons": [
                 {"id": lesson.id, "module_id": lesson.module_id, "title": lesson.title, "content_text": lesson.content_text,
                  "order_index": lesson.order_index, "duration_minutes": lesson.duration_minutes,
                  "resources": [_serialize_resource(r) for r in lesson.learning_resources]}
                 for lesson in sorted(module.lessons, key=lambda l: l.order_index)]}
            for module in sorted(course.modules, key=lambda m: m.order_index)],
        "resources": [_serialize_resource(r) for r in course.learning_resources],
        "assessments": [_serialize_assessment(a) for a in course.assessments],
        "competency_yields": [
            {"competency_id": cy.competency_id, "yield_level": cy.yield_level} for cy in course.competencies_yield],
    }


@router.get("/pull")
async def pull_delta(device_id: str = Query(...), since_timestamp: datetime | None = Query(None), current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    """Central → local delta: published courses (with modules/lessons/resources),
    assessments (with questions), announcements, approved accounts for offline
    authentication, and the competency taxonomy. Content changed after
    `since_timestamp` is returned so nodes can apply authoritative updates."""
    changed = since_timestamp or datetime(1970, 1, 1, tzinfo=timezone.utc)

    courses_stmt = (
        select(Course).options(
            selectinload(Course.modules).selectinload(CourseModule.lessons).selectinload(Lesson.learning_resources),
            selectinload(Course.learning_resources),
            selectinload(Course.assessments).selectinload(Assessment.questions),
            selectinload(Course.competencies_yield),
        ).where(Course.is_published.is_(True), Course.updated_at > changed)
    )
    courses = (await db.execute(courses_stmt)).scalars().all()

    assessments_stmt = (
        select(Assessment).options(selectinload(Assessment.questions)).where(
            Assessment.is_published.is_(True), Assessment.updated_at > changed)
    )
    assessments = (await db.execute(assessments_stmt)).scalars().all()

    announcements_stmt = select(Announcement).where(Announcement.is_active.is_(True))
    if since_timestamp:
        announcements_stmt = announcements_stmt.where(Announcement.updated_at > since_timestamp)
    announcements = (await db.execute(announcements_stmt.order_by(Announcement.updated_at.asc()))).scalars().all()

    users_stmt = select(User).options(selectinload(User.role)).where(
        User.status == "approved", User.updated_at > changed)
    users = (await db.execute(users_stmt)).scalars().all()

    competencies = (await db.execute(select(Competency).order_by(Competency.name.asc()))).scalars().all()

    state = await db.get(SyncState, device_id)
    if not state:
        state = SyncState(id=device_id); db.add(state)
    now = datetime.now(timezone.utc); state.last_pull_at = now
    await db.commit()
    return {
        "timestamp": now,
        "courses": [_serialize_course(course) for course in courses],
        "assessments": [_serialize_assessment(assessment) for assessment in assessments],
        "announcements": [{"id": a.id, "title": a.title, "content": a.content,
                           "is_featured_on_homepage": a.is_featured_on_homepage, "updated_at": a.updated_at} for a in announcements],
        "users": [{"id": u.id, "email": u.email, "full_name": u.full_name, "phone_number": u.phone_number,
                   "station_code": u.station_code, "organization": u.organization, "role": u.role.name,
                   "status": u.status, "password_hash": u.password_hash} for u in users],
        "competencies": [{"id": c.id, "name": c.name, "domain": c.domain, "description": c.description,
                          "criticality_weight": c.criticality_weight} for c in competencies],
    }


@router.get("/status", response_model=SyncStatusResponse)
async def sync_status(current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can inspect synchronization status.")
    counts = {value: await db.scalar(select(func.count(SyncQueue.id)).where(SyncQueue.status == value)) or 0 for value in ("pending", "processing", "failed")}
    state = await db.get(SyncState, settings.STATION_CODE)
    return SyncStatusResponse(device_id=settings.STATION_CODE, pending_events=counts["pending"], processing_events=counts["processing"], failed_events=counts["failed"], last_pull_at=state.last_pull_at if state else None, last_push_at=state.last_push_at if state else None, last_error=state.last_error if state else None)


@router.post("/run")
async def run_local_queue(current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can run the local synchronization worker.")
    # The OS service invokes this same processor with a station token; no LAN transport is involved.
    return await flush_queue(db, "")


@router.get("/audit-logs")
async def sync_audit_logs(device_id: str | None = Query(None), limit: int = Query(100, ge=1, le=500),
                          current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    """Central admin view of every sync event accepted from distributed stations."""
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can inspect synchronization audit logs.")
    stmt = select(SyncEvent).order_by(SyncEvent.received_at.desc()).limit(limit)
    if device_id:
        stmt = stmt.where(SyncEvent.device_id == device_id)
    events = (await db.execute(stmt)).scalars().all()
    return {"total": len(events), "events": [
        {"event_id": e.id, "device_id": e.device_id, "entity_type": e.entity_type, "action": e.action,
         "received_at": e.received_at} for e in events]}
