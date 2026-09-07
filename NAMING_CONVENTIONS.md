# CAPACITY CONNECT — CANONICAL NAMING CONVENTIONS
## Universal Dictionary and Style Standards
**Document Status:** FROZEN | **Version:** 1.0.0

---

## 1. CASING & SYNTAX STANDARDS

To eliminate naming drift across languages and environments, the following rules are strictly enforced:

| Context | Case Standard | Example |
|---|---|---|
| **PostgreSQL / SQLite Tables** | Plural `snake_case` | `assessment_attempts`, `course_modules` |
| **Database Columns** | Singular `snake_case` | `passing_score`, `created_at` |
| **Python Classes (FastAPI, SQLAlchemy)** | `PascalCase` | `AssessmentAttempt`, `LearningResource` |
| **Python Functions & Variables** | `snake_case` | `calculate_skill_gap()`, `sync_daemon` |
| **REST API URIs** | Plural `kebab-case` | `/api/v1/work-experiences`, `/learning-resources` |
| **JSON Request/Response Keys** | `snake_case` (matching Pydantic) | `{"score_obtained": 86.5, "is_passed": true}` |
| **TypeScript Types & Interfaces** | `PascalCase` | `interface AssessmentAttempt`, `type UserRole` |
| **TypeScript Variables & Functions** | `camelCase` | `isSubmitting`, `fetchCourseProgress()` |
| **Zustand State Stores** | `camelCase` prefixed with `use` | `useAuthStore`, `useSyncStore` |
| **Systemd Services** | `kebab-case` prefixed with `cc-` | `capacity-connect-backend.service` |
| **Content Pack Extension** | Lowercase | `.ccpack` |

---

## 2. CANONICAL VOCABULARY DICTIONARY

| Entity / Concept | Database Table | Python Model | API Path | TypeScript Type |
|---|---|---|---|---|
| User Account | `users` | `User` | `/users` | `User` |
| System Role | `roles` | `Role` | `/roles` | `Role` |
| Trainee Profile | `trainee_profiles` | `TraineeProfile` | `/trainee/profile` | `TraineeProfile` |
| Academic Qualification | `qualifications` | `Qualification` | `/qualifications` | `Qualification` |
| Work Experience | `work_experiences` | `WorkExperience` | `/work-experiences`| `WorkExperience` |
| Skill | `skills` | `Skill` | `/skills` | `Skill` |
| Area of Interest | `interests` | `Interest` | `/interests` | `Interest` |
| Certificate | `certificates` | `Certificate` | `/certificates` | `Certificate` |
| Trainer Profile | `trainer_profiles` | `TrainerProfile` | `/trainer/profile` | `TrainerProfile` |
| Trainer Expertise Area | `trainer_expertise`| `TrainerExpertise`| `/trainer/expertise`| `TrainerExpertise` |
| Trainer Content Library | `trainer_library` | `TrainerLibrary` | `/trainer/library` | `TrainerLibrary` |
| Course | `courses` | `Course` | `/courses` | `Course` |
| Course Module | `course_modules` | `CourseModule` | `/modules` | `CourseModule` |
| Lesson | `lessons` | `Lesson` | `/lessons` | `Lesson` |
| Learning Resource | `learning_resources`| `LearningResource`| `/resources` | `LearningResource` |
| Course Enrollment | `course_enrollments`| `CourseEnrollment`| `/enroll` | `CourseEnrollment` |
| Lesson Progress | `progress` | `Progress` | `/progress` | `Progress` |
| Assessment | `assessments` | `Assessment` | `/assessments` | `Assessment` |
| Question | `questions` | `Question` | `/questions` | `Question` |
| Assessment Attempt | `assessment_attempts`| `AssessmentAttempt`| `/attempts` | `AssessmentAttempt` |
| Assessment Answer | `assessment_answers`| `AssessmentAnswer` | `/answers` | `AssessmentAnswer` |
| Domain Competency | `competencies` | `Competency` | `/competency` | `Competency` |
| Trainee Competency Score | `trainee_competencies`| `TraineeCompetency`| `/trainee-competencies`| `TraineeCompetency` |
| Course Competency Yield | `course_competencies`| `CourseCompetency`| `/course-competencies`| `CourseCompetency` |
| Notification | `notifications` | `Notification` | `/notifications` | `Notification` |
| Announcement | `announcements` | `Announcement` | `/announcements` | `Announcement` |
| Achievement Recognition | `achievements` | `Achievement` | `/achievements` | `Achievement` |
| Course Feedback | `course_feedback` | `CourseFeedback` | `/feedback` | `CourseFeedback` |
| Synchronization Queue | `sync_queue` | `SyncQueue` | `/sync/queue` | `SyncQueueItem` |
| Sync Audit Log | `sync_audit_log` | `SyncAuditLog` | `/sync/audit-logs`| `SyncAuditLog` |
| Offline Content Pack | `content_packs` | `ContentPack` | `/packs` | `ContentPack` |

---

## 3. STATUS & ENUM VALUES

- **User Account Status:** `pending_approval`, `approved`, `rejected`, `suspended`
- **User Roles:** `trainee`, `trainer`, `admin`
- **Course Level:** `beginner`, `intermediate`, `advanced`, `all_levels`
- **Resource Types:** `video`, `presentation`, `study_material`, `dataset`, `code`
- **Assessment Status:** `in_progress`, `completed`, `timed_out`
- **Proficiency Levels:** `beginner`, `intermediate`, `advanced`, `expert`
- **Sync Event Actions:** `CREATE`, `UPDATE`, `DELETE`
- **Sync Item Status:** `pending`, `processing`, `synced`, `failed`
- **Sync Network Status:** `online`, `offline`, `syncing`, `synced`, `error`
