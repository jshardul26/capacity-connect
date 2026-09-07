# CAPACITY CONNECT — API CONTRACT SPECIFICATION
## Canonical REST API Specification (OpenAPI 3.1 Aligned)
**Document Status:** FROZEN | **Version:** 1.0.0

---

## 1. GLOBAL CONVENTIONS

- **Base URL:** `/api/v1`
- **Payload Format:** JSON (`Content-Type: application/json; charset=utf-8`)
- **Authentication:** HTTP Bearer Token (`Authorization: Bearer <jwt_access_token>`)
- **Standard Error Response:**
```json
{
  "detail": "Error description message",
  "error_code": "RESOURCE_NOT_FOUND",
  "field_errors": [
    {"field": "email", "message": "Invalid email address format"}
  ]
}
```

---

## 2. AUTHENTICATION & SESSION ENDPOINTS

### 2.1 POST /api/v1/auth/signup
- **Access:** Public
- **Request Body:**
```json
{
  "email": "scientist.singh@imd.gov.in",
  "password": "SecurePassword@123",
  "full_name": "Dr. Rajesh Singh",
  "phone_number": "+919876543210",
  "station_code": "IMD-PUN",
  "organization": "India Meteorological Department (IMD)",
  "role": "trainee"
}
```
- **Response 201 Created:**
```json
{
  "id": "u0000000-0000-0000-0000-000000000001",
  "email": "scientist.singh@imd.gov.in",
  "full_name": "Dr. Rajesh Singh",
  "role": "trainee",
  "status": "pending_approval",
  "message": "Account created successfully. Awaiting administrative approval."
}
```

### 2.2 POST /api/v1/auth/login
- **Access:** Public
- **Request Body:**
```json
{
  "email": "scientist.singh@imd.gov.in",
  "password": "SecurePassword@123"
}
```
- **Response 200 OK:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "def50200...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "u0000000-0000-0000-0000-000000000001",
    "email": "scientist.singh@imd.gov.in",
    "full_name": "Dr. Rajesh Singh",
    "role": "trainee",
    "status": "approved"
  }
}
```

### 2.3 POST /api/v1/auth/refresh
- **Access:** Public (Requires valid refresh token)
- **Request Body:** `{"refresh_token": "def50200..."}`
- **Response 200 OK:** `{"access_token": "eyJhb...", "token_type": "bearer", "expires_in": 3600}`

### 2.4 GET /api/v1/auth/me
- **Access:** Authenticated (Any Role)
- **Response 200 OK:** Returns active user profile, assigned role, and permissions.

---

## 3. TRAINEE MODULE ENDPOINTS

### 3.1 GET & PUT /api/v1/trainee/profile
- **Access:** Trainee
- **PUT Request Body:**
```json
{
  "designation": "Meteorologist Gr-II",
  "department": "Radar Meteorology Division",
  "posting_location": "DWR Station, Kochi",
  "bio": "Specializing in coastal Doppler radar maintenance and radar reflectivity calibration."
}
```

### 3.2 POST /api/v1/trainee/qualifications
- **Access:** Trainee
- **Request Body:**
```json
{
  "degree": "M.Sc.",
  "field_of_study": "Atmospheric Sciences",
  "institution": "Cochin University of Science and Technology (CUSAT)",
  "passing_year": 2022,
  "grade_or_percentage": "8.8 CGPA"
}
```

### 3.3 POST /api/v1/trainee/work-experiences
- **Access:** Trainee
- **Request Body:**
```json
{
  "organization": "IMD Pune",
  "designation": "Scientific Assistant",
  "start_date": "2022-07-01",
  "end_date": "2024-06-30",
  "is_current": false,
  "responsibilities": "Upper-air sounding data collation and radiosonde launch protocols."
}
```

### 3.4 POST /api/v1/trainee/skills
- **Access:** Trainee
- **Request Body:**
```json
{
  "name": "Doppler Radar Interpretation",
  "proficiency_level": "intermediate"
}
```

### 3.5 POST /api/v1/trainee/interests
- **Access:** Trainee
- **Request Body:** `{"name": "Tropical Cyclogenesis & Storm Surge Modeling"}`

### 3.6 GET & POST /api/v1/trainee/certificates
- **Access:** Trainee
- **POST Request:** Multipart form data (`file`, `title`, `issuing_organization`, `issue_date`).

---

## 4. TRAINER MODULE ENDPOINTS

### 4.1 GET & PUT /api/v1/trainer/profile
- **Access:** Trainer
- **PUT Request Body:**
```json
{
  "designation": "Scientist-F",
  "division": "Numerical Weather Prediction Division",
  "years_of_experience": 14.5,
  "biography": "Head of Regional NWP Modeling, experienced in high-resolution WRF data assimilation."
}
```

### 4.2 POST /api/v1/trainer/expertise
- **Access:** Trainer
- **Request Body:**
```json
{
  "subject": "WRF High-Resolution Modeling",
  "proficiency_level": "expert",
  "years_in_subject": 10.0
}
```

### 4.3 POST /api/v1/trainer/courses
- **Access:** Trainer / Admin
- **Request Body:**
```json
{
  "code": "MET-401",
  "title": "Advanced Doppler Weather Radar & Quantitative Precipitation Estimation",
  "description": "Comprehensive capacity building course on S-band and X-band radar operation, clutter removal algorithms, and QPE processing.",
  "category": "Instrumentation",
  "level": "intermediate",
  "estimated_hours": 12.5,
  "competency_ids": ["c0000000-0000-0000-0000-000000000001"]
}
```

### 4.4 POST /api/v1/trainer/courses/{course_id}/modules
- **Access:** Trainer (Course Owner)
- **Request Body:** `{"title": "Module 1: Radar Signal Processing", "order_index": 1}`

### 4.5 POST /api/v1/trainer/modules/{module_id}/lessons
- **Access:** Trainer (Course Owner)
- **Request Body:** `{"title": "Lesson 1.1: Pulse Compression & Nyquist Velocity", "duration_minutes": 45, "order_index": 1}`

### 4.6 POST /api/v1/trainer/resources/upload
- **Access:** Trainer
- **Multipart Form:** `file`, `title`, `resource_type` (`video`|`presentation`|`study_material`), `lesson_id`, `course_id`.

### 4.7 GET /api/v1/trainer/library
- **Access:** Trainer
- **Response 200 OK:** Returns uploaded files, checksums, and publishing status.

### 4.8 GET /api/v1/trainer/analytics/courses/{course_id}
- **Access:** Trainer (Course Owner)
- **Response 200 OK:** Returns enrolled trainees, completion percentages, quiz score distributions.

---

## 5. COURSES & LEARNING DELIVERY ENDPOINTS

### 5.1 GET /api/v1/courses
- **Access:** Public / Authenticated
- **Query Params:** `category`, `level`, `search`, `page`, `limit`
- **Response 200 OK:** List of published course summary cards.

### 5.2 GET /api/v1/courses/{course_id}
- **Access:** Authenticated
- **Response 200 OK:** Complete course structure: modules, lessons, downloadable resources, syllabus.

### 5.3 POST /api/v1/courses/{course_id}/enroll
- **Access:** Trainee
- **Response 200 OK:** `{"status": "enrolled", "course_id": "...", "enrolled_at": "2026-09-08T..."}`

### 5.4 POST /api/v1/courses/{course_id}/progress
- **Access:** Trainee
- **Request Body:**
```json
{
  "lesson_id": "l0000000-0000-0000-0000-000000000001",
  "watch_time_seconds": 1840,
  "is_completed": true
}
```

### 5.5 POST /api/v1/courses/{course_id}/feedback
- **Access:** Trainee
- **Request Body:** `{"rating": 5, "feedback_text": "Excellent depth on Doppler velocity folding resolution."}`

---

## 6. ASSESSMENT SYSTEM ENDPOINTS

### 6.1 POST /api/v1/assessments
- **Access:** Trainer / Admin
- **Request Body:**
```json
{
  "course_id": "c0000000-0000-0000-0000-000000000010",
  "title": "DWR Certification Assessment: Doppler Velocity & QPE",
  "subject": "Radar Meteorology",
  "duration_minutes": 30,
  "passing_score": 70.0,
  "total_marks": 100.0,
  "deadline": "2026-10-15T23:59:59Z"
}
```

### 6.2 POST /api/v1/assessments/{assessment_id}/questions
- **Access:** Trainer (Assessment Owner)
- **Request Body:**
```json
{
  "question_text": "What is the primary effect of increasing the Pulse Repetition Frequency (PRF) in a Doppler Radar?",
  "question_type": "mcq",
  "options_json": [
    {"id": "A", "text": "Increases maximum unambiguous velocity and decreases maximum unambiguous range"},
    {"id": "B", "text": "Increases maximum unambiguous range and decreases maximum unambiguous velocity"},
    {"id": "C", "text": "Increases both maximum unambiguous velocity and range"},
    {"id": "D", "text": "Has no effect on velocity or range"}
  ],
  "correct_option": "A",
  "explanation": "According to the Doppler dilemma: V_max * R_max = c * lambda / 8. Increasing PRF elevates V_max at the expense of R_max.",
  "marks": 2.0,
  "order_index": 1
}
```

### 6.3 POST /api/v1/assessments/{assessment_id}/start
- **Access:** Trainee
- **Response 200 OK:** Returns questions (without `correct_option` or `explanation`), initializes server attempt session.

### 6.4 POST /api/v1/assessments/{assessment_id}/submit
- **Access:** Trainee
- **Request Body:**
```json
{
  "attempt_id": "a0000000-0000-0000-0000-000000000001",
  "answers": [
    {"question_id": "q0000000-0000-0000-0000-000000000001", "selected_option": "A"},
    {"question_id": "q0000000-0000-0000-0000-000000000002", "selected_option": "B"}
  ]
}
```
- **Response 200 OK:**
```json
{
  "attempt_id": "a0000000-0000-0000-0000-000000000001",
  "score_obtained": 86.5,
  "total_marks": 100.0,
  "is_passed": true,
  "attempt_status": "completed",
  "attempt_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

## 7. COMPETENCY & AI ENDPOINTS

### 7.1 GET /api/v1/competency/taxonomy
- **Access:** Authenticated
- **Response 200 OK:** List of all domain competencies and descriptions.

### 7.2 GET /api/v1/competency/trainee/{user_id}/matrix
- **Access:** Trainee (Own Profile) / Trainer / Admin
- **Response 200 OK:** Current competency vector for radar charts:
```json
{
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "competencies": [
    {"name": "Doppler Weather Radar Operation", "level": 0.85},
    {"name": "NWP Modeling", "level": 0.40},
    {"name": "Satellite Meteorology", "level": 0.70},
    {"name": "Tropical Cyclone Tracking", "level": 0.90}
  ]
}
```

### 7.3 GET /api/v1/competency/gaps
- **Access:** Trainee / Admin
- **Query Params:** `target_role=Senior_Radar_Meteorologist`
- **Response 200 OK:**
```json
{
  "target_role": "Senior_Radar_Meteorologist",
  "overall_readiness_percentage": 72.4,
  "gaps": [
    {"competency": "NWP Modeling", "required": 0.80, "current": 0.40, "gap": 0.40},
    {"competency": "Automatic Weather Station Maintenance", "required": 0.75, "current": 0.50, "gap": 0.25}
  ]
}
```

### 7.4 GET /api/v1/competency/recommendations/courses
- **Access:** Trainee
- **Response 200 OK:** Ranked course recommendations with explainable match scores:
```json
[
  {
    "course_id": "c0000000-0000-0000-0000-000000000002",
    "title": "Operational NWP for Radar Meteorologists",
    "match_score": 0.94,
    "rationale": "Directly addresses your primary skill gap in NWP Modeling (gap: 0.40)."
  }
]
```

### 7.5 POST /api/v1/competency/match-trainer
- **Access:** Admin
- **Request Body:** `{"subject": "Doppler Radar Dual-Polarization", "minimum_experience_years": 8}`
- **Response 200 OK:** Ranked list of recommended trainers with score breakdowns.

---

## 8. ADMIN MANAGEMENT ENDPOINTS

### 8.1 GET /api/v1/admin/users/pending
- **Access:** Admin
- **Response 200 OK:** List of newly registered users awaiting approval.

### 8.2 POST /api/v1/admin/users/{user_id}/approve
- **Access:** Admin
- **Response 200 OK:** `{"status": "approved", "user_id": "..."}`

### 8.3 POST /api/v1/admin/users/{user_id}/reject
- **Access:** Admin
- **Response 200 OK:** `{"status": "rejected", "user_id": "..."}`

### 8.4 PUT /api/v1/admin/users/{user_id}/role
- **Access:** Admin
- **Request Body:** `{"role": "trainer"}`

### 8.5 POST /api/v1/admin/announcements
- **Access:** Admin
- **Request Body:** `{"title": "National Cyclone Awareness Workshop 2026", "content": "...", "is_featured_on_homepage": true}`

### 8.6 GET /api/v1/admin/sync/audit-logs
- **Access:** Admin
- **Response 200 OK:** List of sync audit records from distributed stations.

---

## 9. SYNCHRONIZATION & CONTENT PACK ENDPOINTS

### 9.1 POST /api/v1/sync/push
- **Access:** Authenticated Station Node / Trainee
- **Request Body:**
```json
{
  "device_id": "IMD-NODE-KOCHI-01",
  "batch_timestamp": "2026-09-08T00:00:00Z",
  "events": [
    {
      "event_id": "e0000000-0000-0000-0000-000000000001",
      "entity_type": "assessment_attempt",
      "action": "CREATE",
      "payload": {
        "assessment_id": "a0000000-0000-0000-0000-000000000010",
        "user_id": "u0000000-0000-0000-0000-000000000001",
        "score_obtained": 86.5,
        "is_passed": true,
        "attempt_signature": "e3b0c442..."
      }
    }
  ]
}
```
- **Response 200 OK:**
```json
{
  "status": "success",
  "accepted_event_ids": ["e0000000-0000-0000-0000-000000000001"],
  "failed_event_ids": []
}
```

### 9.2 GET /api/v1/sync/pull
- **Access:** Authenticated Station Node
- **Query Params:** `device_id`, `since_timestamp`
- **Response 200 OK:**
```json
{
  "timestamp": "2026-09-08T00:01:00Z",
  "courses": [...],
  "assessments": [...],
  "announcements": [...]
}
```

### 9.3 POST /api/v1/packs/export
- **Access:** Admin / Trainer
- **Request Body:** `{"course_ids": ["c0000000-0000-0000-0000-000000000010"], "package_title": "DWR_Field_Course_v1"}`
- **Response 200 OK:** Generates and returns download URL for `.ccpack`.

### 9.4 POST /api/v1/packs/import
- **Access:** Local Station Node Admin
- **Multipart Form:** `package_file` (`.ccpack`)
- **Response 200 OK:** Unpacks and registers courses, videos, and questions locally.
