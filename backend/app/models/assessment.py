import secrets
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.trainer import Assessment, Question


def generate_uuid_str() -> str:
    return str(uuid.uuid4())


def generate_uuid7_str() -> str:
    """Generate a time-ordered RFC 9562 UUIDv7 without a new dependency."""
    timestamp_ms = int(time.time() * 1000) & ((1 << 48) - 1)
    value = (timestamp_ms << 80) | (0x7 << 76) | (secrets.randbits(12) << 64)
    value |= (0b10 << 62) | secrets.randbits(62)
    return str(uuid.UUID(int=value))


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AssessmentAttempt(Base):
    """
    Records a trainee's timed attempt of an assessment, along with scoring,
    pass/fail status, and a cryptographic integrity signature.
    """
    __tablename__ = "assessment_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid7_str)
    assessment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    score_obtained: Mapped[float] = mapped_column(Float, default=0.0)
    is_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    attempt_status: Mapped[str] = mapped_column(
        String(50),
        default="in_progress"
    )  # in_progress, completed, timed_out
    attempt_signature: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="attempts")
    user: Mapped["User"] = relationship("User", back_populates="assessment_attempts")
    answers: Mapped[list["AssessmentAnswer"]] = relationship(
        "AssessmentAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    __table_args__ = (
        Index("idx_assessment_attempts_user_id", "user_id"),
        Index("idx_assessment_attempts_assessment_id", "assessment_id"),
    )


class AssessmentAnswer(Base):
    """
    Records an individual question response within a trainee's assessment attempt.
    """
    __tablename__ = "assessment_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid_str)
    attempt_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    question_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    selected_option: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    marks_awarded: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    # Relationships
    attempt: Mapped["AssessmentAttempt"] = relationship("AssessmentAttempt", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
