from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union, Dict
import bcrypt
from jose import jwt, JWTError

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash for a plain password."""
    # Truncate to 72 bytes if necessary per bcrypt maximum length
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token with role claim."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


# In-memory revocation registry for logged-out / revoked JWT tokens
_REVOKED_TOKENS: set[str] = set()


def revoke_token(token: str) -> None:
    """Marks a JWT token as revoked."""
    _REVOKED_TOKENS.add(token)


def is_token_revoked(token: str) -> bool:
    """Checks if a JWT token has been revoked."""
    return token in _REVOKED_TOKENS


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token using the configured secret and algorithm."""
    if is_token_revoked(token):
        raise JWTError("Token has been revoked.")
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


