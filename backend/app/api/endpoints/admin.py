import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, distinct
from sqlalchemy.orm import joinedload, selectinload

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User, Role, TraineeProfile, TrainerProfile
from app.models.trainer import Course, CourseModule, Assessment
from app.models.learning import CourseEnrollment, CourseFeedback
from app.models.trainee import Certificate
from app.models.assessment import AssessmentAttempt
from app.models.admin import Announcement, Notification, Achievement, AuditLog
from app.schemas.user import UserPublic
from app.schemas.admin import (
    AdminDashboardMetrics,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
    UserListItem,
    AdminCourseItem,
    AdminEnrollmentItem,
    AdminAssessmentItem,
    AdminCertificateItem,
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    NotificationCreate,
    NotificationResponse,
    AchievementCreate,
    AchievementResponse,
    AuditLogResponse,
)

logger = logging.getLogger("capacity_connect.admin")
router = APIRouter()


async def log_admin_action(
    db: AsyncSession,
    admin_id: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None
) -> None:
    """Helper to record immutable administrative audit entries."""
    audit_entry = AuditLog(
        admin_user_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details
    )
    db.add(audit_entry)


# ---------------------------------------------------------------------------
# 1. ADMIN DASHBOARD METRICS
# ---------------------------------------------------------------------------

@router.get(
    "/dashboard",
    response_model=AdminDashboardMetrics,
    summary="Get aggregated institutional platform analytics"
)
async def get_admin_dashboard_metrics(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> AdminDashboardMetrics:
    """
    Computes comprehensive platform statistics across users, curriculum, enrollments,
    assessments, certifications, and operational IMD stations.
    """
    # 1. User metrics
    total_users_res = await db.execute(select(func.count(User.id)))
    total_users = total_users_res.scalar() or 0

    pending_res = await db.execute(select(func.count(User.id)).where(User.status == "pending_approval"))
    pending_approvals = pending_res.scalar() or 0

    approved_res = await db.execute(select(func.count(User.id)).where(User.status == "approved"))
    approved_users = approved_res.scalar() or 0

    rejected_res = await db.execute(select(func.count(User.id)).where(User.status == "rejected"))
    rejected_users = rejected_res.scalar() or 0

    suspended_res = await db.execute(select(func.count(User.id)).where(User.status == "suspended"))
    suspended_users = suspended_res.scalar() or 0

    # Role breakdown
    trainees_res = await db.execute(
        select(func.count(User.id)).join(User.role).where(Role.name == "trainee")
    )
    trainees_count = trainees_res.scalar() or 0

    trainers_res = await db.execute(
        select(func.count(User.id)).join(User.role).where(Role.name == "trainer")
    )
    trainers_count = trainers_res.scalar() or 0

    admins_res = await db.execute(
        select(func.count(User.id)).join(User.role).where(Role.name == "admin")
    )
    admins_count = admins_res.scalar() or 0

    # 2. Course metrics
    courses_res = await db.execute(select(func.count(Course.id)))
    total_courses = courses_res.scalar() or 0

    pub_courses_res = await db.execute(select(func.count(Course.id)).where(Course.is_published.is_(True)))
    published_courses = pub_courses_res.scalar() or 0

    draft_courses = total_courses - published_courses

    # 3. Enrollment metrics
    enrollments_res = await db.execute(select(func.count(CourseEnrollment.id)))
    total_enrollments = enrollments_res.scalar() or 0

    completed_enr_res = await db.execute(
        select(func.count(CourseEnrollment.id)).where(CourseEnrollment.status == "completed")
    )
    completed_enrollments = completed_enr_res.scalar() or 0

    # 4. Assessment metrics
    assessments_res = await db.execute(select(func.count(Assessment.id)))
    total_assessments = assessments_res.scalar() or 0

    attempts_res = await db.execute(select(func.count(AssessmentAttempt.id)))
    total_attempts = attempts_res.scalar() or 0

    passed_attempts_res = await db.execute(
        select(func.count(AssessmentAttempt.id)).where(AssessmentAttempt.is_passed.is_(True))
    )
    passed_attempts = passed_attempts_res.scalar() or 0
    overall_pass_rate = round((passed_attempts / total_attempts * 100), 2) if total_attempts > 0 else 0.0

    # 5. Certifications & Stations
    certs_res = await db.execute(select(func.count(Certificate.id)))
    total_certs = certs_res.scalar() or 0

    stations_res = await db.execute(
        select(func.count(distinct(User.station_code))).where(User.station_code.isnot(None))
    )
    unique_stations = stations_res.scalar() or 0

    return AdminDashboardMetrics(
        total_users=total_users,
        trainees_count=trainees_count,
        trainers_count=trainers_count,
        admins_count=admins_count,
        pending_approvals_count=pending_approvals,
        approved_users_count=approved_users,
        rejected_users_count=rejected_users,
        suspended_users_count=suspended_users,
        total_courses=total_courses,
        published_courses_count=published_courses,
        draft_courses_count=draft_courses,
        total_enrollments=total_enrollments,
        completed_enrollments_count=completed_enrollments,
        total_assessments=total_assessments,
        total_assessment_attempts=total_attempts,
        overall_pass_rate_percentage=overall_pass_rate,
        total_certificates_issued=total_certs,
        unique_stations_count=unique_stations,
    )


# ---------------------------------------------------------------------------
# 2. USER DIRECTORY, APPROVAL, ROLES & GOVERNANCE
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=List[UserListItem],
    summary="List all users with optional filtering and pagination"
)
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role: trainee, trainer, admin"),
    status_filter: Optional[str] = Query(None, alias="status", description="pending_approval, approved, rejected, suspended"),
    search: Optional[str] = Query(None, description="Search in name, email, or station code"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[UserListItem]:
    """
    Search and browse registered users across the entire organization.
    """
    stmt = select(User).options(joinedload(User.role)).order_by(User.created_at.desc())

    if role:
        stmt = stmt.join(User.role).where(Role.name == role)
    if status_filter:
        stmt = stmt.where(User.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                User.full_name.ilike(term),
                User.email.ilike(term),
                User.station_code.ilike(term)
            )
        )

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return [
        UserListItem(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone_number=u.phone_number,
            station_code=u.station_code,
            organization=u.organization,
            role=u.role.name if u.role else "trainee",
            status=u.status,
            created_at=u.created_at
        )
        for u in users
    ]


@router.get(
    "/users/pending",
    response_model=List[UserPublic],
    summary="Get list of users awaiting administrative approval"
)
async def get_pending_users(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[UserPublic]:
    """
    Retrieves all newly registered accounts with status 'pending_approval'.
    """
    result = await db.execute(
        select(User)
        .options(joinedload(User.role))
        .where(User.status == "pending_approval")
        .order_by(User.created_at.asc())
    )
    users = result.scalars().all()

    return [
        UserPublic(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone_number=u.phone_number,
            station_code=u.station_code,
            organization=u.organization,
            role=u.role.name if u.role else "trainee",
            status=u.status,
            created_at=u.created_at
        )
        for u in users
    ]


@router.post(
    "/users/{user_id}/approve",
    summary="Approve pending user account"
)
async def approve_user(
    user_id: str,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Approves a pending user account and ensures their corresponding persona profile exists.
    """
    result = await db.execute(
        select(User).options(joinedload(User.role)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found."
        )

    user.status = "approved"

    # Provision profile if missing
    if user.role and user.role.name == "trainee":
        prof_res = await db.execute(select(TraineeProfile).where(TraineeProfile.user_id == user.id))
        if not prof_res.scalar_one_or_none():
            db.add(TraineeProfile(user_id=user.id))
    elif user.role and user.role.name == "trainer":
        prof_res = await db.execute(select(TrainerProfile).where(TrainerProfile.user_id == user.id))
        if not prof_res.scalar_one_or_none():
            db.add(TrainerProfile(user_id=user.id))

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="USER_APPROVE",
        target_type="user",
        target_id=user.id,
        details=f"Approved user {user.email} with role {user.role.name if user.role else 'trainee'}"
    )

    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin '{admin_user.email}' approved user '{user.email}' (ID: {user.id})")

    return {
        "status": "approved",
        "user_id": user.id,
        "email": user.email,
        "message": f"User '{user.email}' has been approved successfully."
    }


@router.post(
    "/users/{user_id}/reject",
    summary="Reject user account registration"
)
async def reject_user(
    user_id: str,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Rejects a user account registration.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found."
        )

    user.status = "rejected"

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="USER_REJECT",
        target_type="user",
        target_id=user.id,
        details=f"Rejected registration for {user.email}"
    )

    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin '{admin_user.email}' rejected user '{user.email}' (ID: {user.id})")

    return {
        "status": "rejected",
        "user_id": user.id,
        "email": user.email,
        "message": f"User '{user.email}' registration was rejected."
    }


@router.put(
    "/users/{user_id}/role",
    summary="Update user role"
)
async def update_user_role(
    user_id: str,
    body: UserRoleUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Updates the system role of a target user (e.g., promote Trainee to Trainer or Admin).
    """
    target_role_name = body.role.lower().strip()
    if target_role_name not in ["trainee", "trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'trainee', 'trainer', 'admin'"
        )

    role_res = await db.execute(select(Role).where(Role.name == target_role_name))
    new_role = role_res.scalar_one_or_none()
    if not new_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role '{target_role_name}' not found."
        )

    user_res = await db.execute(
        select(User).options(joinedload(User.role)).where(User.id == user_id)
    )
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found."
        )

    old_role_name = user.role.name if user.role else "unknown"
    user.role_id = new_role.id

    # Auto provision persona profile if promoted
    if target_role_name == "trainer":
        prof_res = await db.execute(select(TrainerProfile).where(TrainerProfile.user_id == user.id))
        if not prof_res.scalar_one_or_none():
            db.add(TrainerProfile(user_id=user.id))
    elif target_role_name == "trainee":
        prof_res = await db.execute(select(TraineeProfile).where(TraineeProfile.user_id == user.id))
        if not prof_res.scalar_one_or_none():
            db.add(TraineeProfile(user_id=user.id))

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="USER_ROLE_UPDATE",
        target_type="user",
        target_id=user.id,
        details=f"Updated role of {user.email} from {old_role_name} to {target_role_name}"
    )

    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin '{admin_user.email}' changed role of '{user.email}' to '{target_role_name}'")

    return {
        "status": "success",
        "user_id": user.id,
        "email": user.email,
        "new_role": target_role_name,
        "message": f"Role updated to '{target_role_name}' successfully."
    }


@router.put(
    "/users/{user_id}/status",
    summary="Update user account status"
)
async def update_user_status(
    user_id: str,
    body: UserStatusUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Updates the account status of a user ('approved', 'rejected', 'suspended', 'pending_approval').
    """
    valid_statuses = ["approved", "rejected", "suspended", "pending_approval"]
    target_status = body.status.lower().strip()
    if target_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of: {valid_statuses}"
        )

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found."
        )

    old_status = user.status
    user.status = target_status

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="USER_STATUS_UPDATE",
        target_type="user",
        target_id=user.id,
        details=f"Updated status of {user.email} from {old_status} to {target_status}"
    )

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "user_id": user.id,
        "email": user.email,
        "new_status": target_status,
        "message": f"User status updated to '{target_status}' successfully."
    }


# ---------------------------------------------------------------------------
# 3. CURRICULUM, ENROLLMENT & ASSESSMENT GOVERNANCE
# ---------------------------------------------------------------------------

@router.get(
    "/courses",
    response_model=List[AdminCourseItem],
    summary="Audit all courses across all trainers"
)
async def admin_list_courses(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AdminCourseItem]:
    """
    Returns all published and draft courses with enrollment counts, ratings, and trainer details.
    """
    result = await db.execute(
        select(Course)
        .options(
            joinedload(Course.trainer),
            selectinload(Course.modules),
            selectinload(Course.enrollments),
            selectinload(Course.feedbacks)
        )
        .order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()

    items = []
    for c in courses:
        modules_count = len(c.modules) if c.modules else 0
        enrollments_count = len(c.enrollments) if c.enrollments else 0
        feedbacks = c.feedbacks or []
        avg_rating = round(sum(f.rating for f in feedbacks) / len(feedbacks), 1) if feedbacks else 0.0

        items.append(
            AdminCourseItem(
                id=c.id,
                title=c.title,
                code=c.code,
                trainer_id=c.trainer_id,
                trainer_name=c.trainer.full_name if c.trainer else "Unknown",
                category=c.category,
                level=c.level,
                is_published=c.is_published,
                modules_count=modules_count,
                enrollments_count=enrollments_count,
                average_rating=avg_rating,
                created_at=c.created_at
            )
        )
    return items


@router.put(
    "/courses/{course_id}/publish",
    summary="Toggle publishing status of a course"
)
async def admin_toggle_course_publish(
    course_id: str,
    is_published: bool = Query(..., description="Set true to publish or false to unpublish"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Administrative override to publish or unpublish any curriculum offering.
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id '{course_id}' not found."
        )

    course.is_published = is_published
    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="COURSE_PUBLISH_TOGGLE",
        target_type="course",
        target_id=course.id,
        details=f"Admin set is_published={is_published} for course {course.code} ('{course.title}')"
    )

    await db.commit()
    await db.refresh(course)

    return {
        "status": "success",
        "course_id": course.id,
        "is_published": course.is_published,
        "message": f"Course '{course.title}' is now {'published' if is_published else 'unpublished'}."
    }


@router.get(
    "/enrollments",
    response_model=List[AdminEnrollmentItem],
    summary="View cross-platform course enrollments"
)
async def admin_list_enrollments(
    limit: int = Query(50, ge=1, le=200),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AdminEnrollmentItem]:
    """
    List candidate enrollments across all institutional courses.
    """
    result = await db.execute(
        select(CourseEnrollment)
        .options(
            joinedload(CourseEnrollment.user),
            joinedload(CourseEnrollment.course)
        )
        .order_by(CourseEnrollment.enrolled_at.desc())
        .limit(limit)
    )
    enrollments = result.scalars().all()

    return [
        AdminEnrollmentItem(
            id=e.id,
            user_id=e.user_id,
            user_name=e.user.full_name if e.user else "Unknown",
            user_email=e.user.email if e.user else "Unknown",
            course_id=e.course_id,
            course_title=e.course.title if e.course else "Unknown",
            status=e.status,
            enrolled_at=e.enrolled_at,
            completed_at=e.completed_at
        )
        for e in enrollments
    ]


@router.get(
    "/assessments",
    response_model=List[AdminAssessmentItem],
    summary="View cross-platform assessments and pass rates"
)
async def admin_list_assessments(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AdminAssessmentItem]:
    """
    Lists all assessments with attempts count and aggregated passing percentage.
    """
    result = await db.execute(
        select(Assessment)
        .options(
            joinedload(Assessment.creator),
            selectinload(Assessment.attempts)
        )
        .order_by(Assessment.created_at.desc())
    )
    assessments = result.scalars().all()

    items = []
    now = datetime.now(timezone.utc)
    for a in assessments:
        attempts = a.attempts or []
        total_att = len(attempts)
        passed_att = sum(1 for att in attempts if att.is_passed)
        pass_pct = round((passed_att / total_att * 100), 1) if total_att > 0 else 0.0

        # Check deadline
        is_avail = a.is_published
        if a.deadline:
            dl = a.deadline if a.deadline.tzinfo else a.deadline.replace(tzinfo=timezone.utc)
            if now > dl:
                is_avail = False

        items.append(
            AdminAssessmentItem(
                id=a.id,
                title=a.title,
                subject=a.subject,
                creator_name=a.creator.full_name if a.creator else "Unknown",
                duration_minutes=a.duration_minutes,
                passing_score=float(a.passing_score),
                total_marks=float(a.total_marks),
                is_published=a.is_published,
                is_available=is_avail,
                total_attempts=total_att,
                pass_percentage=pass_pct
            )
        )
    return items


@router.get(
    "/certifications",
    response_model=List[AdminCertificateItem],
    summary="View all certificates issued across the portal"
)
async def admin_list_certifications(
    limit: int = Query(50, ge=1, le=200),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AdminCertificateItem]:
    """
    Lists verified certificates and credentials earned by trainees.
    """
    result = await db.execute(
        select(Certificate)
        .options(joinedload(Certificate.user))
        .order_by(Certificate.created_at.desc())
        .limit(limit)
    )
    certs = result.scalars().all()

    return [
        AdminCertificateItem(
            id=c.id,
            user_id=c.user_id,
            user_name=c.user.full_name if c.user else "Unknown",
            title=c.title,
            issuing_organization=c.issuing_organization,
            issue_date=str(c.issue_date),
            is_system_generated=c.is_system_generated,
            created_at=c.created_at
        )
        for c in certs
    ]


# ---------------------------------------------------------------------------
# 4. INSTITUTIONAL ANNOUNCEMENTS & BULLETINS
# ---------------------------------------------------------------------------

@router.get(
    "/announcements",
    response_model=List[AnnouncementResponse],
    summary="List all announcements (admin audit)"
)
async def admin_list_announcements(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AnnouncementResponse]:
    """
    Returns all announcements, active and inactive.
    """
    result = await db.execute(
        select(Announcement)
        .options(joinedload(Announcement.author))
        .order_by(Announcement.created_at.desc())
    )
    announcements = result.scalars().all()

    return [
        AnnouncementResponse(
            id=a.id,
            published_by=a.published_by,
            author_name=a.author.full_name if a.author else "Administrator",
            title=a.title,
            content=a.content,
            is_featured_on_homepage=a.is_featured_on_homepage,
            is_active=a.is_active,
            created_at=a.created_at,
            updated_at=a.updated_at
        )
        for a in announcements
    ]


@router.post(
    "/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish new institutional announcement"
)
async def admin_create_announcement(
    body: AnnouncementCreate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """
    Publishes an official announcement for display in the bulletin and on the homepage.
    """
    announcement = Announcement(
        published_by=admin_user.id,
        title=body.title.strip(),
        content=body.content.strip(),
        is_featured_on_homepage=body.is_featured_on_homepage,
        is_active=body.is_active
    )
    db.add(announcement)
    await db.flush()

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="ANNOUNCEMENT_CREATE",
        target_type="announcement",
        target_id=announcement.id,
        details=f"Created announcement '{announcement.title}' (featured={announcement.is_featured_on_homepage})"
    )

    await db.commit()
    await db.refresh(announcement)

    return AnnouncementResponse(
        id=announcement.id,
        published_by=announcement.published_by,
        author_name=admin_user.full_name,
        title=announcement.title,
        content=announcement.content,
        is_featured_on_homepage=announcement.is_featured_on_homepage,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at
    )


@router.put(
    "/announcements/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Update existing announcement"
)
async def admin_update_announcement(
    announcement_id: str,
    body: AnnouncementUpdate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """
    Modifies announcement content, status, or homepage feature setting.
    """
    result = await db.execute(
        select(Announcement).options(joinedload(Announcement.author)).where(Announcement.id == announcement_id)
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with id '{announcement_id}' not found."
        )

    if body.title is not None:
        announcement.title = body.title.strip()
    if body.content is not None:
        announcement.content = body.content.strip()
    if body.is_featured_on_homepage is not None:
        announcement.is_featured_on_homepage = body.is_featured_on_homepage
    if body.is_active is not None:
        announcement.is_active = body.is_active

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="ANNOUNCEMENT_UPDATE",
        target_type="announcement",
        target_id=announcement.id,
        details=f"Updated announcement '{announcement.title}'"
    )

    await db.commit()
    await db.refresh(announcement)

    return AnnouncementResponse(
        id=announcement.id,
        published_by=announcement.published_by,
        author_name=announcement.author.full_name if announcement.author else "Administrator",
        title=announcement.title,
        content=announcement.content,
        is_featured_on_homepage=announcement.is_featured_on_homepage,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at
    )


@router.delete(
    "/announcements/{announcement_id}",
    summary="Delete announcement"
)
async def admin_delete_announcement(
    announcement_id: str,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Removes an announcement from the system.
    """
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with id '{announcement_id}' not found."
        )

    title = announcement.title
    await db.delete(announcement)

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="ANNOUNCEMENT_DELETE",
        target_type="announcement",
        target_id=announcement_id,
        details=f"Deleted announcement '{title}'"
    )

    await db.commit()

    return {
        "status": "success",
        "announcement_id": announcement_id,
        "message": f"Announcement '{title}' was deleted successfully."
    }


# ---------------------------------------------------------------------------
# 5. NOTIFICATIONS & BROADCASTS
# ---------------------------------------------------------------------------

@router.post(
    "/notifications",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send or broadcast notification"
)
async def admin_send_notification(
    body: NotificationCreate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> NotificationResponse:
    """
    Dispatches a notification to a single recipient or broadcasts system-wide (when user_id is null).
    """
    if body.user_id:
        u_res = await db.execute(select(User).where(User.id == body.user_id))
        if not u_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target user with id '{body.user_id}' not found."
            )

    notif = Notification(
        user_id=body.user_id,
        title=body.title.strip(),
        message=body.message.strip(),
        notification_type=body.notification_type,
        is_read=False
    )
    db.add(notif)
    await db.flush()

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="NOTIFICATION_SEND",
        target_type="notification",
        target_id=notif.id,
        details=f"Sent notification '{notif.title}' to {'user ' + body.user_id if body.user_id else 'ALL USERS'}"
    )

    await db.commit()
    await db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        title=notif.title,
        message=notif.message,
        notification_type=notif.notification_type,
        is_read=notif.is_read,
        created_at=notif.created_at
    )


# ---------------------------------------------------------------------------
# 6. ACHIEVEMENTS & RECOGNITIONS
# ---------------------------------------------------------------------------

@router.get(
    "/achievements",
    response_model=List[AchievementResponse],
    summary="List all awarded achievements"
)
async def admin_list_achievements(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AchievementResponse]:
    """
    Returns all awarded achievements and distinction badges across learners.
    """
    result = await db.execute(
        select(Achievement).options(joinedload(Achievement.user)).order_by(Achievement.created_at.desc())
    )
    achievements = result.scalars().all()

    return [
        AchievementResponse(
            id=a.id,
            user_id=a.user_id,
            user_name=a.user.full_name if a.user else "Unknown",
            title=a.title,
            description=a.description,
            badge_icon_url=a.badge_icon_url,
            awarded_date=a.awarded_date,
            is_displayed_on_homepage=a.is_displayed_on_homepage,
            created_at=a.created_at
        )
        for a in achievements
    ]


@router.post(
    "/achievements",
    response_model=AchievementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Award achievement badge to user"
)
async def admin_award_achievement(
    body: AchievementCreate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> AchievementResponse:
    """
    Awards an official competency distinction badge to an officer or trainee.
    """
    u_res = await db.execute(select(User).where(User.id == body.user_id))
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{body.user_id}' not found."
        )

    achievement = Achievement(
        user_id=body.user_id,
        title=body.title.strip(),
        description=body.description.strip() if body.description else None,
        badge_icon_url=body.badge_icon_url.strip() if body.badge_icon_url else None,
        is_displayed_on_homepage=body.is_displayed_on_homepage
    )
    db.add(achievement)
    await db.flush()

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="ACHIEVEMENT_AWARD",
        target_type="achievement",
        target_id=achievement.id,
        details=f"Awarded '{achievement.title}' to {user.email}"
    )

    await db.commit()
    await db.refresh(achievement)

    return AchievementResponse(
        id=achievement.id,
        user_id=achievement.user_id,
        user_name=user.full_name,
        title=achievement.title,
        description=achievement.description,
        badge_icon_url=achievement.badge_icon_url,
        awarded_date=achievement.awarded_date,
        is_displayed_on_homepage=achievement.is_displayed_on_homepage,
        created_at=achievement.created_at
    )


@router.delete(
    "/achievements/{achievement_id}",
    summary="Revoke achievement badge"
)
async def admin_revoke_achievement(
    achievement_id: str,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Revokes an awarded badge or recognition.
    """
    result = await db.execute(select(Achievement).where(Achievement.id == achievement_id))
    achievement = result.scalar_one_or_none()
    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Achievement with id '{achievement_id}' not found."
        )

    title = achievement.title
    await db.delete(achievement)

    await log_admin_action(
        db,
        admin_id=admin_user.id,
        action="ACHIEVEMENT_REVOKE",
        target_type="achievement",
        target_id=achievement_id,
        details=f"Revoked achievement '{title}'"
    )

    await db.commit()

    return {
        "status": "success",
        "achievement_id": achievement_id,
        "message": f"Achievement '{title}' was revoked successfully."
    }


# ---------------------------------------------------------------------------
# 7. ADMINISTRATIVE AUDIT LOGS
# ---------------------------------------------------------------------------

@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
    summary="View system administrative audit logs"
)
async def admin_get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None, description="Filter by action type"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[AuditLogResponse]:
    """
    Inspects immutable administrative action logs for governance and security auditing.
    """
    stmt = select(AuditLog).options(joinedload(AuditLog.admin_user)).order_by(AuditLog.created_at.desc())

    if action:
        stmt = stmt.where(AuditLog.action == action)

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return [
        AuditLogResponse(
            id=log.id,
            admin_user_id=log.admin_user_id,
            admin_email=log.admin_user.email if log.admin_user else "Unknown",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            details=log.details,
            created_at=log.created_at
        )
        for log in logs
    ]
