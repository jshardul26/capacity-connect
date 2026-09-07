import {
  TraineeProfileFull,
  TraineeProfileUpdate,
  TraineeProfileResponse,
  Qualification,
  WorkExperience,
  Skill,
  Interest,
  Certificate,
  TraineeDashboardResponse,
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

  return response.json() as Promise<T>;
}

export const traineeService = {
  getProfile: (token: string): Promise<TraineeProfileFull> => {
    return request<TraineeProfileFull>('/trainee/profile', token);
  },

  updateProfile: (token: string, data: TraineeProfileUpdate): Promise<TraineeProfileResponse> => {
    return request<TraineeProfileResponse>('/trainee/profile', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getQualifications: (token: string): Promise<Qualification[]> => {
    return request<Qualification[]>('/trainee/qualifications', token);
  },

  addQualification: (
    token: string,
    data: {
      degree: string;
      field_of_study: string;
      institution: string;
      passing_year: number;
      grade_or_percentage?: string | null;
    }
  ): Promise<Qualification> => {
    return request<Qualification>('/trainee/qualifications', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteQualification: (token: string, id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/trainee/qualifications/${id}`, token, {
      method: 'DELETE',
    });
  },

  getWorkExperiences: (token: string): Promise<WorkExperience[]> => {
    return request<WorkExperience[]>('/trainee/work-experiences', token);
  },

  addWorkExperience: (
    token: string,
    data: {
      organization: string;
      designation: string;
      start_date: string;
      end_date?: string | null;
      is_current?: boolean;
      responsibilities?: string | null;
    }
  ): Promise<WorkExperience> => {
    return request<WorkExperience>('/trainee/work-experiences', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteWorkExperience: (token: string, id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/trainee/work-experiences/${id}`, token, {
      method: 'DELETE',
    });
  },

  getSkills: (token: string): Promise<Skill[]> => {
    return request<Skill[]>('/trainee/skills', token);
  },

  addSkill: (
    token: string,
    data: { name: string; proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }
  ): Promise<Skill> => {
    return request<Skill>('/trainee/skills', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteSkill: (token: string, id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/trainee/skills/${id}`, token, {
      method: 'DELETE',
    });
  },

  getInterests: (token: string): Promise<Interest[]> => {
    return request<Interest[]>('/trainee/interests', token);
  },

  addInterest: (token: string, name: string): Promise<Interest> => {
    return request<Interest>('/trainee/interests', token, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  deleteInterest: (token: string, id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/trainee/interests/${id}`, token, {
      method: 'DELETE',
    });
  },

  getCertificates: (token: string): Promise<Certificate[]> => {
    return request<Certificate[]>('/trainee/certificates', token);
  },

  addCertificate: (
    token: string,
    data: {
      title: string;
      issuing_organization: string;
      issue_date: string;
      expiry_date?: string | null;
      credential_id?: string | null;
      certificate_url?: string | null;
    }
  ): Promise<Certificate> => {
    return request<Certificate>('/trainee/certificates', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteCertificate: (token: string, id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/trainee/certificates/${id}`, token, {
      method: 'DELETE',
    });
  },

  getDashboard: (token: string): Promise<TraineeDashboardResponse> => {
    return request<TraineeDashboardResponse>('/trainee/dashboard', token);
  },
};
