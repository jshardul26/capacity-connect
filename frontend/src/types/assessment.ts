/**
 * Assessment System (Phase 6) Types
 */

export interface QuestionOptionItem {
  id: string;
  text: string;
}

export interface QuestionPublic {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false';
  options: QuestionOptionItem[];
  marks: number;
  order_index: number;
}

export interface QuestionFull extends QuestionPublic {
  correct_option: string;
  explanation?: string | null;
}

export interface AssessmentAttemptSummary {
  attempt_id: string;
  score_obtained: number;
  total_marks: number;
  is_passed: boolean;
  attempt_status: 'in_progress' | 'completed' | 'timed_out';
  start_time: string;
  end_time?: string | null;
}

export interface AssessmentListItem {
  id: string;
  course_id?: string | null;
  created_by: string;
  creator_name?: string | null;
  title: string;
  description?: string | null;
  subject: string;
  duration_minutes: number;
  passing_score: number;
  total_marks: number;
  deadline?: string | null;
  is_published: boolean;
  is_available: boolean;
  questions_count: number;
  attempts_count: number;
  user_latest_attempt?: AssessmentAttemptSummary | null;
  created_at: string;
}

export interface AssessmentDetailResponse {
  id: string;
  course_id?: string | null;
  created_by: string;
  creator_name?: string | null;
  title: string;
  description?: string | null;
  subject: string;
  duration_minutes: number;
  passing_score: number;
  total_marks: number;
  deadline?: string | null;
  is_published: boolean;
  is_available: boolean;
  questions_count: number;
  questions?: QuestionFull[] | null;
  attempts_count: number;
  my_attempts: AssessmentAttemptSummary[];
  created_at: string;
  updated_at: string;
}

export interface AssessmentStartResponse {
  attempt_id: string;
  assessment_id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_score: number;
  start_time: string;
  deadline?: string | null;
  questions: QuestionPublic[];
}

export interface AnswerSubmissionItem {
  question_id: string;
  selected_option?: string | null;
}

export interface AssessmentSubmitRequest {
  attempt_id: string;
  answers: AnswerSubmissionItem[];
}

export interface AssessmentSubmitResponse {
  attempt_id: string;
  assessment_id: string;
  score_obtained: number;
  total_marks: number;
  passing_score: number;
  is_passed: boolean;
  attempt_status: string;
  attempt_signature: string;
  start_time: string;
  end_time: string;
  answers_count: number;
  correct_answers_count: number;
}

export interface AnswerResultDetail {
  question_id: string;
  question_text: string;
  options: QuestionOptionItem[];
  selected_option?: string | null;
  correct_option: string;
  is_correct: boolean;
  marks_awarded: number;
  max_marks: number;
  explanation?: string | null;
}

export interface AssessmentAttemptDetail {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  subject: string;
  user_id: string;
  user_name: string;
  score_obtained: number;
  total_marks: number;
  passing_score: number;
  is_passed: boolean;
  attempt_status: string;
  attempt_signature?: string | null;
  start_time: string;
  end_time?: string | null;
  answers: AnswerResultDetail[];
}

export interface AssessmentMonitoringItem {
  attempt_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  score_obtained: number;
  total_marks: number;
  is_passed: boolean;
  attempt_status: string;
  start_time: string;
  end_time?: string | null;
}

export interface AssessmentMonitoringResponse {
  assessment_id: string;
  title: string;
  subject: string;
  total_attempts: number;
  passed_count: number;
  failed_count: number;
  average_score: number;
  pass_percentage: number;
  attempts: AssessmentMonitoringItem[];
}
