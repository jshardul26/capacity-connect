import json
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class QuestionOptionItem(BaseModel):
    id: str
    text: str


class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=3)
    question_type: str = Field("mcq", pattern="^(mcq|true_false)$")
    options_json: Union[List[QuestionOptionItem], str]
    correct_option: str = Field(..., min_length=1, max_length=10)
    explanation: Optional[str] = None
    marks: float = Field(1.0, ge=0.5, le=1000.0)
    order_index: int = Field(1, ge=1)


class QuestionPublicResponse(BaseModel):
    """
    Public question view for test takers during active attempt.
    Crucially omits correct_option and explanation to prevent cheating.
    """
    id: str
    assessment_id: str
    question_text: str
    question_type: str
    options: List[QuestionOptionItem]
    marks: float
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class QuestionFullResponse(BaseModel):
    """
    Full question detail including correct answer and explanation
    (for authoring trainer, admin, or post-submission review).
    """
    id: str
    assessment_id: str
    question_text: str
    question_type: str
    options: List[QuestionOptionItem]
    correct_option: str
    explanation: Optional[str] = None
    marks: float
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class AssessmentCreate(BaseModel):
    course_id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    subject: str = Field(..., min_length=2, max_length=150)
    duration_minutes: int = Field(30, ge=5, le=300)
    passing_score: float = Field(60.0, ge=1.0, le=1000.0)
    total_marks: float = Field(100.0, ge=1.0, le=1000.0)
    deadline: Optional[datetime] = None
    is_published: bool = False


class AssessmentUpdate(BaseModel):
    course_id: Optional[str] = None
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, min_length=2, max_length=150)
    duration_minutes: Optional[int] = Field(None, ge=5, le=300)
    passing_score: Optional[float] = Field(None, ge=1.0, le=1000.0)
    total_marks: Optional[float] = Field(None, ge=1.0, le=1000.0)
    deadline: Optional[datetime] = None
    is_published: Optional[bool] = None


class AssessmentAttemptSummary(BaseModel):
    attempt_id: str
    score_obtained: float
    total_marks: float
    is_passed: bool
    attempt_status: str
    start_time: datetime
    end_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentListItem(BaseModel):
    id: str
    course_id: Optional[str] = None
    created_by: str
    creator_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    subject: str
    duration_minutes: int
    passing_score: float
    total_marks: float
    deadline: Optional[datetime] = None
    is_published: bool
    is_available: bool = True
    questions_count: int = 0
    attempts_count: int = 0
    user_latest_attempt: Optional[AssessmentAttemptSummary] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentDetailResponse(BaseModel):
    id: str
    course_id: Optional[str] = None
    created_by: str
    creator_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    subject: str
    duration_minutes: int
    passing_score: float
    total_marks: float
    deadline: Optional[datetime] = None
    is_published: bool
    is_available: bool = True
    questions_count: int
    questions: Optional[List[QuestionFullResponse]] = None
    my_attempts: List[AssessmentAttemptSummary] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentStartResponse(BaseModel):
    attempt_id: str
    assessment_id: str
    title: str
    subject: str
    duration_minutes: int
    total_marks: float
    passing_score: float
    start_time: datetime
    deadline: Optional[datetime] = None
    questions: List[QuestionPublicResponse]


class AnswerSubmissionItem(BaseModel):
    question_id: str
    selected_option: Optional[str] = None


class AssessmentSubmitRequest(BaseModel):
    attempt_id: str
    answers: List[AnswerSubmissionItem]


class AssessmentSubmitResponse(BaseModel):
    attempt_id: str
    assessment_id: str
    score_obtained: float
    total_marks: float
    passing_score: float
    is_passed: bool
    attempt_status: str
    attempt_signature: str
    start_time: datetime
    end_time: datetime
    answers_count: int
    correct_answers_count: int


class AnswerResultDetail(BaseModel):
    question_id: str
    question_text: str
    options: List[QuestionOptionItem]
    selected_option: Optional[str] = None
    correct_option: str
    is_correct: bool
    marks_awarded: float
    max_marks: float
    explanation: Optional[str] = None


class AssessmentAttemptDetail(BaseModel):
    attempt_id: str
    assessment_id: str
    assessment_title: str
    subject: str
    user_id: str
    user_name: str
    score_obtained: float
    total_marks: float
    passing_score: float
    is_passed: bool
    attempt_status: str
    attempt_signature: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    answers: List[AnswerResultDetail]


class AssessmentMonitoringItem(BaseModel):
    attempt_id: str
    user_id: str
    user_name: str
    user_email: str
    score_obtained: float
    total_marks: float
    is_passed: bool
    attempt_status: str
    start_time: datetime
    end_time: Optional[datetime] = None


class AssessmentMonitoringResponse(BaseModel):
    assessment_id: str
    title: str
    subject: str
    total_attempts: int
    passed_count: int
    failed_count: int
    average_score: float
    pass_percentage: float
    attempts: List[AssessmentMonitoringItem]
