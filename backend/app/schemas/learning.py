from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class LearningResourceCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    resource_type: str = Field(
        "study_material",
        pattern="^(video|presentation|study_material)$",
        description="Type: video, presentation, or study_material"
    )
    file_url: str = Field(..., min_length=1, max_length=500)
    file_size_bytes: int = Field(0, ge=0)
    sha256_checksum: str = Field(..., min_length=1, max_length=64)
    duration_seconds: int = Field(0, ge=0)


class LearningResourceResponse(BaseModel):
    id: str
    lesson_id: Optional[str] = None
    course_id: Optional[str] = None
    title: str
    resource_type: str
    file_url: str
    file_size_bytes: int
    sha256_checksum: str
    duration_seconds: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseEnrollmentResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    status: str  # in_progress, completed, dropped

    model_config = ConfigDict(from_attributes=True)


class LessonProgressUpdate(BaseModel):
    lesson_id: str = Field(..., min_length=1)
    watch_time_seconds: int = Field(0, ge=0)
    is_completed: bool = Field(True)


class LessonProgressResponse(BaseModel):
    id: str
    user_id: str
    lesson_id: str
    is_completed: bool
    watch_time_seconds: int
    last_accessed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Numerical rating 1 to 5")
    feedback_text: Optional[str] = Field(None, max_length=2000)


class CourseFeedbackResponse(BaseModel):
    id: str
    course_id: str
    user_id: str
    rating: int
    feedback_text: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LessonDetailResponse(BaseModel):
    id: str
    module_id: str
    title: str
    content_text: Optional[str] = None
    order_index: int
    duration_minutes: int
    is_completed: bool = False
    watch_time_seconds: int = 0
    learning_resources: List[LearningResourceResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModuleDetailResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str] = None
    order_index: int
    lessons: List[LessonDetailResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseCatalogItem(BaseModel):
    id: str
    code: str
    title: str
    description: str
    category: str
    level: str
    estimated_hours: float
    thumbnail_url: Optional[str] = None
    is_published: bool
    instructor_name: str
    instructor_designation: Optional[str] = None
    modules_count: int = 0
    lessons_count: int = 0
    enrolled_count: int = 0
    rating: float = 0.0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseDetailResponse(BaseModel):
    id: str
    trainer_id: str
    instructor_name: str
    instructor_designation: Optional[str] = None
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
    modules: List[ModuleDetailResponse] = []
    modules_count: int = 0
    lessons_count: int = 0
    is_enrolled: bool = False
    enrollment_status: Optional[str] = None
    progress_percentage: float = 0.0
    completed_lesson_ids: List[str] = []
    learning_resources: List[LearningResourceResponse] = []
    average_rating: float = 0.0
    total_ratings: int = 0
    feedbacks: List[CourseFeedbackResponse] = []

    model_config = ConfigDict(from_attributes=True)


class EnrolledCourseSummary(BaseModel):
    course: CourseCatalogItem
    enrollment_id: str
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    progress_percentage: float = 0.0
    completed_lessons: int = 0
    total_lessons: int = 0

    model_config = ConfigDict(from_attributes=True)
