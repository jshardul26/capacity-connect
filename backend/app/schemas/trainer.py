import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


# ----------------------------------------------------------------------
# 1. Trainer Expertise Schemas
# ----------------------------------------------------------------------

class TrainerExpertiseCreate(BaseModel):
    subject: str = Field(..., min_length=2, max_length=150, description="Subject or domain area")
    proficiency_level: str = Field(
        "expert",
        pattern="^(intermediate|advanced|expert)$",
        description="Proficiency level: intermediate, advanced, or expert"
    )
    years_in_subject: float = Field(0.0, ge=0.0, le=70.0, description="Years active in subject")


class TrainerExpertiseResponse(BaseModel):
    id: str
    trainer_profile_id: str
    subject: str
    proficiency_level: str
    years_in_subject: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# 2. Trainer Library Schemas
# ----------------------------------------------------------------------

class TrainerLibraryCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Resource title")
    description: Optional[str] = Field(None, max_length=1000)
    resource_type: str = Field(
        "study_material",
        pattern="^(video|presentation|study_material|dataset|code)$",
        description="Type of resource"
    )
    file_path: str = Field(..., min_length=1, max_length=500, description="Path or URL to resource")
    file_size_bytes: int = Field(0, ge=0)
    sha256_checksum: str = Field(..., min_length=1, max_length=64, description="Cryptographic SHA-256 hash")
    is_public_to_trainees: bool = Field(False, description="Whether accessible publicly to trainees")


class TrainerLibraryResponse(BaseModel):
    id: str
    trainer_profile_id: str
    title: str
    description: Optional[str] = None
    resource_type: str
    file_path: str
    file_size_bytes: int
    sha256_checksum: str
    is_public_to_trainees: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# 3. Lesson & Course Module Schemas
# ----------------------------------------------------------------------

class LessonCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content_text: Optional[str] = None
    order_index: int = Field(1, ge=1)
    duration_minutes: int = Field(0, ge=0)


class LessonResponse(BaseModel):
    id: str
    module_id: str
    title: str
    content_text: Optional[str] = None
    order_index: int
    duration_minutes: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseModuleCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    order_index: int = Field(1, ge=1)


class CourseModuleResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str] = None
    order_index: int
    created_at: datetime
    lessons: List[LessonResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# 4. Questionnaire & Question Schemas
# ----------------------------------------------------------------------

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=3, description="Question prompt")
    question_type: str = Field("mcq", pattern="^(mcq|true_false)$")
    options: List[Dict[str, Any]] = Field(
        ...,
        min_length=2,
        description="List of options, e.g. [{'id': 'A', 'text': 'Option A'}, {'id': 'B', 'text': 'Option B'}]"
    )
    correct_option: str = Field(..., min_length=1, max_length=10, description="Identifier of correct option, e.g. 'A'")
    explanation: Optional[str] = None
    marks: float = Field(1.0, ge=0.25, le=100.0)
    order_index: int = Field(1, ge=1)


class QuestionResponse(BaseModel):
    id: str
    assessment_id: str
    question_text: str
    question_type: str
    options: List[Dict[str, Any]] = []
    correct_option: str
    explanation: Optional[str] = None
    marks: float
    order_index: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_model(cls, q: Any) -> "QuestionResponse":
        opts = []
        if q.options_json:
            try:
                opts = json.loads(q.options_json)
            except Exception:
                opts = []
        return cls(
            id=q.id,
            assessment_id=q.assessment_id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=opts,
            correct_option=q.correct_option,
            explanation=q.explanation,
            marks=q.marks,
            order_index=q.order_index,
            created_at=q.created_at,
        )


class QuestionnaireCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    subject: str = Field(..., min_length=2, max_length=150)
    course_id: Optional[str] = None
    duration_minutes: int = Field(30, ge=5, le=360)
    passing_score: float = Field(60.0, ge=0.0, le=100.0)
    total_marks: float = Field(100.0, ge=1.0, le=1000.0)
    is_published: bool = False


class QuestionnaireResponse(BaseModel):
    id: str
    course_id: Optional[str] = None
    created_by: str
    title: str
    description: Optional[str] = None
    subject: str
    duration_minutes: int
    passing_score: float
    total_marks: float
    is_published: bool
    created_at: datetime
    updated_at: datetime
    questions_count: int = 0
    questions: List[QuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# 5. Course Schemas
# ----------------------------------------------------------------------

class CourseCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Unique course identifier code, e.g. MET-401")
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    level: str = Field("all_levels", pattern="^(beginner|intermediate|advanced|all_levels)$")
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    estimated_hours: float = Field(0.0, ge=0.0, le=500.0)
    is_published: bool = False


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced|all_levels)$")
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    estimated_hours: Optional[float] = Field(None, ge=0.0, le=500.0)
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    id: str
    trainer_id: str
    code: str
    title: str
    description: str
    category: str
    level: str
    thumbnail_url: Optional[str] = None
    is_published: bool
    estimated_hours: float
    created_at: datetime
    updated_at: datetime
    modules: List[CourseModuleResponse] = []
    modules_count: int = 0
    lessons_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# 6. Profile Schemas
# ----------------------------------------------------------------------

class TrainerProfileUpdate(BaseModel):
    designation: Optional[str] = Field(None, max_length=100)
    division: Optional[str] = Field(None, max_length=100)
    years_of_experience: Optional[float] = Field(None, ge=0.0, le=70.0)
    biography: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = Field(None, max_length=500)


class TrainerProfileResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    station_code: Optional[str] = None
    organization: Optional[str] = None
    role: str = "trainer"
    designation: Optional[str] = None
    division: Optional[str] = None
    years_of_experience: Optional[float] = 0.0
    biography: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    expertise: List[TrainerExpertiseResponse] = []
    courses_count: int = 0
    library_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# 7. Dashboard & Analytics Schemas
# ----------------------------------------------------------------------

class CourseAnalyticsResponse(BaseModel):
    course_id: str
    course_title: str
    course_code: str
    is_published: bool
    total_enrolled_trainees: int = 0
    completed_trainees: int = 0
    in_progress_trainees: int = 0
    average_progress_percent: float = 0.0
    enrolled_trainees: List[Dict[str, Any]] = []


class TrainerDashboardResponse(BaseModel):
    trainer_id: str
    full_name: str
    designation: Optional[str] = None
    division: Optional[str] = None
    total_courses: int = 0
    published_courses: int = 0
    total_modules: int = 0
    total_lessons: int = 0
    total_library_resources: int = 0
    total_questionnaires: int = 0
    total_questions: int = 0
    total_enrolled_trainees: int = 0
    total_assessments_attempted: int = 0
    recent_courses: List[CourseResponse] = []
