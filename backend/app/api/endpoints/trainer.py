import hashlib
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_trainer
from app.models.user import User, TrainerProfile
from app.models.trainer import (
    TrainerExpertise,
    TrainerLibrary,
    Course,
    CourseModule,
    Lesson,
    Assessment,
    Question,
)
from app.offline.storage import content_root, record_content_manifest
from app.schemas.trainer import (
    TrainerProfileUpdate,
    TrainerProfileResponse,
    TrainerExpertiseCreate,
    TrainerExpertiseResponse,
    TrainerLibraryCreate,
    TrainerLibraryResponse,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseModuleCreate,
    CourseModuleResponse,
    LessonCreate,
    LessonResponse,
    QuestionCreate,
    QuestionResponse,
    QuestionnaireCreate,
    QuestionnaireResponse,
    TrainerDashboardResponse,
    CourseAnalyticsResponse,
)

logger = logging.getLogger("capacity_connect.trainer")
router = APIRouter()


async def get_or_create_trainer_profile(user: User, db: AsyncSession) -> TrainerProfile:
    """Helper to ensure a TrainerProfile record exists for the authenticated trainer."""
    stmt = (
        select(TrainerProfile)
        .options(
            selectinload(TrainerProfile.expertise),
            selectinload(TrainerProfile.library_items),
        )
        .where(TrainerProfile.user_id == user.id)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        profile = TrainerProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        result = await db.execute(stmt)
        profile = result.scalar_one()

    return profile


# ----------------------------------------------------------------------
# 1. Profile & Expertise Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/profile",
    response_model=TrainerProfileResponse,
    summary="Get current trainer's full professional profile"
)
async def get_my_profile(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)

    # Count courses authored
    c_res = await db.execute(select(func.count(Course.id)).where(Course.trainer_id == current_user.id))
    courses_count = c_res.scalar() or 0

    return TrainerProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        station_code=current_user.station_code,
        organization=current_user.organization,
        role=current_user.role.name if current_user.role else "trainer",
        designation=profile.designation,
        division=profile.division,
        years_of_experience=profile.years_of_experience or 0.0,
        is_available_for_assignment=profile.is_available_for_assignment,
        biography=profile.biography,
        avatar_url=profile.avatar_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        expertise=[TrainerExpertiseResponse.model_validate(e) for e in profile.expertise],
        courses_count=courses_count,
        library_count=len(profile.library_items),
    )


@router.put(
    "/profile",
    response_model=TrainerProfileResponse,
    summary="Update current trainer's professional profile details"
)
async def update_my_profile(
    payload: TrainerProfileUpdate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    await db.commit()
    return await get_my_profile(current_user=current_user, db=db)


@router.get(
    "/expertise",
    response_model=List[TrainerExpertiseResponse],
    summary="List current trainer's domain expertise and subjects"
)
async def list_my_expertise(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)
    stmt = (
        select(TrainerExpertise)
        .where(TrainerExpertise.trainer_profile_id == profile.id)
        .order_by(TrainerExpertise.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/expertise",
    response_model=TrainerExpertiseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add domain expertise or subject"
)
async def add_expertise(
    payload: TrainerExpertiseCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)

    item = TrainerExpertise(
        trainer_profile_id=profile.id,
        subject=payload.subject,
        proficiency_level=payload.proficiency_level,
        years_in_subject=payload.years_in_subject,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete(
    "/expertise/{expertise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete domain expertise entry"
)
async def delete_expertise(
    expertise_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)
    stmt = select(TrainerExpertise).where(
        TrainerExpertise.id == expertise_id,
        TrainerExpertise.trainer_profile_id == profile.id,
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expertise record not found or access denied",
        )
    await db.delete(item)
    await db.commit()
    return None


# ----------------------------------------------------------------------
# 2. Course Creation Foundation Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/courses",
    response_model=List[CourseResponse],
    summary="List all courses authored by the current trainer"
)
async def list_my_courses(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Course)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons),
        )
        .where(Course.trainer_id == current_user.id)
        .order_by(Course.created_at.desc())
    )
    res = await db.execute(stmt)
    courses = res.scalars().all()

    output = []
    for c in courses:
        modules_res = []
        tot_lessons = 0
        for m in sorted(c.modules, key=lambda x: x.order_index):
            lessons_res = [
                LessonResponse.model_validate(l)
                for l in sorted(m.lessons, key=lambda x: x.order_index)
            ]
            tot_lessons += len(lessons_res)
            modules_res.append(
                CourseModuleResponse(
                    id=m.id,
                    course_id=m.course_id,
                    title=m.title,
                    description=m.description,
                    order_index=m.order_index,
                    created_at=m.created_at,
                    lessons=lessons_res,
                )
            )
        output.append(
            CourseResponse(
                id=c.id,
                trainer_id=c.trainer_id,
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
                lessons_count=tot_lessons,
            )
        )
    return output


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new course"
)
async def create_course(
    payload: CourseCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    # Verify course code uniqueness
    code_check = await db.execute(select(Course).where(Course.code == payload.code.strip()))
    if code_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course with code '{payload.code}' already exists.",
        )

    course = Course(
        trainer_id=current_user.id,
        code=payload.code.strip().upper(),
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        level=payload.level,
        thumbnail_url=payload.thumbnail_url,
        estimated_hours=payload.estimated_hours,
        is_published=payload.is_published,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)

    return CourseResponse(
        id=course.id,
        trainer_id=course.trainer_id,
        code=course.code,
        title=course.title,
        description=course.description,
        category=course.category,
        level=course.level,
        thumbnail_url=course.thumbnail_url,
        is_published=course.is_published,
        estimated_hours=course.estimated_hours,
        created_at=course.created_at,
        updated_at=course.updated_at,
        modules=[],
        modules_count=0,
        lessons_count=0,
    )


@router.get(
    "/courses/{course_id}",
    response_model=CourseResponse,
    summary="Get single course authored by current trainer with modules and lessons"
)
async def get_course_details(
    course_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Course)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons),
        )
        .where(Course.id == course_id, Course.trainer_id == current_user.id)
    )
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )

    modules_res = []
    tot_lessons = 0
    for m in sorted(c.modules, key=lambda x: x.order_index):
        lessons_res = [
            LessonResponse.model_validate(l)
            for l in sorted(m.lessons, key=lambda x: x.order_index)
        ]
        tot_lessons += len(lessons_res)
        modules_res.append(
            CourseModuleResponse(
                id=m.id,
                course_id=m.course_id,
                title=m.title,
                description=m.description,
                order_index=m.order_index,
                created_at=m.created_at,
                lessons=lessons_res,
            )
        )

    return CourseResponse(
        id=c.id,
        trainer_id=c.trainer_id,
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
        lessons_count=tot_lessons,
    )


@router.put(
    "/courses/{course_id}",
    response_model=CourseResponse,
    summary="Update course details or publishing status"
)
async def update_course(
    course_id: str,
    payload: CourseUpdate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Course).where(Course.id == course_id, Course.trainer_id == current_user.id)
    res = await db.execute(stmt)
    course = res.scalar_one_or_none()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(course, k, v)

    await db.commit()
    return await get_course_details(course_id=course_id, current_user=current_user, db=db)


@router.delete(
    "/courses/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete course authored by current trainer"
)
async def delete_course(
    course_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Course).where(Course.id == course_id, Course.trainer_id == current_user.id)
    res = await db.execute(stmt)
    course = res.scalar_one_or_none()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )
    await db.delete(course)
    await db.commit()
    return None


@router.post(
    "/courses/{course_id}/modules",
    response_model=CourseModuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add module to course"
)
async def create_course_module(
    course_id: str,
    payload: CourseModuleCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    # Verify course ownership
    c_res = await db.execute(select(Course).where(Course.id == course_id, Course.trainer_id == current_user.id))
    course = c_res.scalar_one_or_none()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )

    module = CourseModule(
        course_id=course.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        order_index=payload.order_index,
    )
    db.add(module)
    await db.commit()
    await db.refresh(module)

    return CourseModuleResponse(
        id=module.id,
        course_id=module.course_id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
        created_at=module.created_at,
        lessons=[],
    )


@router.delete(
    "/modules/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete course module"
)
async def delete_course_module(
    module_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(CourseModule)
        .join(Course, CourseModule.course_id == Course.id)
        .where(CourseModule.id == module_id, Course.trainer_id == current_user.id)
    )
    res = await db.execute(stmt)
    module = res.scalar_one_or_none()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course module not found or access denied",
        )
    await db.delete(module)
    await db.commit()
    return None


@router.post(
    "/modules/{module_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add lesson to module"
)
async def create_lesson(
    module_id: str,
    payload: LessonCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    # Verify module and course ownership
    stmt = (
        select(CourseModule)
        .join(Course, CourseModule.course_id == Course.id)
        .where(CourseModule.id == module_id, Course.trainer_id == current_user.id)
    )
    res = await db.execute(stmt)
    module = res.scalar_one_or_none()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course module not found or access denied",
        )

    lesson = Lesson(
        module_id=module.id,
        title=payload.title.strip(),
        content_text=payload.content_text,
        order_index=payload.order_index,
        duration_minutes=payload.duration_minutes,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.delete(
    "/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete lesson"
)
async def delete_lesson(
    lesson_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Lesson)
        .join(CourseModule, Lesson.module_id == CourseModule.id)
        .join(Course, CourseModule.course_id == Course.id)
        .where(Lesson.id == lesson_id, Course.trainer_id == current_user.id)
    )
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found or access denied",
        )
    await db.delete(lesson)
    await db.commit()
    return None


# ----------------------------------------------------------------------
# 3. Questionnaire & Question Creation Foundation Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/questionnaires",
    response_model=List[QuestionnaireResponse],
    summary="List questionnaires / assessments created by current trainer"
)
async def list_questionnaires(
    course_id: Optional[str] = None,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Assessment)
        .options(selectinload(Assessment.questions))
        .where(Assessment.created_by == current_user.id)
    )
    if course_id:
        stmt = stmt.where(Assessment.course_id == course_id)
    stmt = stmt.order_by(Assessment.created_at.desc())

    res = await db.execute(stmt)
    assessments = res.scalars().all()

    output = []
    for a in assessments:
        questions_res = [
            QuestionResponse.from_orm_model(q)
            for q in sorted(a.questions, key=lambda x: x.order_index)
        ]
        output.append(
            QuestionnaireResponse(
                id=a.id,
                course_id=a.course_id,
                created_by=a.created_by,
                title=a.title,
                description=a.description,
                subject=a.subject,
                duration_minutes=a.duration_minutes,
                passing_score=a.passing_score,
                total_marks=a.total_marks,
                is_published=a.is_published,
                created_at=a.created_at,
                updated_at=a.updated_at,
                questions_count=len(questions_res),
                questions=questions_res,
            )
        )
    return output


@router.post(
    "/questionnaires",
    response_model=QuestionnaireResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new assessment / questionnaire"
)
async def create_questionnaire(
    payload: QuestionnaireCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    # If course_id is provided, verify ownership
    if payload.course_id:
        c_res = await db.execute(
            select(Course).where(Course.id == payload.course_id, Course.trainer_id == current_user.id)
        )
        if not c_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated course not found or access denied",
            )

    assessment = Assessment(
        course_id=payload.course_id,
        created_by=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        subject=payload.subject.strip(),
        duration_minutes=payload.duration_minutes,
        passing_score=payload.passing_score,
        total_marks=payload.total_marks,
        is_published=payload.is_published,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return QuestionnaireResponse(
        id=assessment.id,
        course_id=assessment.course_id,
        created_by=assessment.created_by,
        title=assessment.title,
        description=assessment.description,
        subject=assessment.subject,
        duration_minutes=assessment.duration_minutes,
        passing_score=assessment.passing_score,
        total_marks=assessment.total_marks,
        is_published=assessment.is_published,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
        questions_count=0,
        questions=[],
    )


@router.get(
    "/questionnaires/{questionnaire_id}",
    response_model=QuestionnaireResponse,
    summary="Get questionnaire details with questions"
)
async def get_questionnaire(
    questionnaire_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Assessment)
        .options(selectinload(Assessment.questions))
        .where(Assessment.id == questionnaire_id, Assessment.created_by == current_user.id)
    )
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found or access denied",
        )

    questions_res = [
        QuestionResponse.from_orm_model(q)
        for q in sorted(a.questions, key=lambda x: x.order_index)
    ]
    return QuestionnaireResponse(
        id=a.id,
        course_id=a.course_id,
        created_by=a.created_by,
        title=a.title,
        description=a.description,
        subject=a.subject,
        duration_minutes=a.duration_minutes,
        passing_score=a.passing_score,
        total_marks=a.total_marks,
        is_published=a.is_published,
        created_at=a.created_at,
        updated_at=a.updated_at,
        questions_count=len(questions_res),
        questions=questions_res,
    )


@router.delete(
    "/questionnaires/{questionnaire_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete questionnaire"
)
async def delete_questionnaire(
    questionnaire_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Assessment).where(
        Assessment.id == questionnaire_id,
        Assessment.created_by == current_user.id,
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found or access denied",
        )
    await db.delete(assessment)
    await db.commit()
    return None


@router.post(
    "/questionnaires/{questionnaire_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a question to a questionnaire"
)
async def add_question(
    questionnaire_id: str,
    payload: QuestionCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Assessment).where(
        Assessment.id == questionnaire_id,
        Assessment.created_by == current_user.id,
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found or access denied",
        )

    question = Question(
        assessment_id=assessment.id,
        question_text=payload.question_text.strip(),
        question_type=payload.question_type,
        options_json=json.dumps(payload.options),
        correct_option=payload.correct_option.strip().upper(),
        explanation=payload.explanation.strip() if payload.explanation else None,
        marks=payload.marks,
        order_index=payload.order_index,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)

    return QuestionResponse.from_orm_model(question)


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete question"
)
async def delete_question(
    question_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Question)
        .join(Assessment, Question.assessment_id == Assessment.id)
        .where(Question.id == question_id, Assessment.created_by == current_user.id)
    )
    res = await db.execute(stmt)
    question = res.scalar_one_or_none()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found or access denied",
        )
    await db.delete(question)
    await db.commit()
    return None


# ----------------------------------------------------------------------
# 4. Trainer Library Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/library",
    response_model=List[TrainerLibraryResponse],
    summary="List all learning materials and lectures in trainer library"
)
async def list_library_items(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)
    stmt = (
        select(TrainerLibrary)
        .where(TrainerLibrary.trainer_profile_id == profile.id)
        .order_by(TrainerLibrary.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post(
    "/library",
    response_model=TrainerLibraryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add material or presentation to trainer library"
)
async def create_library_item(
    payload: TrainerLibraryCreate,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)

    checksum = payload.sha256_checksum
    if not checksum or len(checksum) < 10:
        checksum = hashlib.sha256(payload.title.encode("utf-8") + payload.file_path.encode("utf-8")).hexdigest()

    item = TrainerLibrary(
        trainer_profile_id=profile.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        resource_type=payload.resource_type,
        file_path=payload.file_path.strip(),
        file_size_bytes=payload.file_size_bytes,
        sha256_checksum=checksum,
        is_public_to_trainees=payload.is_public_to_trainees,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post(
    "/resources/upload",
    response_model=TrainerLibraryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload media/study material resource to trainer library"
)
async def upload_trainer_resource(
    file: UploadFile = File(...),
    title: str = Form(...),
    resource_type: str = Form("study_material"),
    description: Optional[str] = Form(None),
    is_public_to_trainees: bool = Form(False),
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)

    MAX_TRAINER_LIBRARY_FILE_SIZE = 500 * 1024 * 1024
    ALLOWED_TRAINER_LIBRARY_TYPES = {"video", "presentation", "study_material", "image", "audio"}
    ALLOWED_TRAINER_LIBRARY_EXTENSIONS = {
        ".pdf", ".mp4", ".webm", ".mp3", ".wav", ".pptx", ".ppt",
        ".docx", ".doc", ".jpg", ".jpeg", ".png", ".gif", ".zip",
    }
    if resource_type not in ALLOWED_TRAINER_LIBRARY_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported resource type '{resource_type}'.")

    # Defend against path traversal and hidden executables: retain only the
    # basename of the client-provided filename and require a known extension.
    raw_name = file.filename or "resource.bin"
    safe_name = Path(raw_name).name
    suffix = Path(safe_name).suffix.lower()
    if suffix not in ALLOWED_TRAINER_LIBRARY_EXTENSIONS:
        raise HTTPException(status_code=422, detail="File type not allowed for trainer library uploads.")

    # Streaming read with an explicit cap so oversized media cannot exhaust memory.
    chunks = []
    total = 0
    while len(chunks) < MAX_TRAINER_LIBRARY_FILE_SIZE // (8 * 1024) + 1:
        chunk = await file.read(8 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_TRAINER_LIBRARY_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Uploaded content exceeds the 500 MB trainer library limit.")
        chunks.append(chunk)
    content = b"".join(chunks)
    file_size = len(content)
    checksum = hashlib.sha256(content).hexdigest()

    # Persist bytes into the content store so the material remains available
    # offline and verifiable; the database retains the checksummed reference.
    root = content_root()
    stored_relative_path = f"trainer_library/{current_user.id}/{safe_name}"
    stored_path = root / stored_relative_path
    stored_path.parent.mkdir(parents=True, exist_ok=True)
    stored_path.write_bytes(content)
    record_content_manifest(f"trainer-lib-{checksum[:16]}", stored_relative_path, checksum)

    item = TrainerLibrary(
        trainer_profile_id=profile.id,
        title=title.strip(),
        description=description.strip() if description else None,
        resource_type=resource_type,
        file_path=stored_relative_path,
        file_size_bytes=file_size,
        sha256_checksum=checksum,
        is_public_to_trainees=is_public_to_trainees,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete(
    "/library/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete material from trainer library"
)
async def delete_library_item(
    item_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)
    stmt = select(TrainerLibrary).where(
        TrainerLibrary.id == item_id,
        TrainerLibrary.trainer_profile_id == profile.id,
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library item not found or access denied",
        )
    await db.delete(item)
    await db.commit()
    return None


# ----------------------------------------------------------------------
# 5. Dashboard & Monitoring Foundation Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/dashboard",
    response_model=TrainerDashboardResponse,
    summary="Get trainer dashboard metrics and authored courses summary"
)
async def get_trainer_dashboard(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_trainer_profile(current_user, db)

    # Courses counts
    courses_stmt = (
        select(Course)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons),
        )
        .where(Course.trainer_id == current_user.id)
        .order_by(Course.created_at.desc())
    )
    c_res = await db.execute(courses_stmt)
    courses = c_res.scalars().all()

    total_courses = len(courses)
    published_courses = sum(1 for c in courses if c.is_published)
    total_modules = sum(len(c.modules) for c in courses)
    total_lessons = sum(sum(len(m.lessons) for m in c.modules) for c in courses)

    # Library resources count
    lib_res = await db.execute(
        select(func.count(TrainerLibrary.id)).where(TrainerLibrary.trainer_profile_id == profile.id)
    )
    total_library_resources = lib_res.scalar() or 0

    # Questionnaires and Questions counts
    q_res = await db.execute(
        select(func.count(Assessment.id)).where(Assessment.created_by == current_user.id)
    )
    total_questionnaires = q_res.scalar() or 0

    q_item_res = await db.execute(
        select(func.count(Question.id))
        .join(Assessment, Question.assessment_id == Assessment.id)
        .where(Assessment.created_by == current_user.id)
    )
    total_questions = q_item_res.scalar() or 0

    recent_courses_res = []
    for c in courses[:5]:
        recent_courses_res.append(
            CourseResponse(
                id=c.id,
                trainer_id=c.trainer_id,
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
                modules=[],
                modules_count=len(c.modules),
                lessons_count=sum(len(m.lessons) for m in c.modules),
            )
        )

    return TrainerDashboardResponse(
        trainer_id=current_user.id,
        full_name=current_user.full_name,
        designation=profile.designation,
        division=profile.division,
        total_courses=total_courses,
        published_courses=published_courses,
        total_modules=total_modules,
        total_lessons=total_lessons,
        total_library_resources=total_library_resources,
        total_questionnaires=total_questionnaires,
        total_questions=total_questions,
        total_enrolled_trainees=0,  # Populates in Phase 5 LMS
        total_assessments_attempted=0,  # Populates in Phase 6 Assessment System
        recent_courses=recent_courses_res,
    )


@router.get(
    "/analytics/courses/{course_id}",
    response_model=CourseAnalyticsResponse,
    summary="Get participation and performance analytics for a specific course"
)
async def get_course_analytics(
    course_id: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Course).where(Course.id == course_id, Course.trainer_id == current_user.id)
    res = await db.execute(stmt)
    course = res.scalar_one_or_none()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )

    return CourseAnalyticsResponse(
        course_id=course.id,
        course_title=course.title,
        course_code=course.code,
        is_published=course.is_published,
        total_enrolled_trainees=0,
        completed_trainees=0,
        in_progress_trainees=0,
        average_progress_percent=0.0,
        enrolled_trainees=[],
    )
