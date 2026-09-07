from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class AdminDashboardMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_users: int = 0
    trainees_count: int = 0
    trainers_count: int = 0
    admins_count: int = 0
    pending_approvals_count: int = 0
    approved_users_count: int = 0
    rejected_users_count: int = 0
    suspended_users_count: int = 0
    total_courses: int = 0
    published_courses_count: int = 0
    draft_courses_count: int = 0
    total_enrollments: int = 0
    completed_enrollments_count: int = 0
    total_assessments: int = 0
    total_assessment_attempts: int = 0
    overall_pass_rate_percentage: float = 0.0
    total_certificates_issued: int = 0
    unique_stations_count: int = 0


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role must be 'trainee', 'trainer', or 'admin'")


class UserStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Status must be 'approved', 'rejected', 'suspended', or 'pending_approval'")


class UserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    station_code: Optional[str] = None
    organization: str
    role: str
    status: str
    created_at: datetime


class AdminCourseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    code: str
    trainer_id: str
    trainer_name: Optional[str] = None
    category: str
    level: str
    is_published: bool
    modules_count: int = 0
    enrollments_count: int = 0
    average_rating: float = 0.0
    created_at: datetime


class AdminEnrollmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    user_name: str
    user_email: str
    course_id: str
    course_title: str
    status: str
    enrolled_at: datetime
    completed_at: Optional[datetime] = None


class AdminAssessmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    subject: str
    creator_name: Optional[str] = None
    duration_minutes: int
    passing_score: float
    total_marks: float
    is_published: bool
    is_available: bool
    total_attempts: int = 0
    pass_percentage: float = 0.0


class AdminCertificateItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    user_name: str
    title: str
    issuing_organization: str
    issue_date: str
    is_system_generated: bool
    created_at: datetime


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=5)
    is_featured_on_homepage: bool = False
    is_active: bool = True


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    content: Optional[str] = Field(None, min_length=5)
    is_featured_on_homepage: Optional[bool] = None
    is_active: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    published_by: str
    author_name: Optional[str] = None
    title: str
    content: str
    is_featured_on_homepage: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class NotificationCreate(BaseModel):
    user_id: Optional[str] = Field(None, description="Target user ID or None for global broadcast")
    title: str = Field(..., min_length=3, max_length=255)
    message: str = Field(..., min_length=3)
    notification_type: str = Field("info", description="info, warning, success, or alert")


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime


class AchievementCreate(BaseModel):
    user_id: str
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    badge_icon_url: Optional[str] = None
    is_displayed_on_homepage: bool = False


class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    user_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    badge_icon_url: Optional[str] = None
    awarded_date: datetime
    is_displayed_on_homepage: bool
    created_at: datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    admin_user_id: str
    admin_email: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
