import {
  CompetencyTaxonomyResponse,
  RoleBenchmarkResponse,
  TraineeCompetencyMatrixResponse,
  TraineeCompetencyItem,
  SkillGapAnalysisResponse,
  CourseRecommendationItem,
  CourseCompetencyItem,
  TrainerMatchResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string'
          ? errorJson.detail
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const competencyService = {
  // 1. Taxonomy of Standard Competencies
  async getTaxonomy(token?: string | null): Promise<CompetencyTaxonomyResponse> {
    return request<CompetencyTaxonomyResponse>('/competency/taxonomy', token);
  },

  // 2. Standardized Role Benchmarks
  async getRoles(token?: string | null): Promise<RoleBenchmarkResponse[]> {
    return request<RoleBenchmarkResponse[]>('/competency/roles', token);
  },

  // 3. Trainee Competency Matrix for Spider / Radar Chart
  async getTraineeMatrix(
    userId: string | number,
    token?: string | null
  ): Promise<TraineeCompetencyMatrixResponse> {
    return request<TraineeCompetencyMatrixResponse>(`/competency/trainee/${userId}/matrix`, token);
  },

  // 4. Skill Gap Calculation against Target Role
  async getSkillGaps(
    roleKey: string = 'Senior_Radar_Meteorologist',
    userId?: string | number | null,
    token?: string | null
  ): Promise<SkillGapAnalysisResponse> {
    const params = new URLSearchParams({ target_role: roleKey });
    if (userId !== undefined && userId !== null) {
      params.append('user_id', String(userId));
    }
    return request<SkillGapAnalysisResponse>(`/competency/gaps?${params.toString()}`, token);
  },

  // 5. Scikit-Learn Cosine Similarity Course Recommendations
  async getCourseRecommendations(
    roleKey: string = 'Senior_Radar_Meteorologist',
    userId?: string | number | null,
    token?: string | null
  ): Promise<CourseRecommendationItem[]> {
    const params = new URLSearchParams({ target_role: roleKey });
    if (userId !== undefined && userId !== null) {
      params.append('user_id', String(userId));
    }
    return request<CourseRecommendationItem[]>(
      `/competency/recommendations/courses?${params.toString()}`,
      token
    );
  },

  // 6. Optimal Trainer Matching for Subject
  async matchTrainer(
    payload: {
      subject: string;
      minimum_experience_years?: number;
      competency_id?: string;
    },
    token: string
  ): Promise<TrainerMatchResponse> {
    return request<TrainerMatchResponse>('/competency/match-trainer', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 7. Course Competency Yield Mapping
  async mapCourseCompetency(
    courseId: string,
    competencyId: string,
    yieldLevel: number,
    token: string
  ): Promise<CourseCompetencyItem> {
    return request<CourseCompetencyItem>(`/competency/courses/${courseId}/mapping`, token, {
      method: 'POST',
      body: JSON.stringify({
        competency_id: competencyId,
        yield_level: yieldLevel,
      }),
    });
  },

  // 8. Get Course Competencies
  async getCourseCompetencies(
    courseId: string,
    token?: string | null
  ): Promise<CourseCompetencyItem[]> {
    return request<CourseCompetencyItem[]>(`/competency/courses/${courseId}/mapping`, token);
  },

  // 9. Assessment Competency Mapping
  async mapAssessmentCompetency(
    assessmentId: string,
    competencyId: string,
    token: string
  ): Promise<{ message: string; assessment_id: string; competency_id: string }> {
    return request<{ message: string; assessment_id: string; competency_id: string }>(
      `/competency/assessments/${assessmentId}/mapping`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ competency_id: competencyId }),
      }
    );
  },

  // 10. Direct Trainee Competency Update
  async updateTraineeCompetency(
    userId: string | number,
    competencyId: string,
    proficiencyLevel: number,
    token: string
  ): Promise<TraineeCompetencyItem> {
    return request<TraineeCompetencyItem>(`/competency/trainee/${userId}/update`, token, {
      method: 'POST',
      body: JSON.stringify({
        competency_id: competencyId,
        proficiency_level: proficiencyLevel,
      }),
    });
  },
};
