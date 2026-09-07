export interface TraineeProfileUpdate {
  designation?: string;
  department?: string;
  posting_location?: string;
  bio?: string;
  avatar_url?: string;
}

export interface TraineeProfileResponse {
  id: string;
  user_id: string;
  designation?: string | null;
  department?: string | null;
  posting_location?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Qualification {
  id: string;
  trainee_profile_id?: string;
  degree: string;
  field_of_study: string;
  institution: string;
  passing_year: number;
  grade_or_percentage?: string | null;
  created_at?: string;
}

export interface WorkExperience {
  id: string;
  trainee_profile_id?: string;
  organization: string;
  designation: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  responsibilities?: string | null;
  created_at?: string;
}

export interface Skill {
  id: string;
  trainee_profile_id?: string;
  name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at?: string;
}

export interface Interest {
  id: string;
  trainee_profile_id?: string;
  name: string;
  created_at?: string;
}

export interface Certificate {
  id: string;
  user_id?: string;
  title: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string | null;
  certificate_url?: string | null;
  is_system_generated?: boolean;
  created_at?: string;
}

export interface TraineeProfileFull {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  station_code?: string | null;
  organization: string;
  role: string;
  status: string;
  designation?: string | null;
  department?: string | null;
  posting_location?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;

  qualifications: Qualification[];
  work_experiences: WorkExperience[];
  skills: Skill[];
  interests: Interest[];
  certificates: Certificate[];
}

export interface TraineeDashboardMetrics {
  total_qualifications: number;
  total_experiences: number;
  total_skills: number;
  total_interests: number;
  total_certificates: number;
  profile_completion_percentage: number;
}

export interface TraineeDashboardResponse {
  user_id: string;
  full_name: string;
  email: string;
  station_code?: string | null;
  organization: string;
  designation?: string | null;
  department?: string | null;
  metrics: TraineeDashboardMetrics;
  qualifications: Qualification[];
  work_experiences: WorkExperience[];
  skills: Skill[];
  interests: Interest[];
  certificates: Certificate[];
}
