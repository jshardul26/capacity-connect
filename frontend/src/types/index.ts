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

/**
 * CourseCardData: UI structure for course catalog cards.
 * In Phase 5 (Learning Management), this will be populated dynamically from GET /api/v1/courses.
 */
export interface CourseCardData {
  id: string;
  code: string;
  title: string;
  category: 'Radar Meteorology' | 'NWP Modeling' | 'Satellite Remote Sensing' | 'Surface Instrumentation' | 'Disaster Warning';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationHours: number;
  lessonCount: number;
  instructorName: string;
  instructorTitle: string;
  rating: number;
  enrolledCount: number;
  imageUrl: string;
  description: string;
}

/**
 * CompetencyItem: UI structure for skill-gap radar vectors and matrices.
 * In Phase 8 (Competency & AI Matching), this will be populated from GET /api/v1/competency/trainee/{user_id}/matrix.
 */
export interface CompetencyItem {
  id: string;
  name: string;
  domain: string;
  currentProficiency: number; // 0.0 to 1.0
  targetBenchmark: number;    // 0.0 to 1.0
  recommendedCourse: string;
}

export * from './auth';
