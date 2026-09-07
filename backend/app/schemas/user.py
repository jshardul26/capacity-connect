from typing import Optional
from datetime import datetime
import re
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserBase(BaseModel):
    email: str = Field(..., max_length=255, description="Valid user email address")
    full_name: str = Field(..., min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    station_code: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field("India Meteorological Department (IMD)", max_length=255)

    @field_validator("email")
    def validate_email_format(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email address format.")
        return cleaned


class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="Password must be at least 8 characters")
    role: str = Field("trainee", description="Role: 'trainee' or 'trainer'. Admin self-registration is forbidden.")

    @field_validator("role")
    def validate_role(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned == "admin":
            raise ValueError("Admin accounts cannot be self-registered via public signup.")
        if cleaned not in ["trainee", "trainer"]:
            raise ValueError("Role must be either 'trainee' or 'trainer'.")
        return cleaned

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one numerical digit.")
        if not any(char.isalpha() for char in v):
            raise ValueError("Password must contain at least one letter.")
        return v


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    def validate_email_format(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email address format.")
        return cleaned


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    station_code: Optional[str] = None
    organization: str
    role: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserRegisterResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    status: str
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserApprovalUpdate(BaseModel):
    status: str

    @field_validator("status")
    def validate_approval_status(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in ["approved", "rejected", "suspended"]:
            raise ValueError("Status must be 'approved', 'rejected', or 'suspended'.")
        return cleaned
