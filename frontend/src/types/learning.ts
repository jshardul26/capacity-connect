/**
 * Learning Management System (LMS) Phase 5 Types
 */

export type ResourceType = 'video' | 'presentation' | 'study_material';

export interface LearningResource {
  id: string;
  lesson_id?: string | null;
  course_id?: string | null;
  title: string;
  resource_type: ResourceType;
  file_url: string;
  file_size_bytes: number;
  sha256_checksum: string;
  duration_seconds: number;
  created_at: string;
}

export interface LearningResourceCreate {
  title: string;
  resource_type: ResourceType;
  file_url: string;
  file_size_bytes: number;
  sha256_checksum: string;
  duration_seconds?: number;
}

export interface LessonDetail {
  id: string;
  module_id: string;
  title: string;
  content_text?: string | null;
  order_index: number;
  duration_minutes: number;
  is_completed: boolean;
  watch_time_seconds: number;
  learning_resources: LearningResource[];
  created_at: string;
}

export interface ModuleDetail {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
  lessons: LessonDetail[];
  created_at: string;
}

export interface CourseFeedbackItem {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  feedback_text?: string | null;
  created_at: string;
  user_name?: string | null;
}

export interface CourseCatalogItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: string;
  estimated_hours: number;
  thumbnail_url?: string | null;
  is_published: boolean;
  instructor_name: string;
  instructor_designation?: string | null;
  modules_count: number;
  lessons_count: number;
  enrolled_count: number;
  rating: number;
  created_at: string;
}

export interface CourseDetail {
  id: string;
  trainer_id: string;
  instructor_name: string;
  instructor_designation?: string | null;
  code: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnail_url?: string | null;
  is_published: boolean;
  estimated_hours: number;
  created_at: string;
  updated_at: string;
  modules: ModuleDetail[];
  modules_count: number;
  lessons_count: number;
  is_enrolled: boolean;
  enrollment_status?: 'in_progress' | 'completed' | 'dropped' | null;
  progress_percentage: number;
  completed_lesson_ids: string[];
  learning_resources: LearningResource[];
  average_rating: number;
  total_ratings: number;
  feedbacks: CourseFeedbackItem[];
}

export interface CourseEnrollmentResponse {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string | null;
  status: 'in_progress' | 'completed' | 'dropped';
}

export interface EnrolledCourseSummary {
  course: CourseCatalogItem;
  enrollment_id: string;
  enrolled_at: string;
  completed_at?: string | null;
  status: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
}

export interface LessonProgressUpdate {
  lesson_id: string;
  watch_time_seconds: number;
  is_completed: boolean;
}

export interface LessonProgressResponse {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  watch_time_seconds: number;
  last_accessed_at: string;
}

export interface CourseFeedbackCreate {
  rating: number;
  feedback_text?: string | null;
}
