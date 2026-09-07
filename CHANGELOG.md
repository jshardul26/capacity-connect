# CHANGELOG — CAPACITY CONNECT
All notable changes and phase milestones for the Capacity Connect project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]
- Phase 5: Learning Management (Course catalog, modules, lessons, video streaming, progress tracking)

---

## [0.5.0] - 2026-09-08
### Added (Phase 4 — Trainer Module Complete)
- **Trainer Database Models & Relationships:**
  - Implemented `TrainerExpertise`, `TrainerLibrary`, `Course`, `CourseModule`, `Lesson`, `Assessment`, and `Question` models in `backend/app/models/trainer.py`.
  - Updated `User` and `TrainerProfile` in `backend/app/models/user.py` with `courses_created`, `assessments_created`, `expertise`, and `library_items` relationships with cascading delete semantics.
  - Dual SQLite WAL & PostgreSQL compatibility maintained across all queries.
- **RESTful Trainer API (`/api/v1/trainer`):**
  - `GET`, `PUT /api/v1/trainer/profile`: Trainer identity, designation, division, years of domain experience, and biography management.
  - `GET`, `POST`, `DELETE /api/v1/trainer/expertise`: Domain expertise and subject specialization CRUD.
  - `GET`, `POST /api/v1/trainer/courses`: Course authoring and curriculum foundation.
  - `GET`, `PUT`, `DELETE /api/v1/trainer/courses/{id}`: Course syllabus, estimated hours, category, level, and publishing status.
  - `POST`, `DELETE /api/v1/trainer/courses/{id}/modules`: Course module management.
  - `POST`, `DELETE /api/v1/trainer/modules/{id}/lessons`: Curriculum lesson creation and duration tracking.
  - `GET`, `POST`, `DELETE /api/v1/trainer/questionnaires`: Assessment and questionnaire builder foundation.
  - `POST`, `DELETE /api/v1/trainer/questionnaires/{id}/questions`: Multiple-choice / true-false question bank creation with JSON options.
  - `GET`, `POST`, `DELETE /api/v1/trainer/library`: Trainer media, lecture slides, presentation, and study material library with SHA-256 cryptographic verification.
  - `POST /api/v1/trainer/resources/upload`: Multipart resource uploader with automated checksum calculation.
  - `GET /api/v1/trainer/dashboard`: Real-time aggregated metrics for authored courses, published curriculum, library items, questions, and participation foundation.
  - `GET /api/v1/trainer/analytics/courses/{id}`: Course enrollment and completion monitoring foundation.
- **Strict RBAC & Data Ownership Protection:**
  - Enforced `require_trainer` and `get_current_approved_user` across all endpoints.
  - Cross-trainer data modification blocked (Trainer B cannot view, modify, or delete Trainer A's courses, library, or questionnaires; returns 404).
  - Trainee access to trainer endpoints blocked with HTTP 403 Forbidden.
- **Frontend Trainer Studio Integration:**
  - `trainerService.ts`: Full typed client service for all trainer endpoints.
  - `TrainerStudioModal.tsx`: Comprehensive 5-tab studio (Dashboard Overview, Course Studio & Curriculum Manager, Questionnaire Builder, Trainer Library, and Profile & Expertise).
  - Integrated into `Navbar.tsx` (desktop and mobile drawer for authenticated trainers) and `DashboardPreviewsSection.tsx` ("Open Trainer Studio").
- **Automated Testing Suite:**
  - Added 8 test cases in `tests/backend/test_trainer.py` validating profile, expertise, courses/modules/lessons, questionnaires/questions, library/upload, dashboard analytics, cross-trainer isolation, and RBAC barriers.
  - Full test suite: 28/28 tests passing.
  - Frontend production build: 0 TypeScript errors.

---

## [0.4.0] - 2026-09-08
### Added (Phase 3 — Trainee Module Complete)
- **Trainee Database Models & Relationships:**
  - Implemented `Qualification`, `WorkExperience`, `Skill`, `Interest`, and `Certificate` models in `backend/app/models/trainee.py` with foreign keys to `trainee_profiles.id` and `users.id`.
  - Added cascade delete relationships in `backend/app/models/user.py` (`TraineeProfile` and `User`).
  - Dual SQLite WAL & PostgreSQL compatibility maintained across all queries.
- **RESTful Trainee API (`/api/v1/trainee`):**
  - `GET /api/v1/trainee/profile`: Fetch current trainee's full profile including child lists.
  - `PUT /api/v1/trainee/profile`: Update bio, designation, department, posting location, and avatar.
  - `GET`, `POST`, `DELETE /api/v1/trainee/qualifications`: Academic degrees and certifications management.
  - `GET`, `POST`, `DELETE /api/v1/trainee/work-experiences`: Operational posting history and responsibilities.
  - `GET`, `POST`, `DELETE /api/v1/trainee/skills`: Technical competencies and proficiency tracking.
  - `GET`, `POST`, `DELETE /api/v1/trainee/interests`: Learning preferences and focus domains.
  - `GET`, `POST`, `DELETE /api/v1/trainee/certificates`: Verified certificate records management.
  - `GET /api/v1/trainee/dashboard`: Dynamic profile completion score calculation (0–100%) and counter summary.
- **Strict Data Ownership & RBAC Isolation:**
  - Trainee endpoints protected with `require_trainee` and `get_current_approved_user`.
  - All mutating and query operations strictly bound to `current_user.id` and `trainee_profile.id`; cross-trainee modification returns HTTP 404.
- **Frontend Trainee Module Integration:**
  - `traineeService.ts`: Typed client service for all trainee profile and sub-entity CRUD operations.
  - `TraineeProfileModal.tsx`: Comprehensive 5-tab modal (Profile Overview & Bio, Qualifications, Work Experience, Skills & Interests, Certificates) with real-time profile completion progress calculation and toast notifications.
  - Integrated with Navbar ("My Profile" button for authenticated trainees) and Dashboard Previews section ("Open Trainee Profile" button).
- **Automated Testing Suite:**
  - Added 8 test cases in `tests/backend/test_trainee.py` validating profile updates, qualifications, work experiences, skills, interests, certificates, completion calculation, and cross-trainee ownership isolation.
  - Full test suite: 20/20 tests passing in Pytest.
  - Frontend production build: 0 TypeScript errors.

---

## [0.3.0] - 2026-09-08
### Added (Phase 2 — Authentication & RBAC Complete)
- **Direct Bcrypt Password Hashing & Jose JWT Security:** Implemented cryptographic credential management in `backend/app/core/security.py` using direct `bcrypt` methods and python-jose for HS256 access and refresh tokens.
- **SQLAlchemy User & Role Persistence:** Created `Role`, `User`, `TraineeProfile`, and `TrainerProfile` ORM models in `backend/app/models/user.py` adhering strictly to canonical database schema specifications.
- **Canonical Database Initialization (`init_db`):** Implemented automated table creation and canonical seeding for system roles (`trainee`, `trainer`, `admin`) and default administrator (`admin.imd@moes.gov.in`).
- **RESTful Authentication API (`/api/v1/auth`):**
  - `POST /api/v1/auth/signup`: User self-registration with default `pending_approval` status.
  - `POST /api/v1/auth/login`: Credential verification, approval check, and dual JWT issuance.
  - `POST /api/v1/auth/refresh`: Access token refresh via valid refresh token.
  - `GET /api/v1/auth/me`: Authenticated profile and role retrieval.
  - `POST /api/v1/auth/logout`: Session termination endpoint.
  - Test endpoints: `/test/trainee`, `/test/trainer`, `/test/admin` for RBAC verification.
- **Administrative Clearance & Governance (`/api/v1/admin`):**
  - `GET /api/v1/admin/users/pending`: Retrieve pending account registration queue.
  - `POST /api/v1/admin/users/{id}/approve`: Approve pending officer registrations.
  - `POST /api/v1/admin/users/{id}/reject`: Reject registration requests.
- **Zustand Frontend State Management & API Services:**
  - `authService.ts`: Full typed client for authentication, profile, refresh, and administrative operations.
  - `useAuthStore.ts`: Central store managing user session, JWT tokens, modal visibility, and localStorage caching.
- **Frontend Auth & Governance UI Components:**
  - `AuthModal.tsx`: Tabbed Sign In / Register dialog with role selection, MoES protocol guidance, and quick evaluation login.
  - `AdminApprovalModal.tsx`: Real-time administrative clearance panel to review, approve, and reject user registrations.
  - `ProtectedRoute.tsx`: Route and view-level RBAC guard.
  - Enhanced `Navbar.tsx` and `TopBar.tsx` with live user badge, role indicator, and sign in/out controls.
  - Integrated interactive role authentication and clearance queue in `DashboardPreviewsSection.tsx`.
- **Comprehensive Backend Testing:**
  - 8 new async test cases in `tests/backend/test_auth.py` covering registration, duplicates, unapproved access barriers, login, token refresh, admin clearance, and role-based endpoint isolation.
  - Verified 12/12 passing tests across full Pytest suite and 0 TypeScript build errors.
### Changed (Frontend Data & Content Audit)
- **Elimination of Unsupported Claims:** Removed arbitrary quantitative platform metrics (`500+ field observatories`, `50+ courses`, `1,200+ trainees`, `150+ trainers`) and aligned copy with canonical blueprint phrasing.
- **Dynamic Pending UI States (`—`):** Converted unsupported platform counters in `StatsSection` and `DashboardPreviewsSection` to clean pending states (`—`) with labels indicating future phase backend integration.
- **Explicit Demo/Preview Tagging:** Added unambiguous prototype labels to `CoursesSection` (`Sample Catalog Preview`, `Sample: 4.9★`), `CompetencyAISection` (`Interactive Model Preview`, `Simulated Benchmark Role`), and persona dashboards (`[Demo Workspace Preview]`).
- **Comprehensive Audit Report:** Published `docs/DATA_CONTENT_AUDIT.md` classifying 34 user-visible elements into 5 canonical categories and mapping future REST API endpoints.

---

## [0.2.1] - 2026-09-08
### Added (Frontend UI/UX Redesign)
- **Original Capacity Connect Visual Identity:** Complete editorial and atmospheric overhaul inspired by modern institutional education platforms while maintaining dedicated MoES / IMD focus.
- **Institutional TopBar & Sticky Navigation:** Added operational weather desk status, station telemetry identifier (`IMD-HQ-DELHI`), engine mode badge, and sticky navbar with mobile drawer navigation.
- **Atmospheric Hero & Feature Matrix:** Large hero composition with deep atmospheric gradient overlay, dual CTAs, and 4 floating feature cards (`Structured Curriculum`, `Verified Instructors`, `Offline Assessments`, `Competency AI`).
- **Editorial Observatory Narrative:** Mission showcase highlighting remote weather stations, high-altitude observatories, and radar telemetry operations.
- **Target Capacity Benchmarks:** Ocean-teal metric band highlighting operational training targets, clearly labeled as prototype preview benchmarks.
- **Interactive Course Directory:** Subject category filter pills (`Radar Meteorology`, `NWP Modeling`, `Satellite Remote Sensing`, `Surface Instrumentation`, `Disaster Warning`), responsive course cards with metadata, syllabus modal, and enrollment triggers.
- **5-Stage Capacity Pipeline:** Visual roadmap detailing `Discover → Learn → Practice → Assess → Certify & Grow`.
- **Competency AI Matrix:** Interactive skill-gap analysis matrix with dynamic role tracks (Radar, NWP, Cyclone) and transparent recommendation rationale preview.
- **Offline & Edge Ecosystem Showcase:** Visual overview of Capacity Connect OS, Live USB persistence, Micro-LAN mode, and 2-way delta sync.
- **Dashboard Workspace Previews:** Interactive tabbed switcher for Trainee Workspace, Trainer Studio, and Admin Command Center.
- **Institutional Footer:** 4-column footer with curriculum links, offline support, SIH 26075 tag, and operational node status.
- **Live Health Probe:** Integrated live backend probe component verifying `/api/v1/health` and `/api/v1/health/db` connectivity directly from the interface.

---

## [0.2.0] - 2026-09-08
### Added (Phase 1 — Project Foundation Complete)
- **Docker Compose Setup:** Created `docker-compose.yml` (production: PostgreSQL 16, MinIO, Backend, Frontend, Nginx reverse proxy) and `docker-compose.dev.yml` for local backing services.
- **FastAPI Backend Scaffolding:** Modular architecture with `app/core/config.py`, `app/core/database.py` (SQLAlchemy 2.0 async engine with dual-dialect PostgreSQL/SQLite support), `app/core/security.py`, `app/api/api_v1.py`, and Alembic migration framework (`alembic.ini`, `alembic/env.py`).
- **Health Check Endpoints:** Implemented `GET /api/v1/health` (app status & mode), `GET /api/v1/health/db` (active DB ping & latency), and `GET /api/v1/health/full` (aggregated system status).
- **React + Vite + Tailwind Frontend:** Initialized React 18, TypeScript, Tailwind CSS with MoES/IMD branding, responsive Header, Footer, and live interactive `HealthCheck` connectivity tester.
- **Database Initializations:** Created `database/central_postgres.sql` and `database/local_sqlite.sql` with full canonical tables and meteorological seed competencies.
- **Environment & Documentation:** Standardized `.env.example`, `backend/.env.example`, `frontend/.env.example`, and comprehensive `docs/development_guide.md`.
- **Automated Testing:** Implemented Pytest async test suite in `tests/backend/test_health.py` (4/4 passed) and verified clean frontend TypeScript production build (`npm run build`).
### Added (Phase 0 — Blueprint & Architecture Complete)
- **Master Project Blueprint (`PROJECT_BLUEPRINT.md`):** Complete 30-section frozen master technical specification covering MoES/IMD SIH problem statement 26075, requirements, modular monolith architecture, offline-first ecosystem, Capacity Connect OS, bootable USB, LAN learning server, scikit-learn competency engine, dual database design, API design, security, testing, and deployment roadmap.
- **System Architecture (`ARCHITECTURE.md`):** Comprehensive topology diagrams, data flows, offline attempt HMAC tamper-proofing, two-way sync protocol with delta push/pull and conflict resolution rules, LAN classroom mode, and bootable USB partition architecture.
- **Database Schema (`DATABASE_SCHEMA.md`):** Complete production-grade PostgreSQL 16 DDL with indexes, foreign keys, check constraints, and corresponding offline SQLite schema, plus initial canonical seed data for roles and meteorological competencies.
- **API Contract (`API_CONTRACT.md`):** OpenAPI 3.1 aligned REST API endpoint specifications for Auth, Trainee, Trainer, Courses, Assessments, Competency/AI, Admin, Content Packs, and Synchronization.
- **Canonical Naming Conventions (`NAMING_CONVENTIONS.md`):** Universal vocabulary dictionary and casing rules across database tables, backend models, API routes, and frontend types.
- **Development Status Registry (`DEVELOPMENT_STATUS.md`):** Phase registry tracking Phase 0 to Phase 14 with multi-AI continuity instructions.
- **Project Scope Freeze:** Formal requirements freeze locking the architectural baseline.
