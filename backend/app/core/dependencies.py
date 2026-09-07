from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

# HTTP Bearer security scheme for OpenAPI docs
security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extracts, decodes, and validates the JWT Bearer access token.
    Retrieves and returns the corresponding User with their Role from the database.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        if not user_id or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token. Access token required.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query user with eager-loaded role
    result = await db.execute(
        select(User).options(joinedload(User.role)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_approved_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensures the current user is approved by an administrator before accessing resources.
    Pending, rejected, or suspended accounts are rejected with 403 Forbidden.
    """
    status_lower = current_user.status.lower()
    if status_lower == "approved":
        return current_user
    elif status_lower == "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration is pending administrative approval.",
        )
    elif status_lower == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration has been rejected by administration.",
        )
    elif status_lower == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Contact IMD portal administrator.",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account status '{current_user.status}' is not authorized.",
        )


def require_role(*allowed_roles: str) -> Callable:
    """
    Role-based access control (RBAC) dependency factory.
    Enforces that the authenticated user possesses one of the allowed roles.
    Administrators are granted universal access.
    """
    normalized_allowed = [r.lower() for r in allowed_roles]

    def role_checker(
        current_user: User = Depends(require_approved_user),
    ) -> User:
        user_role = current_user.role.name.lower() if current_user.role else ""
        if user_role not in normalized_allowed and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {list(allowed_roles)}",
            )
        return current_user

    return role_checker


def require_admin(
    current_user: User = Depends(require_approved_user),
) -> User:
    """Enforces that the authenticated user is an administrator."""
    user_role = current_user.role.name.lower() if current_user.role else ""
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: requires administrator privileges.",
        )
    return current_user


# Role-specific shortcut dependencies
require_trainee = require_role("trainee")
require_trainer = require_role("trainer")

__all__ = [
    "get_db",
    "get_current_user",
    "require_approved_user",
    "require_role",
    "require_admin",
    "require_trainee",
    "require_trainer",
]
