import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.trainee import Qualification, WorkExperience, Skill, Interest, Certificate

from app.core.database import Base


def generate_uuid_str() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        nullable=False
    )

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Role id={self.id} name='{self.name}'>"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid_str,
        index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    station_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    organization: Mapped[str] = mapped_column(
        String(255),
        default="India Meteorological Department (IMD)",
        nullable=False
    )
    role_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending_approval",
        nullable=False,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False
    )

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users", lazy="joined")
    trainee_profile: Mapped[Optional["TraineeProfile"]] = relationship(
        "TraineeProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    trainer_profile: Mapped[Optional["TrainerProfile"]] = relationship(
        "TrainerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    certificates: Mapped[list["Certificate"]] = relationship(
        "Certificate",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User id='{self.id}' email='{self.email}' role='{self.role.name if self.role else self.role_id}' status='{self.status}'>"


class TraineeProfile(Base):
    __tablename__ = "trainee_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    posting_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="trainee_profile")
    qualifications: Mapped[list["Qualification"]] = relationship(
        "Qualification",
        back_populates="trainee_profile",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    work_experiences: Mapped[list["WorkExperience"]] = relationship(
        "WorkExperience",
        back_populates="trainee_profile",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    skills: Mapped[list["Skill"]] = relationship(
        "Skill",
        back_populates="trainee_profile",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    interests: Mapped[list["Interest"]] = relationship(
        "Interest",
        back_populates="trainee_profile",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class TrainerProfile(Base):
    __tablename__ = "trainer_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    experience_years: Mapped[Optional[float]] = mapped_column(nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user: Mapped["User"] = relationship("User", back_populates="trainer_profile")
