import {
  AssessmentListItem,
  AssessmentDetailResponse,
  AssessmentStartResponse,
  AssessmentSubmitRequest,
  AssessmentSubmitResponse,
  AssessmentAttemptSummary,
  AssessmentAttemptDetail,
  AssessmentMonitoringResponse,
  QuestionFull,
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
      // Non-JSON response
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const assessmentService = {
  /**
   * List assessments (with subject/course filters).
   */
  getAssessments: (
    token: string,
    params?: { subject?: string; course_id?: string; page?: number; limit?: number }
  ): Promise<AssessmentListItem[]> => {
    const query = new URLSearchParams();
    if (params?.subject && params.subject !== 'All') {
      query.append('subject', params.subject);
    }
    if (params?.course_id) {
      query.append('course_id', params.course_id);
    }
    if (params?.page) {
      query.append('page', params.page.toString());
    }
    if (params?.limit) {
      query.append('limit', params.limit.toString());
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<AssessmentListItem[]>(`/assessments${qStr}`, token);
  },

  /**
   * Get full assessment details, instructions, rules, and history.
   */
  getAssessmentById: (id: string, token: string): Promise<AssessmentDetailResponse> => {
    return request<AssessmentDetailResponse>(`/assessments/${id}`, token);
  },

  /**
   * Start a timed assessment attempt.
   */
  startAssessment: (id: string, token: string): Promise<AssessmentStartResponse> => {
    return request<AssessmentStartResponse>(`/assessments/${id}/start`, token, {
      method: 'POST',
    });
  },

  /**
   * Submit assessment answers for automated scoring and evaluation.
   */
  submitAssessment: (
    id: string,
    data: AssessmentSubmitRequest,
    token: string
  ): Promise<AssessmentSubmitResponse> => {
    return request<AssessmentSubmitResponse>(`/assessments/${id}/submit`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Fetch all past attempts for the current trainee.
   */
  getMyAttempts: (token: string): Promise<AssessmentAttemptSummary[]> => {
    return request<AssessmentAttemptSummary[]>('/assessments/attempts/me', token);
  },

  /**
   * View detailed question-by-question breakdown of an attempt.
   */
  getAttemptDetail: (attemptId: string, token: string): Promise<AssessmentAttemptDetail> => {
    return request<AssessmentAttemptDetail>(`/assessments/attempts/${attemptId}`, token);
  },

  /**
   * Trainer/Admin monitoring dashboard for an assessment.
   */
  getMonitoring: (id: string, token: string): Promise<AssessmentMonitoringResponse> => {
    return request<AssessmentMonitoringResponse>(`/assessments/${id}/monitoring`, token);
  },

  /**
   * Trainer create assessment.
   */
  createAssessment: (
    data: {
      title: string;
      subject: string;
      course_id?: string;
      description?: string;
      duration_minutes?: number;
      passing_score?: number;
      total_marks?: number;
      deadline?: string;
      is_published?: boolean;
    },
    token: string
  ): Promise<AssessmentDetailResponse> => {
    return request<AssessmentDetailResponse>('/assessments', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Trainer add question to assessment.
   */
  addQuestion: (
    id: string,
    data: {
      question_text: string;
      question_type: string;
      options_json: { id: string; text: string }[];
      correct_option: string;
      explanation?: string;
      marks?: number;
      order_index?: number;
    },
    token: string
  ): Promise<QuestionFull> => {
    return request<QuestionFull>(`/assessments/${id}/questions`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
