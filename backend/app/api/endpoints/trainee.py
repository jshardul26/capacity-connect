import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_trainee
from app.models.user import User, TraineeProfile
from app.models.trainee import (
    Qualification,
    WorkExperience,
    Skill,
    Interest,
    Certificate,
)
from app.schemas.trainee import (
    TraineeProfileUpdate,
    TraineeProfileResponse,
    TraineeProfileFull,
    QualificationCreate,
    QualificationResponse,
    WorkExperienceCreate,
    WorkExperienceResponse,
    SkillCreate,
    SkillResponse,
    InterestCreate,
    InterestResponse,
    CertificateCreate,
    CertificateResponse,
    TraineeDashboardResponse,
    TraineeDashboardMetrics,
)

logger = logging.getLogger("capacity_connect.trainee")
router = APIRouter()


async def get_or_create_trainee_profile(user: User, db: AsyncSession) -> TraineeProfile:
    """Helper to ensure a TraineeProfile record exists for the authenticated user."""
    stmt = (
        select(TraineeProfile)
        .options(
            selectinload(TraineeProfile.qualifications),
            selectinload(TraineeProfile.work_experiences),
            selectinload(TraineeProfile.skills),
            selectinload(TraineeProfile.interests),
        )
        .where(TraineeProfile.user_id == user.id)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        profile = TraineeProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        # Re-fetch with loaded relationships
        result = await db.execute(stmt)
        profile = result.scalar_one()

    return profile


# ----------------------------------------------------------------------
# 1. Profile Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/profile",
    response_model=TraineeProfileFull,
    summary="Get current trainee's full professional profile"
)
async def get_my_profile(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> TraineeProfileFull:
    profile = await get_or_create_trainee_profile(current_user, db)

    # Fetch user certificates
    cert_stmt = select(Certificate).where(Certificate.user_id == current_user.id)
    cert_result = await db.execute(cert_stmt)
    certificates = cert_result.scalars().all()

    return TraineeProfileFull(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        station_code=current_user.station_code,
        organization=current_user.organization,
        role=current_user.role.name if current_user.role else "trainee",
        status=current_user.status,
        designation=profile.designation,
        department=profile.department,
        posting_location=profile.posting_location,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        qualifications=profile.qualifications,
        work_experiences=profile.work_experiences,
        skills=profile.skills,
        interests=profile.interests,
        certificates=certificates,
    )


@router.put(
    "/profile",
    response_model=TraineeProfileResponse,
    summary="Update current trainee's profile information"
)
async def update_my_profile(
    payload: TraineeProfileUpdate,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> TraineeProfileResponse:
    profile = await get_or_create_trainee_profile(current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    await db.commit()
    await db.refresh(profile)
    logger.info(f"Trainee '{current_user.email}' updated their profile.")
    return TraineeProfileResponse.model_validate(profile)


# ----------------------------------------------------------------------
# 2. Qualifications Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/qualifications",
    response_model=List[QualificationResponse],
    summary="List current trainee's qualifications"
)
async def list_my_qualifications(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> List[QualificationResponse]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = (
        select(Qualification)
        .where(Qualification.trainee_profile_id == profile.id)
        .order_by(Qualification.passing_year.desc())
    )
    result = await db.execute(stmt)
    return [QualificationResponse.model_validate(q) for q in result.scalars().all()]


@router.post(
    "/qualifications",
    response_model=QualificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an academic or professional qualification"
)
async def add_qualification(
    payload: QualificationCreate,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> QualificationResponse:
    profile = await get_or_create_trainee_profile(current_user, db)

    new_qual = Qualification(
        trainee_profile_id=profile.id,
        degree=payload.degree,
        field_of_study=payload.field_of_study,
        institution=payload.institution,
        passing_year=payload.passing_year,
        grade_or_percentage=payload.grade_or_percentage,
    )
    db.add(new_qual)
    await db.commit()
    await db.refresh(new_qual)
    return QualificationResponse.model_validate(new_qual)


@router.delete(
    "/qualifications/{qualification_id}",
    summary="Delete a qualification"
)
async def delete_qualification(
    qualification_id: str,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = select(Qualification).where(
        Qualification.id == qualification_id,
        Qualification.trainee_profile_id == profile.id
    )
    result = await db.execute(stmt)
    qual = result.scalar_one_or_none()

    if not qual:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Qualification record not found or does not belong to you."
        )

    await db.delete(qual)
    await db.commit()
    return {"message": "Qualification deleted successfully"}


# ----------------------------------------------------------------------
# 3. Work Experiences Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/work-experiences",
    response_model=List[WorkExperienceResponse],
    summary="List current trainee's work experience entries"
)
async def list_my_work_experiences(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> List[WorkExperienceResponse]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = (
        select(WorkExperience)
        .where(WorkExperience.trainee_profile_id == profile.id)
        .order_by(WorkExperience.start_date.desc())
    )
    result = await db.execute(stmt)
    return [WorkExperienceResponse.model_validate(we) for we in result.scalars().all()]


@router.post(
    "/work-experiences",
    response_model=WorkExperienceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a work experience entry"
)
async def add_work_experience(
    payload: WorkExperienceCreate,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> WorkExperienceResponse:
    profile = await get_or_create_trainee_profile(current_user, db)

    new_we = WorkExperience(
        trainee_profile_id=profile.id,
        organization=payload.organization,
        designation=payload.designation,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_current=payload.is_current,
        responsibilities=payload.responsibilities,
    )
    db.add(new_we)
    await db.commit()
    await db.refresh(new_we)
    return WorkExperienceResponse.model_validate(new_we)


@router.delete(
    "/work-experiences/{experience_id}",
    summary="Delete a work experience entry"
)
async def delete_work_experience(
    experience_id: str,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = select(WorkExperience).where(
        WorkExperience.id == experience_id,
        WorkExperience.trainee_profile_id == profile.id
    )
    result = await db.execute(stmt)
    we = result.scalar_one_or_none()

    if not we:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience record not found or does not belong to you."
        )

    await db.delete(we)
    await db.commit()
    return {"message": "Work experience deleted successfully"}


# ----------------------------------------------------------------------
# 4. Skills Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/skills",
    response_model=List[SkillResponse],
    summary="List current trainee's skills"
)
async def list_my_skills(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> List[SkillResponse]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = select(Skill).where(Skill.trainee_profile_id == profile.id).order_by(Skill.name)
    result = await db.execute(stmt)
    return [SkillResponse.model_validate(s) for s in result.scalars().all()]


@router.post(
    "/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a skill"
)
async def add_skill(
    payload: SkillCreate,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> SkillResponse:
    profile = await get_or_create_trainee_profile(current_user, db)

    new_skill = Skill(
        trainee_profile_id=profile.id,
        name=payload.name,
        proficiency_level=payload.proficiency_level,
    )
    db.add(new_skill)
    await db.commit()
    await db.refresh(new_skill)
    return SkillResponse.model_validate(new_skill)


@router.delete(
    "/skills/{skill_id}",
    summary="Delete a skill"
)
async def delete_skill(
    skill_id: str,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = select(Skill).where(
        Skill.id == skill_id,
        Skill.trainee_profile_id == profile.id
    )
    result = await db.execute(stmt)
    skill = result.scalar_one_or_none()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill record not found or does not belong to you."
        )

    await db.delete(skill)
    await db.commit()
    return {"message": "Skill deleted successfully"}


# ----------------------------------------------------------------------
# 5. Interests Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/interests",
    response_model=List[InterestResponse],
    summary="List current trainee's interests"
)
async def list_my_interests(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> List[InterestResponse]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = select(Interest).where(Interest.trainee_profile_id == profile.id).order_by(Interest.name)
    result = await db.execute(stmt)
    return [InterestResponse.model_validate(i) for i in result.scalars().all()]


@router.post(
    "/interests",
    response_model=InterestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an interest"
)
async def add_interest(
    payload: InterestCreate,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> InterestResponse:
    profile = await get_or_create_trainee_profile(current_user, db)

    new_int = Interest(
        trainee_profile_id=profile.id,
        name=payload.name,
    )
    db.add(new_int)
    await db.commit()
    await db.refresh(new_int)
    return InterestResponse.model_validate(new_int)


@router.delete(
    "/interests/{interest_id}",
    summary="Delete an interest"
)
async def delete_interest(
    interest_id: str,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    profile = await get_or_create_trainee_profile(current_user, db)
    stmt = select(Interest).where(
        Interest.id == interest_id,
        Interest.trainee_profile_id == profile.id
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interest record not found or does not belong to you."
        )

    await db.delete(item)
    await db.commit()
    return {"message": "Interest deleted successfully"}


# ----------------------------------------------------------------------
# 6. Certificates Endpoints
# ----------------------------------------------------------------------

@router.get(
    "/certificates",
    response_model=List[CertificateResponse],
    summary="List current trainee's certificates"
)
async def list_my_certificates(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> List[CertificateResponse]:
    stmt = (
        select(Certificate)
        .where(Certificate.user_id == current_user.id)
        .order_by(Certificate.issue_date.desc())
    )
    result = await db.execute(stmt)
    return [CertificateResponse.model_validate(c) for c in result.scalars().all()]


@router.post(
    "/certificates",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a certificate record"
)
async def add_certificate(
    payload: CertificateCreate,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> CertificateResponse:
    new_cert = Certificate(
        user_id=current_user.id,
        title=payload.title,
        issuing_organization=payload.issuing_organization,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        credential_id=payload.credential_id,
        certificate_url=payload.certificate_url,
        is_system_generated=False,
    )
    db.add(new_cert)
    await db.commit()
    await db.refresh(new_cert)
    return CertificateResponse.model_validate(new_cert)


@router.delete(
    "/certificates/{certificate_id}",
    summary="Delete a certificate record"
)
async def delete_certificate(
    certificate_id: str,
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    stmt = select(Certificate).where(
        Certificate.id == certificate_id,
        Certificate.user_id == current_user.id
    )
    result = await db.execute(stmt)
    cert = result.scalar_one_or_none()

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate record not found or does not belong to you."
        )

    await db.delete(cert)
    await db.commit()
    return {"message": "Certificate deleted successfully"}


# ----------------------------------------------------------------------
# 7. Dashboard Overview Endpoint
# ----------------------------------------------------------------------

@router.get(
    "/dashboard",
    response_model=TraineeDashboardResponse,
    summary="Trainee Dashboard overview and completion metrics"
)
async def get_trainee_dashboard(
    current_user: User = Depends(require_trainee),
    db: AsyncSession = Depends(get_db)
) -> TraineeDashboardResponse:
    profile = await get_or_create_trainee_profile(current_user, db)

    # Fetch user certificates
    cert_stmt = select(Certificate).where(Certificate.user_id == current_user.id)
    cert_result = await db.execute(cert_stmt)
    certificates = cert_result.scalars().all()

    # Calculate Profile Completion Score (up to 100%)
    score = 0
    if profile.designation or profile.department:
        score += 20
    if profile.bio:
        score += 20
    if len(profile.qualifications) > 0:
        score += 20
    if len(profile.work_experiences) > 0:
        score += 15
    if len(profile.skills) > 0:
        score += 15
    if len(certificates) > 0:
        score += 10

    metrics = TraineeDashboardMetrics(
        total_qualifications=len(profile.qualifications),
        total_experiences=len(profile.work_experiences),
        total_skills=len(profile.skills),
        total_interests=len(profile.interests),
        total_certificates=len(certificates),
        profile_completion_percentage=min(score, 100),
    )

    return TraineeDashboardResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        station_code=current_user.station_code,
        organization=current_user.organization,
        designation=profile.designation,
        department=profile.department,
        metrics=metrics,
        qualifications=profile.qualifications,
        work_experiences=profile.work_experiences,
        skills=profile.skills,
        interests=profile.interests,
        certificates=certificates,
    )
