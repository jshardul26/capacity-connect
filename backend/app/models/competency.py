import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, Text, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.trainer import Course, Assessment


def generate_uuid_str() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Competency(Base):
    """
    Represents a standardized operational domain competency defined by MoES/IMD.
    """
    __tablename__ = "competencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # The frozen gap formula multiplies each deficiency by this operational
    # criticality value.  Existing canonical rows default to neutral weight 1.
    criticality_weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    trainee_competencies: Mapped[list["TraineeCompetency"]] = relationship(
        "TraineeCompetency",
        back_populates="competency",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    course_competencies: Mapped[list["CourseCompetency"]] = relationship(
        "CourseCompetency",
        back_populates="competency",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment",
        back_populates="competency",
        lazy="selectin"
    )


class TraineeCompetency(Base):
    """
    Tracks a trainee's evaluated proficiency level (0.00 to 1.00) in a specific competency.
    """
    __tablename__ = "trainee_competencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    competency_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    proficiency_level: Mapped[float] = mapped_column(Float, default=0.0)
    last_evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="competencies")
    competency: Mapped["Competency"] = relationship("Competency", back_populates="trainee_competencies")

    __table_args__ = (
        UniqueConstraint("user_id", "competency_id", name="uq_trainee_competency"),
        Index("idx_trainee_competencies_user", "user_id"),
        Index("idx_trainee_competencies_competency", "competency_id"),
    )


class CourseCompetency(Base):
    """
    Represents the competency yield gained upon successfully completing a course.
    """
    __tablename__ = "course_competencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    competency_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    yield_level: Mapped[float] = mapped_column(Float, default=0.50)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="competencies_yield")
    competency: Mapped["Competency"] = relationship("Competency", back_populates="course_competencies")

    __table_args__ = (
        UniqueConstraint("course_id", "competency_id", name="uq_course_competency"),
        Index("idx_course_competencies_course", "course_id"),
        Index("idx_course_competencies_competency", "competency_id"),
    )
