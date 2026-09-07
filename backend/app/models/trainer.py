import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, BigInteger, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User, TrainerProfile
    from app.models.learning import LearningResource, CourseEnrollment, LessonProgress, CourseFeedback


def generate_uuid_str() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TrainerExpertise(Base):
    __tablename__ = "trainer_expertise"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainer_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trainer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    subject: Mapped[str] = mapped_column(String(150), nullable=False)
    proficiency_level: Mapped[str] = mapped_column(String(50), default="expert")
    years_in_subject: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    trainer_profile: Mapped["TrainerProfile"] = relationship("TrainerProfile", back_populates="expertise")


class TrainerLibrary(Base):
    __tablename__ = "trainer_library"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainer_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trainer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), default="study_material")
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    sha256_checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    is_public_to_trainees: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    trainer_profile: Mapped["TrainerProfile"] = relationship("TrainerProfile", back_populates="library_items")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    trainer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(50), default="all_levels")
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    estimated_hours: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now
    )

    # Relationships
    trainer: Mapped["User"] = relationship("User", back_populates="courses_created")
    modules: Mapped[list["CourseModule"]] = relationship(
        "CourseModule",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    learning_resources: Mapped[list["LearningResource"]] = relationship(
        "LearningResource",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    enrollments: Mapped[list["CourseEnrollment"]] = relationship(
        "CourseEnrollment",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    feedbacks: Mapped[list["CourseFeedback"]] = relationship(
        "CourseFeedback",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class CourseModule(Base):
    __tablename__ = "course_modules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson",
        back_populates="module",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    module_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("course_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    module: Mapped["CourseModule"] = relationship("CourseModule", back_populates="lessons")
    learning_resources: Mapped[list["LearningResource"]] = relationship(
        "LearningResource",
        back_populates="lesson",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    progress_records: Mapped[list["LessonProgress"]] = relationship(
        "LessonProgress",
        back_populates="lesson",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class Assessment(Base):
    """
    Represents an assessment or questionnaire created by a trainer for course or topic evaluation.
    """
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    course_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    created_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subject: Mapped[str] = mapped_column(String(150), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    passing_score: Mapped[float] = mapped_column(Float, default=60.0)
    total_marks: Mapped[float] = mapped_column(Float, default=100.0)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now
    )

    # Relationships
    course: Mapped[Optional["Course"]] = relationship("Course", back_populates="assessments")
    creator: Mapped["User"] = relationship("User", back_populates="assessments_created")
    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="assessment",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class Question(Base):
    """
    Individual question within an assessment / questionnaire.
    """
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    assessment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), default="mcq")  # mcq, true_false
    options_json: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-encoded array of options
    correct_option: Mapped[str] = mapped_column(String(10), nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    marks: Mapped[float] = mapped_column(Float, default=1.0)
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationship
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="questions")
