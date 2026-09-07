export interface CompetencyItem {
  id: string;
  name: string;
  domain: string;
  description?: string;
  created_at: string;
}

export interface CompetencyTaxonomyResponse {
  total: number;
  competencies: CompetencyItem[];
}

export interface TraineeCompetencyItem {
  id: string;
  competency_id: string;
  name: string;
  domain: string;
  proficiency_level: number;
  level_percentage: number;
  last_evaluated_at: string;
}

export interface TraineeCompetencyMatrixResponse {
  user_id: string;
  user_name: string;
  competencies: TraineeCompetencyItem[];
}

export interface CompetencyGapItem {
  competency: string;
  competency_id?: string;
  required: number;
  current: number;
  gap: number;
  is_met: boolean;
}

export interface SkillGapAnalysisResponse {
  target_role: string;
  target_role_title: string;
  overall_readiness_percentage: number;
  total_gap_magnitude: number;
  gaps: CompetencyGapItem[];
}

export interface CourseRecommendationItem {
  course_id: string;
  title: string;
  code: string;
  match_score: number;
  match_percentage: number;
  rationale: string;
  thumbnail_url?: string;
  imparted_competencies: Array<{
    competency: string;
    yield_level: number;
  }>;
}

export interface CourseCompetencyItem {
  competency_id: string;
  competency_name: string;
  domain: string;
  yield_level: number;
}

export interface TrainerMatchItem {
  trainer_id: string;
  full_name: string;
  email: string;
  station_code?: string;
  years_of_experience: number;
  satisfaction_rating: number;
  expertise_similarity: number;
  experience_score: number;
  satisfaction_score: number;
  composite_score: number;
  match_percentage: number;
  matched_expertise?: string;
  rationale: string;
}

export interface TrainerMatchResponse {
  subject: string;
  total_matched: number;
  trainers: TrainerMatchItem[];
}

export interface RoleBenchmarkResponse {
  role_key: string;
  title: string;
  description: string;
  requirements: Record<string, number>;
}
