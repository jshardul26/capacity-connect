import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.user import UserPublic

logger = logging.getLogger("capacity_connect.admin")
router = APIRouter()


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
    Accessible only by administrators.
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
    Approves a pending user account, enabling them to log in and access portal services.
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found."
        )

    user.status = "approved"
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
    Rejects a pending user account registration.
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found."
        )

    user.status = "rejected"
    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin '{admin_user.email}' rejected user '{user.email}' (ID: {user.id})")

    return {
        "status": "rejected",
        "user_id": user.id,
        "email": user.email,
        "message": f"User '{user.email}' registration was rejected."
    }
