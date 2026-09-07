export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  app_mode: string;
  environment: string;
  timestamp: string;
  station_code: string;
}

export interface DatabaseHealthResponse {
  status: string;
  dialect: string;
  latency_ms: number;
  database_url_type: string;
  error?: string | null;
  timestamp: string;
}

export interface SystemHealthReport {
  status: string;
  timestamp: string;
  application: {
    name: string;
    version: string;
    mode: string;
    environment: string;
    station_code: string;
  };
  database: DatabaseHealthResponse;
}
