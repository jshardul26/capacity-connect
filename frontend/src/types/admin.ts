/**
 * Admin Module (Phase 7) Types
 */

export interface AdminDashboardMetrics {
  total_users: number;
  trainees_count: number;
  trainers_count: number;
  admins_count: number;
  pending_approvals_count: number;
  approved_users_count: number;
  rejected_users_count: number;
  suspended_users_count: number;
  total_courses: number;
  published_courses_count: number;
  draft_courses_count: number;
  total_enrollments: number;
  completed_enrollments_count: number;
  total_assessments: number;
  total_assessment_attempts: number;
  overall_pass_rate_percentage: number;
  total_certificates_issued: number;
  unique_stations_count: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  station_code?: string | null;
  organization: string;
  role: string;
  status: string;
  created_at: string;
}

export interface AdminCourseItem {
  id: string;
  title: string;
  code: string;
  trainer_id: string;
  trainer_name?: string | null;
  category: string;
  level: string;
  is_published: boolean;
  modules_count: number;
  enrollments_count: number;
  average_rating: number;
  created_at: string;
}

export interface AdminEnrollmentItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  course_id: string;
  course_title: string;
  status: string;
  enrolled_at: string;
  completed_at?: string | null;
}

export interface AdminAssessmentItem {
  id: string;
  title: string;
  subject: string;
  creator_name?: string | null;
  duration_minutes: number;
  passing_score: number;
  total_marks: number;
  is_published: boolean;
  is_available: boolean;
  total_attempts: number;
  pass_percentage: number;
}

export interface AdminCertificateItem {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  issuing_organization: string;
  issue_date: string;
  is_system_generated: boolean;
  created_at: string;
}

export interface AnnouncementItem {
  id: string;
  published_by: string;
  author_name?: string | null;
  title: string;
  content: string;
  is_featured_on_homepage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  is_featured_on_homepage?: boolean;
  is_active?: boolean;
}

export interface AnnouncementUpdateRequest {
  title?: string;
  content?: string;
  is_featured_on_homepage?: boolean;
  is_active?: boolean;
}

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  notification_type: 'info' | 'warning' | 'success' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface NotificationCreateRequest {
  user_id?: string | null;
  title: string;
  message: string;
  notification_type?: string;
}

export interface AchievementItem {
  id: string;
  user_id: string;
  user_name?: string | null;
  title: string;
  description?: string | null;
  badge_icon_url?: string | null;
  awarded_date: string;
  is_displayed_on_homepage: boolean;
  created_at: string;
}

export interface AchievementCreateRequest {
  user_id: string;
  title: string;
  description?: string;
  badge_icon_url?: string;
  is_displayed_on_homepage?: boolean;
}

export interface AuditLogItem {
  id: string;
  admin_user_id: string;
  admin_email?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: string | null;
  created_at: string;
}
