-- CAPACITY CONNECT: Local SQLite Schema & Initial Data
-- Version: 1.0.0
-- Database: SQLite 3.45+ (WAL Mode)

PRAGMA foreign_keys = ON;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Users (Cached accounts for offline authentication)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    station_code TEXT,
    organization TEXT DEFAULT 'India Meteorological Department (IMD)',
    role_id INTEGER NOT NULL REFERENCES roles(id),
    status TEXT DEFAULT 'pending_approval',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 3. Trainee Profiles & Child Tables
CREATE TABLE IF NOT EXISTS trainee_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation TEXT,
    department TEXT,
    posting_location TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qualifications (
    id TEXT PRIMARY KEY,
    trainee_profile_id TEXT NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    degree TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    institution TEXT NOT NULL,
    passing_year INTEGER NOT NULL,
    grade_or_percentage TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS work_experiences (
    id TEXT PRIMARY KEY,
    trainee_profile_id TEXT NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    designation TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current INTEGER DEFAULT 0,
    responsibilities TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    trainee_profile_id TEXT NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'beginner',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interests (
    id TEXT PRIMARY KEY,
    trainee_profile_id TEXT NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiry_date TEXT,
    credential_id TEXT,
    certificate_url TEXT,
    is_system_generated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Trainer Profiles & Expertise
CREATE TABLE IF NOT EXISTS trainer_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation TEXT,
    division TEXT,
    years_of_experience REAL DEFAULT 0.0,
    is_available_for_assignment INTEGER NOT NULL DEFAULT 0,
    biography TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_expertise (
    id TEXT PRIMARY KEY,
    trainer_profile_id TEXT NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'expert',
    years_in_subject REAL DEFAULT 0.0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_library (
    id TEXT PRIMARY KEY,
    trainer_profile_id TEXT NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    is_public_to_trainees INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Courses, Modules, Lessons, Resources, Enrollments, Progress
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    trainer_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT DEFAULT 'all_levels',
    thumbnail_url TEXT,
    is_published INTEGER DEFAULT 0,
    estimated_hours REAL DEFAULT 0.0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS course_modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_text TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    duration_minutes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    resource_type TEXT,
    file_url TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    status TEXT DEFAULT 'in_progress',
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed INTEGER DEFAULT 0,
    watch_time_seconds INTEGER DEFAULT 0,
    last_accessed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, lesson_id)
);

-- 6. Assessments, Questions, Attempts, Answers
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    passing_score REAL NOT NULL DEFAULT 60.00,
    total_marks REAL NOT NULL DEFAULT 100.00,
    deadline TEXT,
    is_published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'mcq',
    options_json TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    marks REAL DEFAULT 1.0,
    order_index INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TEXT NOT NULL,
    end_time TEXT,
    score_obtained REAL DEFAULT 0.00,
    is_passed INTEGER DEFAULT 0,
    attempt_status TEXT DEFAULT 'completed',
    attempt_signature TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessment_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option TEXT,
    is_correct INTEGER DEFAULT 0,
    marks_awarded REAL DEFAULT 0.00,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 7. Competencies
CREATE TABLE IF NOT EXISTS competencies (
    id TEXT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    domain VARCHAR(100) NOT NULL,
    description TEXT,
    criticality_weight REAL NOT NULL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainee_competencies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    proficiency_level REAL DEFAULT 0.00,
    last_evaluated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, competency_id)
);

CREATE TABLE IF NOT EXISTS course_competencies (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    yield_level REAL DEFAULT 0.50,
    UNIQUE(course_id, competency_id)
);

-- 8. Bulletins, Announcements, Achievements, Feedback
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    published_by TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_featured_on_homepage INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    badge_icon_url TEXT,
    awarded_date TEXT DEFAULT (date('now')),
    is_displayed_on_homepage INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS course_feedback (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER,
    feedback_text TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(course_id, user_id)
);

-- 9. Synchronization & Content Packs
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    synced_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_audit_log (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id),
    sync_direction TEXT,
    records_processed INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_packs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    package_file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- 10. Canonical Seed Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES 
(1, 'trainee', 'Trainee learner role'),
(2, 'trainer', 'Trainer and domain instructor role'),
(3, 'admin', 'System administrator role');

-- 11. Core Meteorological Competencies Seed
INSERT OR IGNORE INTO competencies (id, name, domain, description) VALUES 
('c0000000-0000-0000-0000-000000000001', 'Doppler Weather Radar (DWR) Operation', 'Instrumentation', 'Operation, maintenance, and data interpretation from Doppler weather radars'),
('c0000000-0000-0000-0000-000000000002', 'Numerical Weather Prediction (NWP) Modeling', 'Forecasting', 'Running WRF, GFS, and regional high-resolution atmospheric prediction models'),
('c0000000-0000-0000-0000-000000000003', 'Satellite Meteorology & INSAT Imagery', 'Remote Sensing', 'Analysis of infrared, visible, and water vapor imagery from INSAT-3D/3DR satellites'),
('c0000000-0000-0000-0000-000000000004', 'Tropical Cyclone Tracking & Warning', 'Disaster Warning', 'Dvorak intensity estimation, storm surge forecasting, and warning bulletin generation'),
('c0000000-0000-0000-0000-000000000005', 'Automatic Weather Station (AWS) Maintenance', 'Surface Instrumentation', 'Calibration and sensor maintenance of surface pressure, temperature, and anemometer sensors'),
('c0000000-0000-0000-0000-000000000006', 'Agrometeorological Advisory Services', 'Applied Meteorology', 'Preparation of district-level agromet bulletins for farmers and rural advisory');
