export interface TrainerExpertise {
  id: string;
  trainer_profile_id?: string;
  subject: string;
  proficiency_level: 'intermediate' | 'advanced' | 'expert';
  years_in_subject: number;
  created_at?: string;
}

export interface TrainerLibraryItem {
  id: string;
  trainer_profile_id?: string;
  title: string;
  description?: string | null;
  resource_type: 'video' | 'presentation' | 'study_material' | 'dataset' | 'code';
  file_path: string;
  file_size_bytes: number;
  sha256_checksum: string;
  is_public_to_trainees: boolean;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id?: string;
  title: string;
  content_text?: string | null;
  order_index: number;
  duration_minutes: number;
  created_at?: string;
}

export interface CourseModule {
  id: string;
  course_id?: string;
  title: string;
  description?: string | null;
  order_index: number;
  created_at?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  trainer_id?: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  thumbnail_url?: string | null;
  is_published: boolean;
  estimated_hours: number;
  created_at: string;
  updated_at: string;
  modules?: CourseModule[];
  modules_count?: number;
  lessons_count?: number;
}

export interface CourseCreateRequest {
  code: string;
  title: string;
  description: string;
  category: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  thumbnail_url?: string | null;
  estimated_hours?: number;
  is_published?: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  assessment_id?: string;
  question_text: string;
  question_type: 'mcq' | 'true_false';
  options: QuestionOption[];
  correct_option: string;
  explanation?: string | null;
  marks: number;
  order_index: number;
  created_at?: string;
}

export interface Questionnaire {
  id: string;
  course_id?: string | null;
  created_by?: string;
  title: string;
  description?: string | null;
  subject: string;
  duration_minutes: number;
  passing_score: number;
  total_marks: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  questions_count?: number;
  questions?: Question[];
}

export interface TrainerProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  station_code?: string | null;
  organization?: string | null;
  role: string;
  designation?: string | null;
  division?: string | null;
  years_of_experience?: number | null;
  biography?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  expertise: TrainerExpertise[];
  courses_count: number;
  library_count: number;
}

export interface TrainerDashboardData {
  trainer_id: string;
  full_name: string;
  designation?: string | null;
  division?: string | null;
  total_courses: number;
  published_courses: number;
  total_modules: number;
  total_lessons: number;
  total_library_resources: number;
  total_questionnaires: number;
  total_questions: number;
  total_enrolled_trainees: number;
  total_assessments_attempted: number;
  recent_courses: Course[];
}
