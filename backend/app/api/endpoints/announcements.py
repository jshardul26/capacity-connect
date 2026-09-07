import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_approved_user
from app.models.user import User
from app.models.admin import Announcement, Notification, Achievement
from app.schemas.admin import (
    AnnouncementResponse,
    NotificationResponse,
    AchievementResponse,
)

logger = logging.getLogger("capacity_connect.announcements")
router = APIRouter()


# ---------------------------------------------------------------------------
# 1. PUBLIC ANNOUNCEMENTS & BULLETINS
# ---------------------------------------------------------------------------

@router.get(
    "/announcements",
    response_model=List[AnnouncementResponse],
    summary="Get active announcements and bulletins"
)
async def get_active_announcements(
    featured_only: bool = Query(False, description="Filter only announcements featured on homepage"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> List[AnnouncementResponse]:
    """
    Public feed of official institutional announcements and news bulletins.
    """
    stmt = (
        select(Announcement)
        .options(joinedload(Announcement.author))
        .where(Announcement.is_active.is_(True))
        .order_by(Announcement.is_featured_on_homepage.desc(), Announcement.created_at.desc())
        .limit(limit)
    )

    if featured_only:
        stmt = stmt.where(Announcement.is_featured_on_homepage.is_(True))

    result = await db.execute(stmt)
    announcements = result.scalars().all()

    return [
        AnnouncementResponse(
            id=a.id,
            published_by=a.published_by,
            author_name=a.author.full_name if a.author else "IMD Administrator",
            title=a.title,
            content=a.content,
            is_featured_on_homepage=a.is_featured_on_homepage,
            is_active=a.is_active,
            created_at=a.created_at,
            updated_at=a.updated_at
        )
        for a in announcements
    ]


# ---------------------------------------------------------------------------
# 2. USER NOTIFICATIONS
# ---------------------------------------------------------------------------

@router.get(
    "/notifications/me",
    response_model=List[NotificationResponse],
    summary="Get current user's notifications"
)
async def get_my_notifications(
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db)
) -> List[NotificationResponse]:
    """
    Returns notifications addressed to the current user or system-wide broadcasts.
    """
    stmt = (
        select(Notification)
        .where(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id.is_(None)
            )
        )
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    notifications = result.scalars().all()

    return [
        NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            created_at=n.created_at
        )
        for n in notifications
    ]


@router.post(
    "/notifications/{notification_id}/read",
    summary="Mark notification as read"
)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Marks an individual notification as read.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id,
        or_(Notification.user_id == current_user.id, Notification.user_id.is_(None))
    )
    result = await db.execute(stmt)
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with id '{notification_id}' not found."
        )

    notif.is_read = True
    await db.commit()

    return {"status": "success", "notification_id": notification_id, "is_read": True}


@router.post(
    "/notifications/read-all",
    summary="Mark all notifications as read"
)
async def mark_all_notifications_read(
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Marks all notifications for current user as read.
    """
    stmt = (
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()

    return {"status": "success", "message": "All notifications marked as read."}


# ---------------------------------------------------------------------------
# 3. ACHIEVEMENTS & HOMEPAGE SHOWCASE
# ---------------------------------------------------------------------------

@router.get(
    "/achievements/homepage",
    response_model=List[AchievementResponse],
    summary="Get featured achievements for homepage"
)
async def get_homepage_achievements(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
) -> List[AchievementResponse]:
    """
    Returns recognitions and badges marked for public display on portal landing pages.
    """
    stmt = (
        select(Achievement)
        .options(joinedload(Achievement.user))
        .where(Achievement.is_displayed_on_homepage.is_(True))
        .order_by(Achievement.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    achievements = result.scalars().all()

    return [
        AchievementResponse(
            id=a.id,
            user_id=a.user_id,
            user_name=a.user.full_name if a.user else "Officer",
            title=a.title,
            description=a.description,
            badge_icon_url=a.badge_icon_url,
            awarded_date=a.awarded_date,
            is_displayed_on_homepage=a.is_displayed_on_homepage,
            created_at=a.created_at
        )
        for a in achievements
    ]


@router.get(
    "/achievements/me",
    response_model=List[AchievementResponse],
    summary="Get current user's awarded badges"
)
async def get_my_achievements(
    current_user: User = Depends(require_approved_user),
    db: AsyncSession = Depends(get_db)
) -> List[AchievementResponse]:
    """
    Returns all achievements and distinction badges awarded to the caller.
    """
    stmt = (
        select(Achievement)
        .where(Achievement.user_id == current_user.id)
        .order_by(Achievement.created_at.desc())
    )
    result = await db.execute(stmt)
    achievements = result.scalars().all()

    return [
        AchievementResponse(
            id=a.id,
            user_id=a.user_id,
            user_name=current_user.full_name,
            title=a.title,
            description=a.description,
            badge_icon_url=a.badge_icon_url,
            awarded_date=a.awarded_date,
            is_displayed_on_homepage=a.is_displayed_on_homepage,
            created_at=a.created_at
        )
        for a in achievements
    ]
