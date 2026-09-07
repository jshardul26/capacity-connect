from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


# ----------------------------------------------------------------------
# 1. Profile Schemas
# ----------------------------------------------------------------------

class TraineeProfileUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    designation: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    posting_location: Optional[str] = Field(default=None, max_length=150)
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class TraineeProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    designation: Optional[str] = None
    department: Optional[str] = None
    posting_location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ----------------------------------------------------------------------
# 2. Qualification Schemas
# ----------------------------------------------------------------------

class QualificationCreate(BaseModel):
    degree: str = Field(..., min_length=2, max_length=150)
    field_of_study: str = Field(..., min_length=2, max_length=150)
    institution: str = Field(..., min_length=2, max_length=255)
    passing_year: int = Field(..., ge=1950, le=2050)
    grade_or_percentage: Optional[str] = Field(default=None, max_length=50)


class QualificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trainee_profile_id: str
    degree: str
    field_of_study: str
    institution: str
    passing_year: int
    grade_or_percentage: Optional[str] = None
    created_at: datetime


# ----------------------------------------------------------------------
# 3. Work Experience Schemas
# ----------------------------------------------------------------------

class WorkExperienceCreate(BaseModel):
    organization: str = Field(..., min_length=2, max_length=255)
    designation: str = Field(..., min_length=2, max_length=150)
    start_date: str = Field(..., description="Start date (YYYY-MM-DD or YYYY-MM)")
    end_date: Optional[str] = Field(default=None, description="End date (YYYY-MM-DD or YYYY-MM)")
    is_current: bool = False
    responsibilities: Optional[str] = None


class WorkExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trainee_profile_id: str
    organization: str
    designation: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool
    responsibilities: Optional[str] = None
    created_at: datetime


# ----------------------------------------------------------------------
# 4. Skill Schemas
# ----------------------------------------------------------------------

ProficiencyLevel = Literal["beginner", "intermediate", "advanced", "expert"]


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    proficiency_level: ProficiencyLevel = "beginner"


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trainee_profile_id: str
    name: str
    proficiency_level: str
    created_at: datetime


# ----------------------------------------------------------------------
# 5. Interest Schemas
# ----------------------------------------------------------------------

class InterestCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class InterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trainee_profile_id: str
    name: str
    created_at: datetime


# ----------------------------------------------------------------------
# 6. Certificate Schemas
# ----------------------------------------------------------------------

class CertificateCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    issuing_organization: str = Field(..., min_length=2, max_length=255)
    issue_date: str = Field(..., description="Issue date (YYYY-MM-DD)")
    expiry_date: Optional[str] = Field(default=None, description="Expiry date if applicable")
    credential_id: Optional[str] = Field(default=None, max_length=150)
    certificate_url: Optional[str] = Field(default=None, max_length=500)


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    issuing_organization: str
    issue_date: str
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    certificate_url: Optional[str] = None
    is_system_generated: bool
    created_at: datetime


# ----------------------------------------------------------------------
# 7. Aggregated Trainee Profile & Dashboard
# ----------------------------------------------------------------------

class TraineeProfileFull(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    station_code: Optional[str] = None
    organization: str
    role: str
    status: str
    designation: Optional[str] = None
    department: Optional[str] = None
    posting_location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    qualifications: List[QualificationResponse] = []
    work_experiences: List[WorkExperienceResponse] = []
    skills: List[SkillResponse] = []
    interests: List[InterestResponse] = []
    certificates: List[CertificateResponse] = []


class TraineeDashboardMetrics(BaseModel):
    total_qualifications: int = 0
    total_experiences: int = 0
    total_skills: int = 0
    total_interests: int = 0
    total_certificates: int = 0
    profile_completion_percentage: int = 0


class TraineeDashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    full_name: str
    email: str
    station_code: Optional[str] = None
    organization: str
    designation: Optional[str] = None
    department: Optional[str] = None
    metrics: TraineeDashboardMetrics
    qualifications: List[QualificationResponse] = []
    work_experiences: List[WorkExperienceResponse] = []
    skills: List[SkillResponse] = []
    interests: List[InterestResponse] = []
    certificates: List[CertificateResponse] = []
