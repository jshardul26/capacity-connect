import {
  TrainerProfile,
  TrainerExpertise,
  Course,
  CourseCreateRequest,
  CourseModule,
  Lesson,
  Questionnaire,
  Question,
  TrainerLibraryItem,
  TrainerDashboardData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

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

export const trainerService = {
  // 1. Profile & Expertise
  getProfile: (token: string): Promise<TrainerProfile> => {
    return request<TrainerProfile>('/trainer/profile', token);
  },

  updateProfile: (
    token: string,
    data: {
      designation?: string;
      division?: string;
      years_of_experience?: number;
      biography?: string;
      avatar_url?: string;
    }
  ): Promise<TrainerProfile> => {
    return request<TrainerProfile>('/trainer/profile', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getExpertise: (token: string): Promise<TrainerExpertise[]> => {
    return request<TrainerExpertise[]>('/trainer/expertise', token);
  },

  addExpertise: (
    token: string,
    data: {
      subject: string;
      proficiency_level: 'intermediate' | 'advanced' | 'expert';
      years_in_subject: number;
    }
  ): Promise<TrainerExpertise> => {
    return request<TrainerExpertise>('/trainer/expertise', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteExpertise: (token: string, id: string): Promise<void> => {
    return request<void>(`/trainer/expertise/${id}`, token, {
      method: 'DELETE',
    });
  },

  // 2. Course Foundation
  getCourses: (token: string): Promise<Course[]> => {
    return request<Course[]>('/trainer/courses', token);
  },

  getCourseDetails: (token: string, courseId: string): Promise<Course> => {
    return request<Course>(`/trainer/courses/${courseId}`, token);
  },

  createCourse: (token: string, data: CourseCreateRequest): Promise<Course> => {
    return request<Course>('/trainer/courses', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCourse: (
    token: string,
    courseId: string,
    data: Partial<CourseCreateRequest>
  ): Promise<Course> => {
    return request<Course>(`/trainer/courses/${courseId}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCourse: (token: string, courseId: string): Promise<void> => {
    return request<void>(`/trainer/courses/${courseId}`, token, {
      method: 'DELETE',
    });
  },

  addModule: (
    token: string,
    courseId: string,
    data: { title: string; description?: string; order_index?: number }
  ): Promise<CourseModule> => {
    return request<CourseModule>(`/trainer/courses/${courseId}/modules`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteModule: (token: string, moduleId: string): Promise<void> => {
    return request<void>(`/trainer/modules/${moduleId}`, token, {
      method: 'DELETE',
    });
  },

  addLesson: (
    token: string,
    moduleId: string,
    data: { title: string; content_text?: string; order_index?: number; duration_minutes?: number }
  ): Promise<Lesson> => {
    return request<Lesson>(`/trainer/modules/${moduleId}/lessons`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLesson: (token: string, lessonId: string): Promise<void> => {
    return request<void>(`/trainer/lessons/${lessonId}`, token, {
      method: 'DELETE',
    });
  },

  // 3. Questionnaire & Question Creation
  getQuestionnaires: (token: string, courseId?: string): Promise<Questionnaire[]> => {
    const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
    return request<Questionnaire[]>(`/trainer/questionnaires${query}`, token);
  },

  getQuestionnaire: (token: string, id: string): Promise<Questionnaire> => {
    return request<Questionnaire>(`/trainer/questionnaires/${id}`, token);
  },

  createQuestionnaire: (
    token: string,
    data: {
      title: string;
      description?: string;
      subject: string;
      course_id?: string | null;
      duration_minutes?: number;
      passing_score?: number;
      total_marks?: number;
      is_published?: boolean;
    }
  ): Promise<Questionnaire> => {
    return request<Questionnaire>('/trainer/questionnaires', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteQuestionnaire: (token: string, id: string): Promise<void> => {
    return request<void>(`/trainer/questionnaires/${id}`, token, {
      method: 'DELETE',
    });
  },

  addQuestion: (
    token: string,
    questionnaireId: string,
    data: {
      question_text: string;
      question_type?: 'mcq' | 'true_false';
      options: { id: string; text: string }[];
      correct_option: string;
      explanation?: string;
      marks?: number;
      order_index?: number;
    }
  ): Promise<Question> => {
    return request<Question>(`/trainer/questionnaires/${questionnaireId}/questions`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteQuestion: (token: string, questionId: string): Promise<void> => {
    return request<void>(`/trainer/questions/${questionId}`, token, {
      method: 'DELETE',
    });
  },

  // 4. Trainer Library
  getLibrary: (token: string): Promise<TrainerLibraryItem[]> => {
    return request<TrainerLibraryItem[]>('/trainer/library', token);
  },

  addLibraryItem: (
    token: string,
    data: {
      title: string;
      description?: string;
      resource_type: 'video' | 'presentation' | 'study_material' | 'dataset' | 'code';
      file_path: string;
      file_size_bytes: number;
      sha256_checksum: string;
      is_public_to_trainees?: boolean;
    }
  ): Promise<TrainerLibraryItem> => {
    return request<TrainerLibraryItem>('/trainer/library', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLibraryItem: (token: string, id: string): Promise<void> => {
    return request<void>(`/trainer/library/${id}`, token, {
      method: 'DELETE',
    });
  },

  // 5. Dashboard & Analytics
  getDashboard: (token: string): Promise<TrainerDashboardData> => {
    return request<TrainerDashboardData>('/trainer/dashboard', token);
  },
};
