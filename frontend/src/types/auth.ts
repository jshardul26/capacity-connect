export type UserRole = 'trainee' | 'trainer' | 'admin';
export type UserStatus = 'pending_approval' | 'approved' | 'rejected';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string | null;
  station_code: string;
  organization: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'trainee' | 'trainer';
  phone_number?: string;
  station_code?: string;
  organization?: string;
}

export interface UserRegisterResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  message: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserApprovalUpdate {
  status: 'approved' | 'rejected';
}
