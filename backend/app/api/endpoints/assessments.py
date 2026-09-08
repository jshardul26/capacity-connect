import json
import hashlib
import hmac
import logging
from typing import List, Optional, Union
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload, joinedload

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, require_approved_user, require_trainer
from app.models.user import User
from app.models.trainer import Course, Assessment, Question
from app.models.assessment import AssessmentAttempt, AssessmentAnswer
from app.models.competency import TraineeCompetency, CourseCompetency
from app.offline.storage import enqueue_local_mutation
from app.schemas.assessment import (
    QuestionOptionItem,
    QuestionCreate,
    QuestionPublicResponse,
    QuestionFullResponse,
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentAttemptSummary,
    AssessmentListItem,
    AssessmentDetailResponse,
    AssessmentStartResponse,
    AnswerSubmissionItem,
    AssessmentSubmitRequest,
    AssessmentSubmitResponse,
    AnswerResultDetail,
    AssessmentAttemptDetail,
    AssessmentMonitoringItem,
    AssessmentMonitoringResponse,
)

logger = logging.getLogger("capacity_connect.assessments")
router = APIRouter()


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_options_json(raw: Union[str, list]) -> List[QuestionOptionItem]:
    if isinstance(raw, list):
        return [
            opt if isinstance(opt, QuestionOptionItem) else QuestionOptionItem(**opt)
            for opt in raw
        ]
    try:
        data = json.loads(raw)
        return [QuestionOptionItem(**item) for item in data]
    except Exception:
        return []


# ----------------------------------------------------------------------
# 1. Assessment Catalog & Trainee Discovery
# ----------------------------------------------------------------------

@router.get(
    "",
    response_model=List[AssessmentListItem],
    summary="List available subject-wise assessments"
)
async def list_assessments(
    subject: Optional[str] = Query(None, description="Filter by subject area"),
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    user_role = current_user.role.name if current_user.role else ""

    stmt = (
        select(Assessment)
        .options(
            joinedload(Assessment.creator),
            selectinload(Assessment.questions),
            selectinload(Assessment.attempts),
        )
    )

    # Trainees can only see published assessments
    if user_role == "trainee":
        stmt = stmt.where(Assessment.is_published.is_(True))
    elif user_role == "trainer":
        # Trainers see published ones or their own authored ones
        stmt = stmt.where(
            or_(
                Assessment.is_published.is_(True),
                Assessment.created_by == current_user.id,
            )
        )

    if subject and subject.lower() != "all":
        stmt = stmt.where(Assessment.subject.ilike(f"%{subject.strip()}%"))

    if course_id:
        stmt = stmt.where(Assessment.course_id == course_id)

    stmt = stmt.order_by(Assessment.created_at.desc()).offset((page - 1) * limit).limit(limit)
    res = await db.execute(stmt)
    assessments = res.scalars().unique().all()

    now = get_utc_now()
    output: List[AssessmentListItem] = []

    for a in assessments:
        # Check deadline availability
        is_available = True
        a_deadline = ensure_utc(a.deadline)
        if a_deadline:
            is_available = now <= a_deadline

        # Trainee latest attempt
        user_attempts = [att for att in a.attempts if att.user_id == current_user.id]
        latest_summary = None
        if user_attempts:
            sorted_attempts = sorted(user_attempts, key=lambda x: x.start_time, reverse=True)
            lat = sorted_attempts[0]
            latest_summary = AssessmentAttemptSummary(
                attempt_id=lat.id,
                score_obtained=lat.score_obtained,
                total_marks=a.total_marks,
                is_passed=lat.is_passed,
                attempt_status=lat.attempt_status,
                start_time=lat.start_time,
                end_time=lat.end_time,
            )

        creator_name = a.creator.full_name if a.creator else "IMD Faculty"

        output.append(
            AssessmentListItem(
                id=a.id,
                course_id=a.course_id,
                created_by=a.created_by,
                creator_name=creator_name,
                title=a.title,
                description=a.description,
                subject=a.subject,
                duration_minutes=a.duration_minutes,
                passing_score=a.passing_score,
                total_marks=a.total_marks,
                deadline=a.deadline,
                is_published=a.is_published,
                is_available=is_available,
                questions_count=len(a.questions),
                attempts_count=len(a.attempts),
                user_latest_attempt=latest_summary,
                created_at=a.created_at,
            )
        )

    return output


# ----------------------------------------------------------------------
# 2. Assessment Detail & Instructions
# ----------------------------------------------------------------------

@router.get(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
    summary="Get assessment details, rules, instructions, and history"
)
async def get_assessment_details(
    assessment_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Assessment)
        .options(
            joinedload(Assessment.creator),
            selectinload(Assessment.questions),
            selectinload(Assessment.attempts),
        )
        .where(Assessment.id == assessment_id)
    )
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    user_role = current_user.role.name if current_user.role else ""
    is_owner_or_admin = (a.created_by == current_user.id) or (user_role == "admin")

    if not a.is_published and not is_owner_or_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not available")

    now = get_utc_now()
    a_deadline = ensure_utc(a.deadline)
    is_available = (a_deadline is None) or (now <= a_deadline)

    # Full questions for authoring trainer or admin
    questions_full = None
    if is_owner_or_admin:
        questions_full = [
            QuestionFullResponse(
                id=q.id,
                assessment_id=q.assessment_id,
                question_text=q.question_text,
                question_type=q.question_type,
                options=parse_options_json(q.options_json),
                correct_option=q.correct_option,
                explanation=q.explanation,
                marks=q.marks,
                order_index=q.order_index,
            )
            for q in sorted(a.questions, key=lambda x: x.order_index)
        ]

    # User's own attempts
    my_attempts = [
        AssessmentAttemptSummary(
            attempt_id=att.id,
            score_obtained=att.score_obtained,
            total_marks=a.total_marks,
            is_passed=att.is_passed,
            attempt_status=att.attempt_status,
            start_time=att.start_time,
            end_time=att.end_time,
        )
        for att in sorted(
            [att for att in a.attempts if att.user_id == current_user.id],
            key=lambda x: x.start_time,
            reverse=True,
        )
    ]

    return AssessmentDetailResponse(
        id=a.id,
        course_id=a.course_id,
        created_by=a.created_by,
        creator_name=a.creator.full_name if a.creator else "IMD Faculty",
        title=a.title,
        description=a.description,
        subject=a.subject,
        duration_minutes=a.duration_minutes,
        passing_score=a.passing_score,
        total_marks=a.total_marks,
        deadline=a.deadline,
        is_published=a.is_published,
        is_available=is_available,
        questions_count=len(a.questions),
        questions=questions_full,
        attempts_count=len(a.attempts),
        my_attempts=my_attempts,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


# ----------------------------------------------------------------------
# 3. Assessment Authoring (Trainer / Admin)
# ----------------------------------------------------------------------

@router.post(
    "",
    response_model=AssessmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new assessment"
)
async def create_assessment(
    payload: AssessmentCreate,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    user_role = current_user.role.name if current_user.role else ""
    if user_role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers or administrators can create assessments.",
        )

    # If course_id is specified, verify ownership
    if payload.course_id:
        c_res = await db.execute(select(Course).where(Course.id == payload.course_id))
        course = c_res.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        if course.trainer_id != current_user.id and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only attach assessments to courses you authored.",
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
        deadline=payload.deadline,
        is_published=payload.is_published,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return AssessmentDetailResponse(
        id=assessment.id,
        course_id=assessment.course_id,
        created_by=assessment.created_by,
        creator_name=current_user.full_name,
        title=assessment.title,
        description=assessment.description,
        subject=assessment.subject,
        duration_minutes=assessment.duration_minutes,
        passing_score=assessment.passing_score,
        total_marks=assessment.total_marks,
        deadline=assessment.deadline,
        is_published=assessment.is_published,
        is_available=True,
        questions_count=0,
        questions=[],
        attempts_count=0,
        my_attempts=[],
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.put(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
    summary="Update assessment details or publishing status"
)
async def update_assessment(
    assessment_id: str,
    payload: AssessmentUpdate,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    a_res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = a_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    user_role = current_user.role.name if current_user.role else ""
    if assessment.created_by != current_user.id and user_role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(assessment, k, v)

    await db.commit()
    return await get_assessment_details(assessment_id=assessment_id, current_user=current_user, db=db)


@router.delete(
    "/{assessment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete assessment"
)
async def delete_assessment(
    assessment_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    a_res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = a_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    user_role = current_user.role.name if current_user.role else ""
    if assessment.created_by != current_user.id and user_role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(assessment)
    await db.commit()
    return None


@router.post(
    "/{assessment_id}/questions",
    response_model=QuestionFullResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an MCQ or True/False question to assessment"
)
async def add_question_to_assessment(
    assessment_id: str,
    payload: QuestionCreate,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    a_res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = a_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    user_role = current_user.role.name if current_user.role else ""
    if assessment.created_by != current_user.id and user_role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Serialize options to JSON string
    if isinstance(payload.options_json, list):
        options_data = [opt.model_dump() for opt in payload.options_json]
        options_str = json.dumps(options_data)
    else:
        options_str = payload.options_json

    question = Question(
        assessment_id=assessment_id,
        question_text=payload.question_text.strip(),
        question_type=payload.question_type,
        options_json=options_str,
        correct_option=payload.correct_option.strip().upper(),
        explanation=payload.explanation.strip() if payload.explanation else None,
        marks=payload.marks,
        order_index=payload.order_index,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)

    return QuestionFullResponse(
        id=question.id,
        assessment_id=question.assessment_id,
        question_text=question.question_text,
        question_type=question.question_type,
        options=parse_options_json(question.options_json),
        correct_option=question.correct_option,
        explanation=question.explanation,
        marks=question.marks,
        order_index=question.order_index,
    )


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete question"
)
async def delete_question(
    question_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    q_res = await db.execute(
        select(Question)
        .options(joinedload(Question.assessment))
        .where(Question.id == question_id)
    )
    q = q_res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    user_role = current_user.role.name if current_user.role else ""
    if q.assessment and q.assessment.created_by != current_user.id and user_role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(q)
    await db.commit()
    return None


# ----------------------------------------------------------------------
# 4. Trainee Attempt Execution & Timed Quiz Runner
# ----------------------------------------------------------------------

@router.post(
    "/{assessment_id}/start",
    response_model=AssessmentStartResponse,
    status_code=status.HTTP_200_OK,
    summary="Start a timed assessment attempt"
)
async def start_assessment_attempt(
    assessment_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Assessment)
        .options(selectinload(Assessment.questions))
        .where(Assessment.id == assessment_id)
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    user_role = current_user.role.name if current_user.role else ""
    is_owner = assessment.created_by == current_user.id or user_role == "admin"

    if not assessment.is_published and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assessment is not currently open for testing.",
        )

    now = get_utc_now()
    a_deadline = ensure_utc(assessment.deadline)
    if a_deadline and now > a_deadline and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The deadline for this assessment passed on {a_deadline.strftime('%Y-%m-%d %H:%M UTC')}.",
        )

    if len(assessment.questions) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment does not contain any questions yet.",
        )

    # Check for an active in_progress attempt by this user
    existing_att_res = await db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == current_user.id,
            AssessmentAttempt.attempt_status == "in_progress",
        )
    )
    active_attempt = existing_att_res.scalar_one_or_none()

    if active_attempt:
        # Check if the active attempt has exceeded duration + 2 min buffer
        max_duration = timedelta(minutes=assessment.duration_minutes + 2)
        att_start = ensure_utc(active_attempt.start_time)
        if att_start and (now - att_start > max_duration):
            active_attempt.attempt_status = "timed_out"
            active_attempt.end_time = now
            await db.commit()
            active_attempt = None

    if not active_attempt:
        active_attempt = AssessmentAttempt(
            assessment_id=assessment_id,
            user_id=current_user.id,
            start_time=now,
            attempt_status="in_progress",
        )
        db.add(active_attempt)
        await db.commit()
        await db.refresh(active_attempt)

    # Sanitize questions: strip correct_option and explanation
    public_questions = [
        QuestionPublicResponse(
            id=q.id,
            assessment_id=q.assessment_id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=parse_options_json(q.options_json),
            marks=q.marks,
            order_index=q.order_index,
        )
        for q in sorted(assessment.questions, key=lambda x: x.order_index)
    ]

    return AssessmentStartResponse(
        attempt_id=active_attempt.id,
        assessment_id=assessment.id,
        title=assessment.title,
        subject=assessment.subject,
        duration_minutes=assessment.duration_minutes,
        total_marks=assessment.total_marks,
        passing_score=assessment.passing_score,
        start_time=active_attempt.start_time,
        deadline=assessment.deadline,
        questions=public_questions,
    )


# ----------------------------------------------------------------------
# 5. Answer Submission & Automatic Scoring
# ----------------------------------------------------------------------

@router.post(
    "/{assessment_id}/submit",
    response_model=AssessmentSubmitResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit answers, execute automated grading, and calculate score"
)
async def submit_assessment_answers(
    assessment_id: str,
    payload: AssessmentSubmitRequest,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch attempt
    att_res = await db.execute(
        select(AssessmentAttempt)
        .options(
            joinedload(AssessmentAttempt.assessment).selectinload(Assessment.questions),
            selectinload(AssessmentAttempt.answers),
        )
        .where(
            AssessmentAttempt.id == payload.attempt_id,
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == current_user.id,
        )
    )
    attempt = att_res.scalar_one_or_none()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Valid attempt session not found for submission.",
        )

    if attempt.attempt_status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment attempt has already been submitted and graded.",
        )

    now = get_utc_now()
    assessment = attempt.assessment

    # 2. Check timing
    allowed_duration = timedelta(minutes=assessment.duration_minutes + 2)
    att_start = ensure_utc(attempt.start_time)
    is_timed_out = att_start is not None and (now - att_start > allowed_duration)
    final_status = "timed_out" if is_timed_out else "completed"

    # 3. Grade answers against database questions
    questions_map = {q.id: q for q in assessment.questions}
    submitted_answers_map = {a.question_id: a.selected_option for a in payload.answers}

    total_score = 0.0
    correct_count = 0

    # Clear existing answers if any (to support idempotent retries)
    for existing_ans in attempt.answers:
        await db.delete(existing_ans)

    for q_id, q in questions_map.items():
        selected = submitted_answers_map.get(q_id)
        is_corr = False
        awarded = 0.0

        if selected and selected.strip().upper() == q.correct_option.strip().upper():
            is_corr = True
            awarded = float(q.marks)
            correct_count += 1
            total_score += awarded

        ans = AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option=selected.strip().upper() if selected else None,
            is_correct=is_corr,
            marks_awarded=awarded,
        )
        db.add(ans)

    is_passed = total_score >= assessment.passing_score

    # 4. Generate Cryptographic HMAC attempt seal for offline sync reconciliation.
    signature_raw = f"{current_user.id}:{assessment_id}:{total_score}:{now.isoformat()}:capacity_connect_v1"
    signature = hmac.new(settings.SYNC_HMAC_SECRET.encode("utf-8"), signature_raw.encode("utf-8"), hashlib.sha256).hexdigest()

    attempt.end_time = now
    attempt.score_obtained = round(total_score, 2)
    attempt.is_passed = is_passed
    attempt.attempt_status = final_status
    attempt.attempt_signature = signature

    # 5. Assessment-Based Competency Updates (Phase 8)
    if is_passed:
        earned_ratio = min(1.0, max(0.0, total_score / max(1.0, assessment.total_marks)))
        target_comps = []
        if getattr(assessment, "competency_id", None):
            target_comps.append((assessment.competency_id, round(earned_ratio, 2)))

        if assessment.course_id:
            cc_res = await db.execute(
                select(CourseCompetency).where(CourseCompetency.course_id == assessment.course_id)
            )
            for cc in cc_res.scalars().all():
                level_yield = round(cc.yield_level * earned_ratio, 2)
                target_comps.append((cc.competency_id, level_yield))

        for c_id, score_lvl in target_comps:
            tc_res = await db.execute(
                select(TraineeCompetency).where(
                    and_(
                        TraineeCompetency.user_id == current_user.id,
                        TraineeCompetency.competency_id == c_id
                    )
                )
            )
            existing_tc = tc_res.scalar_one_or_none()
            if existing_tc:
                if score_lvl > existing_tc.proficiency_level:
                    existing_tc.proficiency_level = score_lvl
                existing_tc.last_evaluated_at = now
            else:
                new_tc = TraineeCompetency(
                    user_id=current_user.id,
                    competency_id=c_id,
                    proficiency_level=score_lvl,
                    last_evaluated_at=now
                )
                db.add(new_tc)

    await enqueue_local_mutation(db, "attempt", "CREATE", {
        "attempt_id": attempt.id, "assessment_id": assessment.id, "user_id": current_user.id,
        "score_obtained": attempt.score_obtained, "is_passed": attempt.is_passed,
        "attempt_signature": attempt.attempt_signature,
        "attempt_status": attempt.attempt_status,
        "start_time": attempt.start_time.isoformat(),
        "end_time": attempt.end_time.isoformat() if attempt.end_time else None,
        "answers": [
            {"question_id": question_id, "selected_option": selected_option}
            for question_id, selected_option in submitted_answers_map.items()
        ],
    })
    await db.commit()
    await db.refresh(attempt)

    return AssessmentSubmitResponse(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        score_obtained=attempt.score_obtained,
        total_marks=assessment.total_marks,
        passing_score=assessment.passing_score,
        is_passed=attempt.is_passed,
        attempt_status=attempt.attempt_status,
        attempt_signature=attempt.attempt_signature,
        start_time=attempt.start_time,
        end_time=attempt.end_time,
        answers_count=len(questions_map),
        correct_answers_count=correct_count,
    )


# ----------------------------------------------------------------------
# 6. Trainee Attempt History & Result Breakdown
# ----------------------------------------------------------------------

@router.get(
    "/attempts/me",
    response_model=List[AssessmentAttemptSummary],
    summary="Get all assessment attempts for current trainee"
)
async def get_my_all_attempts(
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AssessmentAttempt)
        .options(joinedload(AssessmentAttempt.assessment))
        .where(AssessmentAttempt.user_id == current_user.id)
        .order_by(AssessmentAttempt.start_time.desc())
    )
    res = await db.execute(stmt)
    attempts = res.scalars().all()

    return [
        AssessmentAttemptSummary(
            attempt_id=att.id,
            score_obtained=att.score_obtained,
            total_marks=att.assessment.total_marks if att.assessment else 100.0,
            is_passed=att.is_passed,
            attempt_status=att.attempt_status,
            start_time=att.start_time,
            end_time=att.end_time,
        )
        for att in attempts
    ]


@router.get(
    "/attempts/{attempt_id}",
    response_model=AssessmentAttemptDetail,
    summary="Get comprehensive result breakdown for a specific attempt"
)
async def get_attempt_result_detail(
    attempt_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AssessmentAttempt)
        .options(
            joinedload(AssessmentAttempt.assessment).selectinload(Assessment.questions),
            joinedload(AssessmentAttempt.user),
            selectinload(AssessmentAttempt.answers).joinedload(AssessmentAnswer.question),
        )
        .where(AssessmentAttempt.id == attempt_id)
    )
    res = await db.execute(stmt)
    att = res.scalar_one_or_none()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt record not found")

    user_role = current_user.role.name if current_user.role else ""
    is_owner = att.user_id == current_user.id
    is_creator_or_admin = (
        att.assessment and att.assessment.created_by == current_user.id
    ) or (user_role == "admin")

    if not is_owner and not is_creator_or_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    answers_map = {ans.question_id: ans for ans in att.answers}
    answer_details: List[AnswerResultDetail] = []

    for q in sorted(att.assessment.questions, key=lambda x: x.order_index):
        user_ans = answers_map.get(q.id)
        answer_details.append(
            AnswerResultDetail(
                question_id=q.id,
                question_text=q.question_text,
                options=parse_options_json(q.options_json),
                selected_option=user_ans.selected_option if user_ans else None,
                correct_option=q.correct_option,
                is_correct=user_ans.is_correct if user_ans else False,
                marks_awarded=user_ans.marks_awarded if user_ans else 0.0,
                max_marks=q.marks,
                explanation=q.explanation,
            )
        )

    return AssessmentAttemptDetail(
        attempt_id=att.id,
        assessment_id=att.assessment_id,
        assessment_title=att.assessment.title if att.assessment else "Assessment",
        subject=att.assessment.subject if att.assessment else "General",
        user_id=att.user_id,
        user_name=att.user.full_name if att.user else "Trainee",
        score_obtained=att.score_obtained,
        total_marks=att.assessment.total_marks if att.assessment else 100.0,
        passing_score=att.assessment.passing_score if att.assessment else 60.0,
        is_passed=att.is_passed,
        attempt_status=att.attempt_status,
        attempt_signature=att.attempt_signature,
        start_time=att.start_time,
        end_time=att.end_time,
        answers=answer_details,
    )


# ----------------------------------------------------------------------
# 7. Trainer / Admin Assessment Monitoring
# ----------------------------------------------------------------------

@router.get(
    "/{assessment_id}/monitoring",
    response_model=AssessmentMonitoringResponse,
    summary="Monitor trainee assessment performance and participation"
)
async def monitor_assessment_performance(
    assessment_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.attempts).joinedload(AssessmentAttempt.user),
        )
        .where(Assessment.id == assessment_id)
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    user_role = current_user.role.name if current_user.role else ""
    if assessment.created_by != current_user.id and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the authoring trainer or administrator can monitor assessment performance.",
        )

    completed_attempts = [
        att for att in assessment.attempts if att.attempt_status in ("completed", "timed_out")
    ]
    total_attempts = len(completed_attempts)
    passed_count = sum(1 for att in completed_attempts if att.is_passed)
    failed_count = total_attempts - passed_count

    avg_score = 0.0
    pass_pct = 0.0
    if total_attempts > 0:
        avg_score = round(sum(att.score_obtained for att in completed_attempts) / total_attempts, 2)
        pass_pct = round((passed_count / total_attempts) * 100.0, 1)

    items = [
        AssessmentMonitoringItem(
            attempt_id=att.id,
            user_id=att.user_id,
            user_name=att.user.full_name if att.user else "Trainee",
            user_email=att.user.email if att.user else "",
            score_obtained=att.score_obtained,
            total_marks=assessment.total_marks,
            is_passed=att.is_passed,
            attempt_status=att.attempt_status,
            start_time=att.start_time,
            end_time=att.end_time,
        )
        for att in sorted(completed_attempts, key=lambda x: x.start_time, reverse=True)
    ]

    return AssessmentMonitoringResponse(
        assessment_id=assessment.id,
        title=assessment.title,
        subject=assessment.subject,
        total_attempts=total_attempts,
        passed_count=passed_count,
        failed_count=failed_count,
        average_score=avg_score,
        pass_percentage=pass_pct,
        attempts=items,
    )
