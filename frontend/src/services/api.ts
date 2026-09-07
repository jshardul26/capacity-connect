import { HealthResponse, DatabaseHealthResponse, SystemHealthReport } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        errorDetail = errorJson.detail;
      }
    } catch {
      // Non-JSON error payload
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const healthService = {
  getAppHealth: (): Promise<HealthResponse> => apiFetch<HealthResponse>('/health'),
  getDbHealth: (): Promise<DatabaseHealthResponse> => apiFetch<DatabaseHealthResponse>('/health/db'),
  getFullHealth: (): Promise<SystemHealthReport> => apiFetch<SystemHealthReport>('/health/full'),
};
