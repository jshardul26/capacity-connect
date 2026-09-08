from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class CompetencyBase(BaseModel):
    name: str = Field(..., max_length=150, description="Standardized competency name")
    domain: str = Field(..., max_length=100, description="Meteorological operational domain")
    description: Optional[str] = None
    criticality_weight: float = Field(default=1.0, gt=0.0)


class CompetencyCreate(CompetencyBase):
    pass


class CompetencyResponse(CompetencyBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetencyTaxonomyResponse(BaseModel):
    total: int
    competencies: List[CompetencyResponse]


class TraineeCompetencyItem(BaseModel):
    id: str
    competency_id: str
    name: str
    domain: str
    proficiency_level: float = Field(..., ge=0.0, le=1.0)
    level_percentage: float = Field(..., ge=0.0, le=100.0)
    last_evaluated_at: datetime


class TraineeCompetencyMatrixResponse(BaseModel):
    user_id: str
    user_name: str
    competencies: List[TraineeCompetencyItem]


class TraineeCompetencyUpdateRequest(BaseModel):
    competency_id: str
    proficiency_level: float = Field(..., ge=0.0, le=1.0)


class CompetencyGapItem(BaseModel):
    competency: str
    competency_id: Optional[str] = None
    required: float
    current: float
    gap: float
    weighted_gap: float
    is_met: bool


class SkillGapAnalysisResponse(BaseModel):
    target_role: str
    target_role_title: str
    overall_readiness_percentage: float
    total_gap_magnitude: float
    gaps: List[CompetencyGapItem]


class CourseCompetencyItem(BaseModel):
    competency_id: str
    competency_name: str
    domain: str
    yield_level: float = Field(..., ge=0.0, le=1.0)


class CourseCompetencyMapRequest(BaseModel):
    competency_id: str
    yield_level: float = Field(default=0.50, ge=0.0, le=1.0)


class AssessmentCompetencyMapRequest(BaseModel):
    competency_id: str


class CourseRecommendationItem(BaseModel):
    course_id: str
    title: str
    code: str
    match_score: float = Field(..., ge=0.0, le=1.0)
    match_percentage: float = Field(..., ge=0.0, le=100.0)
    rationale: str
    thumbnail_url: Optional[str] = None
    imparted_competencies: List[Dict[str, Any]] = []


class TrainerMatchRequest(BaseModel):
    subject: str = Field(..., min_length=2, description="Target subject/topic to match trainer for")
    minimum_experience_years: Optional[float] = Field(default=0.0, ge=0.0)
    competency_id: Optional[str] = None


class TrainerMatchItem(BaseModel):
    trainer_id: str
    full_name: str
    email: str
    station_code: Optional[str] = None
    years_of_experience: float
    satisfaction_rating: float
    expertise_similarity: float
    experience_score: float
    satisfaction_score: float
    composite_score: float
    match_percentage: float
    matched_expertise: Optional[str] = None
    availability_confirmed: bool
    rationale: str


class TrainerMatchResponse(BaseModel):
    subject: str
    total_matched: int
    trainers: List[TrainerMatchItem]


class RoleBenchmarkResponse(BaseModel):
    role_key: str
    title: str
    description: str
    requirements: Dict[str, float]
