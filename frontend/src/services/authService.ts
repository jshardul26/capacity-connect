import {
  TokenResponse,
  TokenRefreshResponse,
  User,
  UserLoginRequest,
  UserRegisterRequest,
  UserRegisterResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
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
      // Non-JSON error body
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const authService = {
  login: (credentials: UserLoginRequest): Promise<TokenResponse> => {
    return request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  signup: (data: UserRegisterRequest): Promise<UserRegisterResponse> => {
    return request<UserRegisterResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: (token: string): Promise<User> => {
    return request<User>('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  refreshToken: (refreshToken: string): Promise<TokenRefreshResponse> => {
    return request<TokenRefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  logout: async (token?: string | null): Promise<{ message: string }> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers,
    });
  },

  getPendingUsers: (token: string): Promise<User[]> => {
    return request<User[]>('/admin/users/pending', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  approveUser: (userId: number, token: string): Promise<User> => {
    return request<User>(`/admin/users/${userId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  rejectUser: (userId: number, token: string): Promise<User> => {
    return request<User>(`/admin/users/${userId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
