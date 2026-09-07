import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.trainee import Qualification, WorkExperience, Skill, Interest, Certificate
    from app.models.trainer import TrainerExpertise, TrainerLibrary, Course, Assessment
    from app.models.learning import CourseEnrollment, LessonProgress, CourseFeedback
    from app.models.assessment import AssessmentAttempt

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
    courses_created: Mapped[list["Course"]] = relationship(
        "Course",
        back_populates="trainer",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    assessments_created: Mapped[list["Assessment"]] = relationship(
        "Assessment",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    enrollments: Mapped[list["CourseEnrollment"]] = relationship(
        "CourseEnrollment",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    lesson_progress: Mapped[list["LessonProgress"]] = relationship(
        "LessonProgress",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    feedbacks: Mapped[list["CourseFeedback"]] = relationship(
        "CourseFeedback",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    assessment_attempts: Mapped[list["AssessmentAttempt"]] = relationship(
        "AssessmentAttempt",
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
    division: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    years_of_experience: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    biography: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="trainer_profile")
    expertise: Mapped[list["TrainerExpertise"]] = relationship(
        "TrainerExpertise",
        back_populates="trainer_profile",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    library_items: Mapped[list["TrainerLibrary"]] = relationship(
        "TrainerLibrary",
        back_populates="trainer_profile",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    @property
    def department(self) -> Optional[str]:
        return self.division

    @department.setter
    def department(self, value: Optional[str]) -> None:
        self.division = value

    @property
    def experience_years(self) -> Optional[float]:
        return self.years_of_experience

    @experience_years.setter
    def experience_years(self, value: Optional[float]) -> None:
        self.years_of_experience = value

    @property
    def bio(self) -> Optional[str]:
        return self.biography

    @bio.setter
    def bio(self, value: Optional[str]) -> None:
        self.biography = value
