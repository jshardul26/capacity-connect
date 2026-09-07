import {
  CourseCatalogItem,
  CourseDetail,
  CourseEnrollmentResponse,
  EnrolledCourseSummary,
  LessonProgressUpdate,
  LessonProgressResponse,
  CourseFeedbackCreate,
  CourseFeedbackItem,
  LearningResourceCreate,
  LearningResource,
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

export const courseService = {
  /**
   * Discover published courses with optional category, level, and search filters.
   */
  getCourses: (params?: {
    category?: string;
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CourseCatalogItem[]> => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') {
      query.append('category', params.category);
    }
    if (params?.level && params.level !== 'All') {
      query.append('level', params.level);
    }
    if (params?.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params?.page) {
      query.append('page', params.page.toString());
    }
    if (params?.limit) {
      query.append('limit', params.limit.toString());
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<CourseCatalogItem[]>(`/courses${qStr}`);
  },

  /**
   * Get full course syllabus, modules, lessons, resources, and trainee progress.
   */
  getCourseById: (courseId: string, token: string): Promise<CourseDetail> => {
    return request<CourseDetail>(`/courses/${courseId}`, token);
  },

  /**
   * Fetch all courses enrolled by the authenticated trainee.
   */
  getMyEnrolledCourses: (token: string): Promise<EnrolledCourseSummary[]> => {
    return request<EnrolledCourseSummary[]>('/courses/enrolled/me', token);
  },

  /**
   * Enroll in a course.
   */
  enrollInCourse: (courseId: string, token: string): Promise<CourseEnrollmentResponse> => {
    return request<CourseEnrollmentResponse>(`/courses/${courseId}/enroll`, token, {
      method: 'POST',
    });
  },

  /**
   * Unenroll / drop an enrolled course.
   */
  dropCourse: (courseId: string, token: string): Promise<void> => {
    return request<void>(`/courses/${courseId}/enroll`, token, {
      method: 'DELETE',
    });
  },

  /**
   * Update lesson watch time and completion status.
   */
  updateLessonProgress: (
    courseId: string,
    data: LessonProgressUpdate,
    token: string
  ): Promise<LessonProgressResponse> => {
    return request<LessonProgressResponse>(`/courses/${courseId}/progress`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Submit numerical rating and feedback for course.
   */
  submitFeedback: (
    courseId: string,
    data: CourseFeedbackCreate,
    token: string
  ): Promise<CourseFeedbackItem> => {
    return request<CourseFeedbackItem>(`/courses/${courseId}/feedback`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Attach video, presentation, or study material to a lesson (Trainer / Admin).
   */
  attachResource: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    data: LearningResourceCreate,
    token: string
  ): Promise<LearningResource> => {
    return request<LearningResource>(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Delete a learning resource.
   */
  deleteResource: (resourceId: string, token: string): Promise<void> => {
    return request<void>(`/courses/resources/${resourceId}`, token, {
      method: 'DELETE',
    });
  },
};
