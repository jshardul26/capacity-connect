-- CAPACITY CONNECT: Central PostgreSQL Schema & Initial Data
-- Version: 1.0.0
-- Database: PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    station_code VARCHAR(50),
    organization VARCHAR(255) DEFAULT 'India Meteorological Department (IMD)',
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_station_code ON users(station_code);

-- 3. Trainee Profiles & Child Tables
CREATE TABLE IF NOT EXISTS trainee_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(100),
    department VARCHAR(100),
    posting_location VARCHAR(150),
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    degree VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(150) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    passing_year INTEGER NOT NULL,
    grade_or_percentage VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    responsibilities TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(150),
    certificate_url VARCHAR(500),
    is_system_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Trainer Profiles & Expertise
CREATE TABLE IF NOT EXISTS trainer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(100),
    division VARCHAR(100),
    years_of_experience NUMERIC(4,1) DEFAULT 0.0,
    biography TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainer_expertise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_profile_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'expert' CHECK (proficiency_level IN ('intermediate', 'advanced', 'expert')),
    years_in_subject NUMERIC(4,1) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainer_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_profile_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) CHECK (resource_type IN ('video', 'presentation', 'study_material', 'dataset', 'code')),
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    is_public_to_trainees BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Courses, Modules, Lessons, Resources, Enrollments, Progress
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    level VARCHAR(50) DEFAULT 'all_levels' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    thumbnail_url VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    estimated_hours NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);

CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_text TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('video', 'presentation', 'study_material')),
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'dropped')),
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    watch_time_seconds INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- 6. Assessments, Questions, Attempts, Answers
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    passing_score NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    total_marks NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    deadline TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false')),
    options_json JSONB NOT NULL,
    correct_option VARCHAR(10) NOT NULL,
    explanation TEXT,
    marks NUMERIC(4,2) DEFAULT 1.0,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    score_obtained NUMERIC(5,2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT FALSE,
    attempt_status VARCHAR(50) DEFAULT 'completed' CHECK (attempt_status IN ('in_progress', 'completed', 'timed_out')),
    attempt_signature VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);

CREATE TABLE IF NOT EXISTS assessment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10),
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded NUMERIC(4,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Competencies
CREATE TABLE IF NOT EXISTS competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    domain VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainee_competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    proficiency_level NUMERIC(3,2) DEFAULT 0.00 CHECK (proficiency_level BETWEEN 0.00 AND 1.00),
    last_evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, competency_id)
);

CREATE TABLE IF NOT EXISTS course_competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    yield_level NUMERIC(3,2) DEFAULT 0.50 CHECK (yield_level BETWEEN 0.00 AND 1.00),
    UNIQUE(course_id, competency_id)
);

-- 8. Bulletins, Announcements, Achievements, Feedback
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    published_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_featured_on_homepage BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    badge_icon_url VARCHAR(500),
    awarded_date DATE DEFAULT CURRENT_DATE,
    is_displayed_on_homepage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- 9. Synchronization & Content Packs
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sync_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    sync_direction VARCHAR(20) CHECK (sync_direction IN ('push', 'pull')),
    records_processed INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    package_file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    manifest_json JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Canonical Seed Roles
INSERT INTO roles (id, name, description) VALUES 
(1, 'trainee', 'Trainee learner role'),
(2, 'trainer', 'Trainer and domain instructor role'),
(3, 'admin', 'System administrator role')
ON CONFLICT (id) DO NOTHING;

-- 11. Core Meteorological Competencies Seed
INSERT INTO competencies (id, name, domain, description) VALUES 
('c0000000-0000-0000-0000-000000000001', 'Doppler Weather Radar (DWR) Operation', 'Instrumentation', 'Operation, maintenance, and data interpretation from Doppler weather radars'),
('c0000000-0000-0000-0000-000000000002', 'Numerical Weather Prediction (NWP) Modeling', 'Forecasting', 'Running WRF, GFS, and regional high-resolution atmospheric prediction models'),
('c0000000-0000-0000-0000-000000000003', 'Satellite Meteorology & INSAT Imagery', 'Remote Sensing', 'Analysis of infrared, visible, and water vapor imagery from INSAT-3D/3DR satellites'),
('c0000000-0000-0000-0000-000000000004', 'Tropical Cyclone Tracking & Warning', 'Disaster Warning', 'Dvorak intensity estimation, storm surge forecasting, and warning bulletin generation'),
('c0000000-0000-0000-0000-000000000005', 'Automatic Weather Station (AWS) Maintenance', 'Surface Instrumentation', 'Calibration and sensor maintenance of surface pressure, temperature, and anemometer sensors'),
('c0000000-0000-0000-0000-000000000006', 'Agrometeorological Advisory Services', 'Applied Meteorology', 'Preparation of district-level agromet bulletins for farmers and rural advisory')
ON CONFLICT (id) DO NOTHING;
