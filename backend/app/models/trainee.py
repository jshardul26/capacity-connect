import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def generate_uuid_str() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Qualification(Base):
    __tablename__ = "qualifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainee_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trainee_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    degree: Mapped[str] = mapped_column(String(150), nullable=False)
    field_of_study: Mapped[str] = mapped_column(String(150), nullable=False)
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    passing_year: Mapped[int] = mapped_column(Integer, nullable=False)
    grade_or_percentage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    trainee_profile: Mapped["TraineeProfile"] = relationship("TraineeProfile", back_populates="qualifications")


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainee_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trainee_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str] = mapped_column(String(150), nullable=False)
    start_date: Mapped[str] = mapped_column(String(50), nullable=False)
    end_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    responsibilities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    trainee_profile: Mapped["TraineeProfile"] = relationship("TraineeProfile", back_populates="work_experiences")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainee_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trainee_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    proficiency_level: Mapped[str] = mapped_column(String(50), default="beginner")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    trainee_profile: Mapped["TraineeProfile"] = relationship("TraineeProfile", back_populates="skills")


class Interest(Base):
    __tablename__ = "interests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainee_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trainee_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    trainee_profile: Mapped["TraineeProfile"] = relationship("TraineeProfile", back_populates="interests")


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    issuing_organization: Mapped[str] = mapped_column(String(255), nullable=False)
    issue_date: Mapped[str] = mapped_column(String(50), nullable=False)
    expiry_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    credential_id: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_system_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="certificates")
