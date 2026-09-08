import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload, joinedload

from app.core.database import get_db
from app.offline.storage import enqueue_local_mutation
from app.core.dependencies import get_current_user, require_approved_user, require_trainee
from app.models.user import User, TrainerProfile
from app.models.trainer import Course, CourseModule, Lesson
from app.models.learning import (
    LearningResource,
    CourseEnrollment,
    LessonProgress,
    CourseFeedback,
)
from app.schemas.learning import (
    LearningResourceCreate,
    LearningResourceResponse,
    CourseEnrollmentResponse,
    LessonProgressUpdate,
    LessonProgressResponse,
    CourseFeedbackCreate,
    CourseFeedbackResponse,
    CourseCatalogItem,
    CourseDetailResponse,
    ModuleDetailResponse,
    LessonDetailResponse,
    EnrolledCourseSummary,
)

logger = logging.getLogger("capacity_connect.courses")
router = APIRouter()


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ----------------------------------------------------------------------
# 1. Course Catalog & Discovery (Public / Authenticated)
# ----------------------------------------------------------------------

@router.get(
    "",
    response_model=List[CourseCatalogItem],
    summary="Discover published courses with filtering and pagination"
)
async def list_published_courses(
    category: Optional[str] = Query(None, description="Filter by category"),
    level: Optional[str] = Query(None, description="Filter by proficiency level"),
    search: Optional[str] = Query(None, description="Search course code, title, or description"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Course)
        .options(
            joinedload(Course.trainer).joinedload(User.trainer_profile),
            selectinload(Course.modules).selectinload(CourseModule.lessons),
            selectinload(Course.enrollments),
            selectinload(Course.feedbacks),
        )
        .where(Course.is_published.is_(True))
    )

    if category and category.lower() != "all":
        stmt = stmt.where(Course.category.ilike(f"%{category.strip()}%"))

    if level and level.lower() != "all":
        stmt = stmt.where(Course.level == level.lower())

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Course.code.ilike(term),
                Course.title.ilike(term),
                Course.description.ilike(term),
            )
        )

    stmt = stmt.order_by(Course.created_at.desc()).offset((page - 1) * limit).limit(limit)
    res = await db.execute(stmt)
    courses = res.scalars().unique().all()

    catalog: List[CourseCatalogItem] = []
    for c in courses:
        modules_cnt = len(c.modules)
        lessons_cnt = sum(len(m.lessons) for m in c.modules)
        enrolled_cnt = sum(1 for e in c.enrollments if e.status in ("in_progress", "completed"))

        avg_rating = 0.0
        if c.feedbacks:
            avg_rating = round(sum(f.rating for f in c.feedbacks) / len(c.feedbacks), 1)

        instructor_name = c.trainer.full_name if c.trainer else "IMD Faculty"
        instructor_desig = None
        if c.trainer and c.trainer.trainer_profile:
            instructor_desig = c.trainer.trainer_profile.designation

        catalog.append(
            CourseCatalogItem(
                id=c.id,
                code=c.code,
                title=c.title,
                description=c.description,
                category=c.category,
                level=c.level,
                estimated_hours=c.estimated_hours,
                thumbnail_url=c.thumbnail_url,
                is_published=c.is_published,
                instructor_name=instructor_name,
                instructor_designation=instructor_desig,
                modules_count=modules_cnt,
                lessons_count=lessons_cnt,
                enrolled_count=enrolled_cnt,
                rating=avg_rating,
                created_at=c.created_at,
            )
        )

    return catalog


# ----------------------------------------------------------------------
# 2. Enrolled Courses for Current Trainee
# ----------------------------------------------------------------------

@router.get(
    "/enrolled/me",
    response_model=List[EnrolledCourseSummary],
    summary="Get all courses currently enrolled by the authenticated trainee"
)
async def get_my_enrolled_courses(
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(CourseEnrollment)
        .options(
            selectinload(CourseEnrollment.course)
            .joinedload(Course.trainer)
            .joinedload(User.trainer_profile),
            selectinload(CourseEnrollment.course)
            .selectinload(Course.modules)
            .selectinload(CourseModule.lessons),
            selectinload(CourseEnrollment.course).selectinload(Course.feedbacks),
        )
        .where(
            CourseEnrollment.user_id == current_user.id,
            CourseEnrollment.status.in_(["in_progress", "completed"]),
        )
        .order_by(CourseEnrollment.enrolled_at.desc())
    )
    res = await db.execute(stmt)
    enrollments = res.scalars().unique().all()

    # Query completed lesson IDs for this user
    prog_res = await db.execute(
        select(LessonProgress.lesson_id).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.is_completed.is_(True),
        )
    )
    completed_ids = set(prog_res.scalars().all())

    summaries: List[EnrolledCourseSummary] = []
    for enr in enrollments:
        c = enr.course
        all_lessons = [l for m in c.modules for l in m.lessons]
        total_lessons = len(all_lessons)
        completed_lessons = sum(1 for l in all_lessons if l.id in completed_ids)

        progress_pct = 0.0
        if total_lessons > 0:
            progress_pct = round((completed_lessons / total_lessons) * 100.0, 1)

        avg_rating = 0.0
        if c.feedbacks:
            avg_rating = round(sum(f.rating for f in c.feedbacks) / len(c.feedbacks), 1)

        instructor_name = c.trainer.full_name if c.trainer else "IMD Faculty"
        instructor_desig = (
            c.trainer.trainer_profile.designation
            if c.trainer and c.trainer.trainer_profile
            else None
        )

        catalog_item = CourseCatalogItem(
            id=c.id,
            code=c.code,
            title=c.title,
            description=c.description,
            category=c.category,
            level=c.level,
            estimated_hours=c.estimated_hours,
            thumbnail_url=c.thumbnail_url,
            is_published=c.is_published,
            instructor_name=instructor_name,
            instructor_designation=instructor_desig,
            modules_count=len(c.modules),
            lessons_count=total_lessons,
            enrolled_count=0,
            rating=avg_rating,
            created_at=c.created_at,
        )

        summaries.append(
            EnrolledCourseSummary(
                course=catalog_item,
                enrollment_id=enr.id,
                enrolled_at=enr.enrolled_at,
                completed_at=enr.completed_at,
                status=enr.status,
                progress_percentage=progress_pct,
                completed_lessons=completed_lessons,
                total_lessons=total_lessons,
            )
        )

    return summaries


# ----------------------------------------------------------------------
# 3. Course Structure & Learning Content Access
# ----------------------------------------------------------------------

@router.get(
    "/{course_id}",
    response_model=CourseDetailResponse,
    summary="Get complete course structure with modules, lessons, and learning resources"
)
async def get_course_structure(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Course)
        .options(
            joinedload(Course.trainer).joinedload(User.trainer_profile),
            selectinload(Course.modules)
            .selectinload(CourseModule.lessons)
            .selectinload(Lesson.learning_resources),
            selectinload(Course.learning_resources),
            selectinload(Course.enrollments),
            selectinload(Course.feedbacks).joinedload(CourseFeedback.user),
        )
        .where(Course.id == course_id)
    )
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    # Check enrollment status for current user
    user_enr = next((e for e in c.enrollments if e.user_id == current_user.id), None)
    is_enrolled = user_enr is not None and user_enr.status in ("in_progress", "completed")
    enrollment_status = user_enr.status if user_enr else None

    # Fetch progress records for current user
    prog_res = await db.execute(
        select(LessonProgress).where(LessonProgress.user_id == current_user.id)
    )
    user_progress_map = {p.lesson_id: p for p in prog_res.scalars().all()}
    completed_ids = [
        lid for lid, p in user_progress_map.items() if p.is_completed
    ]

    all_lessons_count = 0
    modules_res: List[ModuleDetailResponse] = []
    for m in sorted(c.modules, key=lambda x: x.order_index):
        lessons_res: List[LessonDetailResponse] = []
        for l in sorted(m.lessons, key=lambda x: x.order_index):
            all_lessons_count += 1
            p = user_progress_map.get(l.id)
            is_comp = p.is_completed if p else False
            watch_sec = p.watch_time_seconds if p else 0

            resources_res = [
                LearningResourceResponse.model_validate(r)
                for r in l.learning_resources
            ]

            lessons_res.append(
                LessonDetailResponse(
                    id=l.id,
                    module_id=l.module_id,
                    title=l.title,
                    content_text=l.content_text,
                    order_index=l.order_index,
                    duration_minutes=l.duration_minutes,
                    is_completed=is_comp,
                    watch_time_seconds=watch_sec,
                    learning_resources=resources_res,
                    created_at=l.created_at,
                )
            )

        modules_res.append(
            ModuleDetailResponse(
                id=m.id,
                course_id=m.course_id,
                title=m.title,
                description=m.description,
                order_index=m.order_index,
                lessons=lessons_res,
                created_at=m.created_at,
            )
        )

    progress_pct = 0.0
    if all_lessons_count > 0:
        completed_count = sum(1 for mid in completed_ids if any(l.id == mid for m in c.modules for l in m.lessons))
        progress_pct = round((completed_count / all_lessons_count) * 100.0, 1)

    avg_rating = 0.0
    if c.feedbacks:
        avg_rating = round(sum(f.rating for f in c.feedbacks) / len(c.feedbacks), 1)

    feedbacks_res = [
        CourseFeedbackResponse(
            id=f.id,
            course_id=f.course_id,
            user_id=f.user_id,
            rating=f.rating,
            feedback_text=f.feedback_text,
            created_at=f.created_at,
            user_name=f.user.full_name if f.user else "Anonymous Trainee",
        )
        for f in c.feedbacks
    ]

    instructor_name = c.trainer.full_name if c.trainer else "IMD Faculty"
    instructor_desig = (
        c.trainer.trainer_profile.designation
        if c.trainer and c.trainer.trainer_profile
        else None
    )

    course_resources = [
        LearningResourceResponse.model_validate(r) for r in c.learning_resources
    ]

    return CourseDetailResponse(
        id=c.id,
        trainer_id=c.trainer_id,
        instructor_name=instructor_name,
        instructor_designation=instructor_desig,
        code=c.code,
        title=c.title,
        description=c.description,
        category=c.category,
        level=c.level,
        thumbnail_url=c.thumbnail_url,
        is_published=c.is_published,
        estimated_hours=c.estimated_hours,
        created_at=c.created_at,
        updated_at=c.updated_at,
        modules=modules_res,
        modules_count=len(modules_res),
        lessons_count=all_lessons_count,
        is_enrolled=is_enrolled,
        enrollment_status=enrollment_status,
        progress_percentage=progress_pct,
        completed_lesson_ids=completed_ids,
        learning_resources=course_resources,
        average_rating=avg_rating,
        total_ratings=len(feedbacks_res),
        feedbacks=feedbacks_res,
    )


# ----------------------------------------------------------------------
# 4. Enrollment & Unenrollment Endpoints
# ----------------------------------------------------------------------

@router.post(
    "/{course_id}/enroll",
    response_model=CourseEnrollmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Enroll in a published course"
)
async def enroll_in_course(
    course_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify course exists
    c_res = await db.execute(select(Course).where(Course.id == course_id))
    course = c_res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Check existing enrollment
    enr_res = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == current_user.id,
        )
    )
    enrollment = enr_res.scalar_one_or_none()

    if enrollment:
        if enrollment.status == "dropped":
            enrollment.status = "in_progress"
            enrollment.enrolled_at = get_utc_now()
            await db.commit()
            await db.refresh(enrollment)
        return enrollment

    new_enr = CourseEnrollment(
        user_id=current_user.id,
        course_id=course_id,
        status="in_progress",
    )
    db.add(new_enr)
    await db.commit()
    await db.refresh(new_enr)
    return new_enr


@router.delete(
    "/{course_id}/enroll",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unenroll / drop an enrolled course"
)
async def unenroll_course(
    course_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    enr_res = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == current_user.id,
        )
    )
    enrollment = enr_res.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment record not found",
        )

    enrollment.status = "dropped"
    await db.commit()
    return None


# ----------------------------------------------------------------------
# 5. Lesson Progress & Completion Tracking
# ----------------------------------------------------------------------

@router.post(
    "/{course_id}/progress",
    response_model=LessonProgressResponse,
    summary="Record watch duration and mark lesson completion"
)
async def update_lesson_progress(
    course_id: str,
    payload: LessonProgressUpdate,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify enrollment
    enr_res = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == current_user.id,
            CourseEnrollment.status.in_(["in_progress", "completed"]),
        )
    )
    enrollment = enr_res.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be actively enrolled in this course to record progress.",
        )

    # Verify lesson belongs to this course
    l_res = await db.execute(
        select(Lesson)
        .join(CourseModule, Lesson.module_id == CourseModule.id)
        .where(Lesson.id == payload.lesson_id, CourseModule.course_id == course_id)
    )
    lesson = l_res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson does not belong to this course",
        )

    # Upsert LessonProgress
    prog_res = await db.execute(
        select(LessonProgress).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == payload.lesson_id,
        )
    )
    progress_item = prog_res.scalar_one_or_none()

    if not progress_item:
        progress_item = LessonProgress(
            user_id=current_user.id,
            lesson_id=payload.lesson_id,
            is_completed=payload.is_completed,
            watch_time_seconds=payload.watch_time_seconds,
        )
        db.add(progress_item)
    else:
        progress_item.is_completed = payload.is_completed
        progress_item.watch_time_seconds = max(
            progress_item.watch_time_seconds, payload.watch_time_seconds
        )
        progress_item.last_accessed_at = get_utc_now()

    await enqueue_local_mutation(db, "progress", "UPDATE", {
        "user_id": current_user.id, "course_id": course_id, "lesson_id": payload.lesson_id,
        "watch_time_seconds": progress_item.watch_time_seconds, "is_completed": progress_item.is_completed,
    })
    await db.commit()
    await db.refresh(progress_item)

    # Check if all lessons in the course are completed
    course_lessons_res = await db.execute(
        select(Lesson.id)
        .join(CourseModule, Lesson.module_id == CourseModule.id)
        .where(CourseModule.course_id == course_id)
    )
    all_course_lesson_ids = set(course_lessons_res.scalars().all())

    user_completed_res = await db.execute(
        select(LessonProgress.lesson_id).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.is_completed.is_(True),
            LessonProgress.lesson_id.in_(all_course_lesson_ids),
        )
    )
    user_completed_ids = set(user_completed_res.scalars().all())

    if all_course_lesson_ids and all_course_lesson_ids.issubset(user_completed_ids):
        if enrollment.status != "completed":
            enrollment.status = "completed"
            enrollment.completed_at = get_utc_now()
            await db.commit()

    return progress_item


# ----------------------------------------------------------------------
# 6. Course Feedback & Reviews
# ----------------------------------------------------------------------

@router.post(
    "/{course_id}/feedback",
    response_model=CourseFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit review and numerical rating for course"
)
async def submit_course_feedback(
    course_id: str,
    payload: CourseFeedbackCreate,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify enrollment
    enr_res = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == current_user.id,
        )
    )
    if not enr_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be enrolled in the course to leave feedback.",
        )

    # Upsert Feedback
    fb_res = await db.execute(
        select(CourseFeedback).where(
            CourseFeedback.course_id == course_id,
            CourseFeedback.user_id == current_user.id,
        )
    )
    fb = fb_res.scalar_one_or_none()
    if fb:
        fb.rating = payload.rating
        fb.feedback_text = payload.feedback_text
    else:
        fb = CourseFeedback(
            course_id=course_id,
            user_id=current_user.id,
            rating=payload.rating,
            feedback_text=payload.feedback_text,
        )
        db.add(fb)

    await db.flush()
    await enqueue_local_mutation(db, "feedback", "UPSERT", {
        "feedback_id": fb.id,
        "course_id": course_id,
        "user_id": current_user.id,
        "rating": payload.rating,
        "feedback_text": payload.feedback_text,
    })
    await db.commit()
    await db.refresh(fb)

    return CourseFeedbackResponse(
        id=fb.id,
        course_id=fb.course_id,
        user_id=fb.user_id,
        rating=fb.rating,
        feedback_text=fb.feedback_text,
        created_at=fb.created_at,
        user_name=current_user.full_name,
    )


# ----------------------------------------------------------------------
# 7. Learning Resources Content Delivery Management (Trainer / Admin)
# ----------------------------------------------------------------------

@router.post(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/resources",
    response_model=LearningResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Attach learning resource (video, presentation, study material) to lesson"
)
async def add_learning_resource_to_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    payload: LearningResourceCreate,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify course ownership
    c_res = await db.execute(select(Course).where(Course.id == course_id))
    course = c_res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    user_role = current_user.role.name if current_user.role else ""
    if course.trainer_id != current_user.id and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the course instructor or an administrator can attach learning resources.",
        )

    # Verify lesson
    l_res = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id, Lesson.module_id == module_id)
    )
    if not l_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    resource = LearningResource(
        lesson_id=lesson_id,
        course_id=course_id,
        title=payload.title.strip(),
        resource_type=payload.resource_type,
        file_url=payload.file_url.strip(),
        file_size_bytes=payload.file_size_bytes,
        sha256_checksum=payload.sha256_checksum.strip(),
        duration_seconds=payload.duration_seconds,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete(
    "/resources/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete learning resource"
)
async def delete_learning_resource(
    resource_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    r_res = await db.execute(
        select(LearningResource)
        .options(joinedload(LearningResource.course))
        .where(LearningResource.id == resource_id)
    )
    resource = r_res.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    user_role = current_user.role.name if current_user.role else ""
    if resource.course and resource.course.trainer_id != current_user.id and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    await db.delete(resource)
    await db.commit()
    return None
