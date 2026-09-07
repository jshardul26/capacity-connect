from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_approved_user,
    require_admin,
)
from app.models.user import User, TrainerProfile
from app.models.trainer import Course, Assessment, TrainerExpertise
from app.models.learning import CourseFeedback
from app.models.competency import Competency, TraineeCompetency, CourseCompetency
from app.schemas.competency import (
    CompetencyResponse,
    CompetencyTaxonomyResponse,
    TraineeCompetencyItem,
    TraineeCompetencyMatrixResponse,
    TraineeCompetencyUpdateRequest,
    SkillGapAnalysisResponse,
    CourseRecommendationItem,
    CourseCompetencyItem,
    CourseCompetencyMapRequest,
    AssessmentCompetencyMapRequest,
    TrainerMatchRequest,
    TrainerMatchItem,
    TrainerMatchResponse,
    RoleBenchmarkResponse,
)
from app.ai_engine.competency_gap import (
    DEFAULT_COMPETENCIES,
    STANDARD_ROLE_BENCHMARKS,
    compute_skill_gaps,
    recommend_courses_cosine_similarity,
    match_trainers_for_subject,
    normalize_role_key,
)

router = APIRouter(prefix="/competency", tags=["Competency & Intelligent Matching"])


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def ensure_default_competencies(db: AsyncSession):
    """Auto-seeds standard domain competencies if database table is empty."""
    stmt = select(func.count(Competency.id))
    result = await db.execute(stmt)
    count = result.scalar() or 0
    if count == 0:
        for c_data in DEFAULT_COMPETENCIES:
            comp = Competency(
                id=c_data["id"],
                name=c_data["name"],
                domain=c_data["domain"],
                description=c_data["description"],
                created_at=get_utc_now()
            )
            db.add(comp)
        await db.commit()


@router.get("/taxonomy", response_model=CompetencyTaxonomyResponse)
async def get_competency_taxonomy(
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve global catalog of standardized operational domain competencies.
    Auto-seeds standard taxonomy if database table is empty.
    """
    await ensure_default_competencies(db)
    stmt = select(Competency).order_by(Competency.domain.asc(), Competency.name.asc())
    result = await db.execute(stmt)
    competencies = result.scalars().all()
    return CompetencyTaxonomyResponse(
        total=len(competencies),
        competencies=[CompetencyResponse.model_validate(c) for c in competencies]
    )


@router.get("/roles", response_model=List[RoleBenchmarkResponse])
async def get_role_benchmarks(
    current_user: User = Depends(require_approved_user),
):
    """
    Retrieve list of standardized MoES/IMD role benchmarks and required competency proficiency vectors.
    """
    results = []
    for key, data in STANDARD_ROLE_BENCHMARKS.items():
        results.append(
            RoleBenchmarkResponse(
                role_key=key,
                title=data["title"],
                description=data["description"],
                requirements=data["requirements"],
            )
        )
    return results


@router.get("/trainee/{user_id}/matrix", response_model=TraineeCompetencyMatrixResponse)
async def get_trainee_competency_matrix(
    user_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve trainee competency vector for radar charts.
    Trainees can view their own profile; Trainers and Admins can view any trainee.
    """
    if current_user.role.name == "trainee" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainees can only inspect their own competency matrix."
        )

    # Verify target user exists
    target_user_res = await db.execute(select(User).where(User.id == user_id))
    target_user = target_user_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    await ensure_default_competencies(db)

    # Fetch all domain competencies
    all_comps_res = await db.execute(select(Competency).order_by(Competency.name.asc()))
    all_competencies = all_comps_res.scalars().all()

    # Fetch evaluated proficiencies for this trainee
    tc_res = await db.execute(
        select(TraineeCompetency).where(TraineeCompetency.user_id == user_id)
    )
    evaluated = {tc.competency_id: tc for tc in tc_res.scalars().all()}

    matrix_items = []
    for comp in all_competencies:
        tc = evaluated.get(comp.id)
        level = tc.proficiency_level if tc else 0.0
        last_eval = tc.last_evaluated_at if tc else comp.created_at

        matrix_items.append(
            TraineeCompetencyItem(
                id=tc.id if tc else f"unassessed-{comp.id}",
                competency_id=comp.id,
                name=comp.name,
                domain=comp.domain,
                proficiency_level=round(level, 2),
                level_percentage=round(level * 100.0, 1),
                last_evaluated_at=last_eval,
            )
        )

    return TraineeCompetencyMatrixResponse(
        user_id=target_user.id,
        user_name=target_user.full_name,
        competencies=matrix_items,
    )


@router.get("/gaps", response_model=SkillGapAnalysisResponse)
async def get_competency_gaps(
    target_role: str = Query("Senior_Radar_Meteorologist", description="Target job role key"),
    user_id: Optional[str] = Query(None, description="Optional target user ID (defaults to self)"),
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Calculate deterministic skill gaps against a target job role.
    """
    eval_user_id = user_id or current_user.id
    if current_user.role.name == "trainee" and eval_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainees can only inspect their own skill gaps."
        )

    await ensure_default_competencies(db)

    # Fetch all competencies
    all_comps_res = await db.execute(select(Competency))
    all_comps = [
        {"id": c.id, "name": c.name, "domain": c.domain}
        for c in all_comps_res.scalars().all()
    ]

    # Fetch evaluated proficiencies for user
    tc_res = await db.execute(
        select(TraineeCompetency, Competency.name)
        .join(Competency, TraineeCompetency.competency_id == Competency.id)
        .where(TraineeCompetency.user_id == eval_user_id)
    )
    current_proficiencies = {}
    for tc, comp_name in tc_res.all():
        current_proficiencies[comp_name] = tc.proficiency_level

    gap_result = compute_skill_gaps(
        current_proficiencies=current_proficiencies,
        target_role=target_role,
        all_competencies=all_comps,
    )

    return SkillGapAnalysisResponse(**gap_result)


@router.get("/recommendations/courses", response_model=List[CourseRecommendationItem])
async def get_course_recommendations(
    target_role: str = Query("Senior_Radar_Meteorologist", description="Target job role"),
    user_id: Optional[str] = Query(None, description="Optional user ID"),
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AI-recommended courses based on vector cosine similarity between skill gap vector and course yield vectors.
    """
    eval_user_id = user_id or current_user.id
    if current_user.role.name == "trainee" and eval_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainees can only inspect their own recommendations."
        )

    await ensure_default_competencies(db)

    # 1. Fetch all competencies
    all_comps_res = await db.execute(select(Competency))
    all_competencies = [
        {"id": c.id, "name": c.name, "domain": c.domain}
        for c in all_comps_res.scalars().all()
    ]

    # 2. Fetch current proficiencies
    tc_res = await db.execute(
        select(TraineeCompetency, Competency.name)
        .join(Competency, TraineeCompetency.competency_id == Competency.id)
        .where(TraineeCompetency.user_id == eval_user_id)
    )
    current_proficiencies = {name: tc.proficiency_level for tc, name in tc_res.all()}

    # 3. Calculate gaps
    gap_result = compute_skill_gaps(
        current_proficiencies=current_proficiencies,
        target_role=target_role,
        all_competencies=all_competencies,
    )
    gaps_dict = {item["competency"]: item["gap"] for item in gap_result["gaps"]}

    # 4. Fetch all published courses with their mapped competencies
    courses_res = await db.execute(
        select(Course)
        .options(
            selectinload(Course.competencies_yield).selectinload(CourseCompetency.competency)
        )
        .where(Course.is_published.is_(True))
    )
    courses = courses_res.scalars().all()

    courses_with_yields = []
    for c in courses:
        yields_dict = {}
        for cy in c.competencies_yield:
            if cy.competency:
                yields_dict[cy.competency.name] = cy.yield_level

        if yields_dict:
            courses_with_yields.append({
                "id": c.id,
                "title": c.title,
                "code": c.code,
                "thumbnail_url": c.thumbnail_url,
                "yields": yields_dict,
            })

    # 5. Run Scikit-Learn Cosine Similarity
    recommendations = recommend_courses_cosine_similarity(
        gaps_dict=gaps_dict,
        courses_with_yields=courses_with_yields,
        all_competencies=all_competencies,
    )

    return [CourseRecommendationItem(**rec) for rec in recommendations]


@router.post("/match-trainer", response_model=TrainerMatchResponse)
async def match_optimal_trainers(
    payload: TrainerMatchRequest,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Recommend optimal trainers for a given subject using deterministic explainable scoring:
    M(p, D) = 0.60 * CosineSim(E_p, D) + 0.25 * min(1.0, Y_p/15) + 0.15 * (S_p/5.0)
    Access restricted to Admin and Trainer users.
    """
    if current_user.role.name not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and trainers can run trainer-matching algorithms."
        )

    # Fetch all approved trainers with their profiles and expertise
    stmt = (
        select(User)
        .options(
            selectinload(User.trainer_profile).selectinload(TrainerProfile.expertise),
            selectinload(User.courses_created).selectinload(Course.feedbacks),
        )
        .join(User.role)
        .where(and_(User.role.has(name="trainer"), User.status == "approved"))
    )
    result = await db.execute(stmt)
    trainers = result.scalars().all()

    trainers_data = []
    for tr in trainers:
        prof = tr.trainer_profile
        years_exp = prof.years_of_experience if prof and prof.years_of_experience else 0.0

        # Calculate average feedback rating from taught courses
        ratings = []
        for crs in tr.courses_created:
            for fb in crs.feedbacks:
                if fb.rating:
                    ratings.append(fb.rating)
        avg_rating = sum(ratings) / len(ratings) if ratings else 4.6

        exp_list = []
        if prof and prof.expertise:
            for ex in prof.expertise:
                exp_list.append({
                    "subject": ex.subject,
                    "proficiency_level": ex.proficiency_level,
                    "years_in_subject": ex.years_in_subject,
                })

        trainers_data.append({
            "user_id": tr.id,
            "full_name": tr.full_name,
            "email": tr.email,
            "station_code": tr.station_code,
            "years_of_experience": years_exp,
            "satisfaction_rating": avg_rating,
            "expertise": exp_list,
        })

    await ensure_default_competencies(db)
    competencies_result = await db.execute(select(Competency).order_by(Competency.name.asc()))
    all_competencies = [
        {
            "id": competency.id,
            "name": competency.name,
            "domain": competency.domain,
            "description": competency.description or "",
        }
        for competency in competencies_result.scalars().all()
    ]

    matched_results = match_trainers_for_subject(
        trainers_data=trainers_data,
        subject=payload.subject,
        minimum_experience_years=payload.minimum_experience_years or 0.0,
        all_competencies=all_competencies,
        competency_id=payload.competency_id,
    )

    return TrainerMatchResponse(
        subject=payload.subject,
        total_matched=len(matched_results),
        trainers=[TrainerMatchItem(**item) for item in matched_results],
    )


@router.post("/courses/{course_id}/mapping", response_model=CourseCompetencyItem)
async def map_course_competency(
    course_id: str,
    payload: CourseCompetencyMapRequest,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Maps an imparted competency and yield level to a course.
    Restricted to Course author (Trainer) or Admin.
    """
    crs_res = await db.execute(select(Course).where(Course.id == course_id))
    course = crs_res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    if current_user.role.name != "admin" and course.trainer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only configure competencies for courses you authored."
        )

    # Verify competency exists
    comp_res = await db.execute(select(Competency).where(Competency.id == payload.competency_id))
    comp = comp_res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found.")

    # Upsert course_competencies
    existing_res = await db.execute(
        select(CourseCompetency).where(
            and_(
                CourseCompetency.course_id == course_id,
                CourseCompetency.competency_id == payload.competency_id
            )
        )
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        existing.yield_level = payload.yield_level
        record = existing
    else:
        record = CourseCompetency(
            course_id=course_id,
            competency_id=payload.competency_id,
            yield_level=payload.yield_level,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    return CourseCompetencyItem(
        competency_id=comp.id,
        competency_name=comp.name,
        domain=comp.domain,
        yield_level=record.yield_level,
    )


@router.get("/courses/{course_id}/mapping", response_model=List[CourseCompetencyItem])
async def get_course_competencies(
    course_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all competencies and yield levels imparted by a course.
    """
    stmt = (
        select(CourseCompetency, Competency)
        .join(Competency, CourseCompetency.competency_id == Competency.id)
        .where(CourseCompetency.course_id == course_id)
    )
    result = await db.execute(stmt)
    records = result.all()

    return [
        CourseCompetencyItem(
            competency_id=comp.id,
            competency_name=comp.name,
            domain=comp.domain,
            yield_level=cc.yield_level,
        )
        for cc, comp in records
    ]


@router.post("/assessments/{assessment_id}/mapping")
async def map_assessment_competency(
    assessment_id: str,
    payload: AssessmentCompetencyMapRequest,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Maps an assessment to evaluate a specific domain competency.
    Restricted to Assessment author (Trainer) or Admin.
    """
    asm_res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = asm_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    if current_user.role.name != "admin" and assessment.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only map competencies for assessments you created."
        )

    comp_res = await db.execute(select(Competency).where(Competency.id == payload.competency_id))
    comp = comp_res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found.")

    assessment.competency_id = payload.competency_id
    await db.commit()

    return {
        "message": f"Assessment '{assessment.title}' mapped to competency '{comp.name}'.",
        "assessment_id": assessment.id,
        "competency_id": comp.id,
        "competency_name": comp.name,
    }


@router.post("/trainee/{user_id}/update", response_model=TraineeCompetencyItem)
async def update_trainee_competency(
    user_id: str,
    payload: TraineeCompetencyUpdateRequest,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Directly update a trainee's competency proficiency level.
    Restricted to Admin or Trainer.
    """
    if current_user.role.name not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and trainers can evaluate competency levels."
        )

    comp_res = await db.execute(select(Competency).where(Competency.id == payload.competency_id))
    comp = comp_res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found.")

    tc_res = await db.execute(
        select(TraineeCompetency).where(
            and_(
                TraineeCompetency.user_id == user_id,
                TraineeCompetency.competency_id == payload.competency_id,
            )
        )
    )
    tc = tc_res.scalar_one_or_none()
    now = get_utc_now()

    if tc:
        tc.proficiency_level = payload.proficiency_level
        tc.last_evaluated_at = now
        record = tc
    else:
        record = TraineeCompetency(
            user_id=user_id,
            competency_id=payload.competency_id,
            proficiency_level=payload.proficiency_level,
            last_evaluated_at=now,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    return TraineeCompetencyItem(
        id=record.id,
        competency_id=comp.id,
        name=comp.name,
        domain=comp.domain,
        proficiency_level=record.proficiency_level,
        level_percentage=round(record.proficiency_level * 100.0, 1),
        last_evaluated_at=record.last_evaluated_at,
    )
