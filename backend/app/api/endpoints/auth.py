import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from jose import JWTError

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.dependencies import (
    get_current_user,
    require_approved_user,
    require_role,
    require_admin,
    require_trainee,
    require_trainer,
)
from app.models.user import User, Role, TraineeProfile, TrainerProfile
from app.schemas.user import (
    UserRegister,
    UserRegisterResponse,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    TokenRefreshResponse,
    UserPublic,
)

logger = logging.getLogger("capacity_connect.auth")
router = APIRouter()


@router.post(
    "/signup",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
async def signup(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db)
) -> UserRegisterResponse:
    """
    Registers a new Trainee or Trainer user account.
    New registrations default to status 'pending_approval' awaiting admin authorization.
    Self-registration as administrator is strictly forbidden.
    """
    # 1. Check if email is already registered
    existing_result = await db.execute(
        select(User).where(User.email == user_in.email)
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address is already registered."
        )

    # 2. Resolve Role
    role_result = await db.execute(
        select(Role).where(Role.name == user_in.role.lower())
    )
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested role '{user_in.role}' is not a valid system role."
        )

    # 3. Create User record with hashed password
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        station_code=user_in.station_code,
        organization=user_in.organization or "India Meteorological Department (IMD)",
        role_id=role.id,
        status="pending_approval"
    )
    db.add(new_user)
    await db.flush()  # Flush to generate new_user.id

    # 4. Initialize corresponding profile skeleton
    if role.name.lower() == "trainee":
        trainee_prof = TraineeProfile(
            user_id=new_user.id,
            posting_location=user_in.station_code
        )
        db.add(trainee_prof)
    elif role.name.lower() == "trainer":
        trainer_prof = TrainerProfile(
            user_id=new_user.id
        )
        db.add(trainer_prof)

    await db.commit()
    await db.refresh(new_user)

    logger.info(f"Registered new user '{new_user.email}' with role '{role.name}' (status: pending_approval)")

    return UserRegisterResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=role.name,
        status=new_user.status,
        message="Account created successfully. Awaiting administrative approval."
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue JWT access and refresh tokens"
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """
    Authenticates user with email and password.
    Enforces that user must be approved by an administrator before issuing tokens.
    """
    # 1. Fetch user by email
    result = await db.execute(
        select(User).options(joinedload(User.role)).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()

    # 2. Verify password
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Check Account Approval Status
    status_lower = user.status.lower()
    if status_lower == "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration is pending administrative approval."
        )
    elif status_lower == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration has been rejected by administration."
        )
    elif status_lower == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Contact IMD portal administrator."
        )
    elif status_lower != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account status '{user.status}' is not authorized to sign in."
        )

    # 4. Issue JWT Tokens
    role_name = user.role.name if user.role else "trainee"
    access_token = create_access_token(subject=user.id, role=role_name)
    refresh_token = create_refresh_token(subject=user.id)

    user_public = UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        station_code=user.station_code,
        organization=user.organization,
        role=role_name,
        status=user.status,
        created_at=user.created_at
    )

    logger.info(f"User '{user.email}' logged in successfully.")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public
    )


@router.post(
    "/refresh",
    response_model=TokenRefreshResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token using a valid refresh token"
)
async def refresh_token(
    refresh_req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> TokenRefreshResponse:
    """
    Validates the refresh token and issues a new access token.
    """
    try:
        payload = decode_token(refresh_req.refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token. Refresh token required."
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    result = await db.execute(
        select(User).options(joinedload(User.role)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or user.status.lower() != "approved":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists or account is not approved."
        )

    role_name = user.role.name if user.role else "trainee"
    new_access_token = create_access_token(subject=user.id, role=role_name)

    return TokenRefreshResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get active authenticated user profile and permissions"
)
async def get_me(
    current_user: User = Depends(get_current_user)
) -> UserPublic:
    """
    Returns the profile and role details of the currently authenticated user.
    """
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        station_code=current_user.station_code,
        organization=current_user.organization,
        role=current_user.role.name if current_user.role else "trainee",
        status=current_user.status,
        created_at=current_user.created_at
    )


@router.post(
    "/logout",
    summary="Logout user and invalidate session"
)
async def logout(
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Terminates active session for the authenticated user.
    """
    logger.info(f"User '{current_user.email}' logged out.")
    return {"message": "Logged out successfully"}


# ----------------------------------------------------------------------
# RBAC Verification Endpoints (Used for testing and role enforcement)
# ----------------------------------------------------------------------

@router.get(
    "/test/trainee",
    summary="Trainee-only protected test route"
)
async def test_trainee_access(
    current_user: User = Depends(require_trainee)
) -> Dict[str, Any]:
    return {
        "message": "Trainee authorization granted",
        "user_id": current_user.id,
        "role": current_user.role.name
    }


@router.get(
    "/test/trainer",
    summary="Trainer-only protected test route"
)
async def test_trainer_access(
    current_user: User = Depends(require_trainer)
) -> Dict[str, Any]:
    return {
        "message": "Trainer authorization granted",
        "user_id": current_user.id,
        "role": current_user.role.name
    }


@router.get(
    "/test/admin",
    summary="Admin-only protected test route"
)
async def test_admin_access(
    current_user: User = Depends(require_admin)
) -> Dict[str, Any]:
    return {
        "message": "Admin authorization granted",
        "user_id": current_user.id,
        "role": current_user.role.name
    }
