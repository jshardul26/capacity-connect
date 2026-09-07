import {
  AdminDashboardMetrics,
  AdminUserListItem,
  AdminCourseItem,
  AdminEnrollmentItem,
  AdminAssessmentItem,
  AdminCertificateItem,
  AnnouncementItem,
  AnnouncementCreateRequest,
  AnnouncementUpdateRequest,
  NotificationItem,
  NotificationCreateRequest,
  AchievementItem,
  AchievementCreateRequest,
  AuditLogItem,
  User,
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

export const adminService = {
  // 1. Dashboard Metrics
  getDashboardMetrics: (token: string): Promise<AdminDashboardMetrics> => {
    return request<AdminDashboardMetrics>('/admin/dashboard', token);
  },

  // 2. User Management
  getUsers: (
    token: string,
    params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }
  ): Promise<AdminUserListItem[]> => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<AdminUserListItem[]>(`/admin/users${qStr}`, token);
  },

  getPendingUsers: (token: string): Promise<User[]> => {
    return request<User[]>('/admin/users/pending', token);
  },

  approveUser: (userId: string | number, token: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/admin/users/${userId}/approve`, token, {
      method: 'POST',
    });
  },

  rejectUser: (userId: string | number, token: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/admin/users/${userId}/reject`, token, {
      method: 'POST',
    });
  },

  updateUserRole: (
    userId: string,
    role: string,
    token: string
  ): Promise<{ status: string; new_role: string; message: string }> => {
    return request<{ status: string; new_role: string; message: string }>(
      `/admin/users/${userId}/role`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }
    );
  },

  updateUserStatus: (
    userId: string,
    status: string,
    token: string
  ): Promise<{ status: string; new_status: string; message: string }> => {
    return request<{ status: string; new_status: string; message: string }>(
      `/admin/users/${userId}/status`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }
    );
  },

  // 3. Course Governance
  getCourses: (token: string): Promise<AdminCourseItem[]> => {
    return request<AdminCourseItem[]>('/admin/courses', token);
  },

  toggleCoursePublish: (
    courseId: string,
    isPublished: boolean,
    token: string
  ): Promise<{ status: string; is_published: boolean }> => {
    return request<{ status: string; is_published: boolean }>(
      `/admin/courses/${courseId}/publish?is_published=${isPublished}`,
      token,
      {
        method: 'PUT',
      }
    );
  },

  getEnrollments: (token: string, limit = 50): Promise<AdminEnrollmentItem[]> => {
    return request<AdminEnrollmentItem[]>(`/admin/enrollments?limit=${limit}`, token);
  },

  getAssessments: (token: string): Promise<AdminAssessmentItem[]> => {
    return request<AdminAssessmentItem[]>('/admin/assessments', token);
  },

  getCertifications: (token: string, limit = 50): Promise<AdminCertificateItem[]> => {
    return request<AdminCertificateItem[]>(`/admin/certifications?limit=${limit}`, token);
  },

  // 4. Announcements
  getAnnouncements: (token: string): Promise<AnnouncementItem[]> => {
    return request<AnnouncementItem[]>('/admin/announcements', token);
  },

  createAnnouncement: (data: AnnouncementCreateRequest, token: string): Promise<AnnouncementItem> => {
    return request<AnnouncementItem>('/admin/announcements', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAnnouncement: (
    id: string,
    data: AnnouncementUpdateRequest,
    token: string
  ): Promise<AnnouncementItem> => {
    return request<AnnouncementItem>(`/admin/announcements/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAnnouncement: (id: string, token: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/admin/announcements/${id}`, token, {
      method: 'DELETE',
    });
  },

  // 5. Notifications
  sendNotification: (data: NotificationCreateRequest, token: string): Promise<NotificationItem> => {
    return request<NotificationItem>('/admin/notifications', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 6. Achievements
  getAchievements: (token: string): Promise<AchievementItem[]> => {
    return request<AchievementItem[]>('/admin/achievements', token);
  },

  awardAchievement: (data: AchievementCreateRequest, token: string): Promise<AchievementItem> => {
    return request<AchievementItem>('/admin/achievements', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  revokeAchievement: (id: string, token: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/admin/achievements/${id}`, token, {
      method: 'DELETE',
    });
  },

  // 7. Audit Logs
  getAuditLogs: (token: string, action?: string, limit = 50): Promise<AuditLogItem[]> => {
    const qStr = action ? `?action=${action}&limit=${limit}` : `?limit=${limit}`;
    return request<AuditLogItem[]>(`/admin/audit-logs${qStr}`, token);
  },

  // 8. Public & User Endpoints
  getActiveAnnouncements: (featuredOnly = false, limit = 20): Promise<AnnouncementItem[]> => {
    const qStr = featuredOnly ? `?featured_only=true&limit=${limit}` : `?limit=${limit}`;
    return request<AnnouncementItem[]>(`/announcements${qStr}`);
  },

  getMyNotifications: (token: string, limit = 30): Promise<NotificationItem[]> => {
    return request<NotificationItem[]>(`/notifications/me?limit=${limit}`, token);
  },

  markNotificationRead: (id: string, token: string): Promise<{ status: string; is_read: boolean }> => {
    return request<{ status: string; is_read: boolean }>(`/notifications/${id}/read`, token, {
      method: 'POST',
    });
  },

  markAllNotificationsRead: (token: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>('/notifications/read-all', token, {
      method: 'POST',
    });
  },

  getHomepageAchievements: (limit = 10): Promise<AchievementItem[]> => {
    return request<AchievementItem[]>(`/achievements/homepage?limit=${limit}`);
  },

  getMyAchievements: (token: string): Promise<AchievementItem[]> => {
    return request<AchievementItem[]>('/achievements/me', token);
  },
};
