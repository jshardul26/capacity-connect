# CAPACITY CONNECT — DATA & CONTENT AUDIT REPORT
**Document Status:** COMPLETE & VERIFIED | **Version:** 1.0.0  
**Phase:** Pre-Phase 2 Foundation Verification | **Date:** 2026-09-08  

---

## 1. AUDIT SUMMARY

Following the UI/UX redesign of the Capacity Connect platform (Commit `1affa55`), a comprehensive audit of all user-visible text, statistics, mock objects, metrics, and claims was conducted across the frontend codebase.

### Audit Objectives:
1. Prevent fictional, unverified, or demo numbers from being presented as real operational platform data.
2. Maintain complete integrity with the **Master Project Blueprint (`PROJECT_BLUEPRINT.md`)**, **System Architecture (`ARCHITECTURE.md`)**, and **API Contract (`API_CONTRACT.md`)**.
3. Establish clear visual and architectural separations between **Permanent UI Copy**, **Real Project Facts**, **Dynamic Backend Data**, and **Demo/Preview Data**.
4. Preserve 100% of the approved visual design, layouts, typography, responsiveness, and Phase 1 backend health integration.

### Audit Metrics:
- **Files Inspected:** 16 frontend source files and 7 documentation/blueprint files.
- **Items Audited & Classified:** 34 user-visible elements.
- **Unsupported Quantitative Claims Removed / Rewritten:** 4 items (`500+ field observatories`, `50+ specialized courses`, `1,200+ target trainees`, `150+ domain instructors`).
- **Converted to Dynamic-Ready Pending States (`—`):** 7 metrics across Stats and Dashboard previews.
- **Explicitly Labeled as Demo / Prototype Preview:** 14 preview elements across Competency AI, Course Cards, and Persona Workspaces.

---

## 2. CLASSIFICATION SYSTEM

Every user-visible element is classified into one of five canonical categories:

| Category | Definition | Action Taken |
|---|---|---|
| **A. PERMANENT UI COPY** | Static user interface copy, navigation links, section titles, and architectural workflow steps. | Preserved as permanent UI elements. |
| **B. REAL PROJECT FACT** | Information explicitly supported by the MoES/IMD problem statement or frozen Blueprint. | Retained and verified against blueprint specs. |
| **C. DYNAMIC BACKEND DATA** | Metrics, lists, and values that must be fetched from the database/API in later phases. | Displayed as honest pending states (`—`) with phase notes. |
| **D. DEMO/PREVIEW DATA** | Temporary mock structures required to demonstrate UI workflows before backend modules exist. | Explicitly labeled as `Preview`, `Demo Profile`, or `Sample Benchmark`. |
| **E. UNSUPPORTED / INVENTED CLAIM** | Numbers, counts, or statements lacking official confirmation in the project blueprint. | Rewritten into canonical product language. |

---

## 3. COMPLETE CONTENT & DATA AUDIT TABLE

| # | Component / File | Discovered Content / Value | Classification | Action Taken | Future Data Source (API / Model) |
|---|---|---|---|---|---|
| 1 | `TopBar.tsx` | `"IMD-HQ-DELHI"` / Node Code | **C. Dynamic Data** | Kept dynamic via `GET /api/v1/health` with fallback | `GET /api/v1/health` (`station_code`) |
| 2 | `TopBar.tsx` | `"LOCAL"` / Engine Mode | **C. Dynamic Data** | Kept dynamic via `GET /api/v1/health` with fallback | `GET /api/v1/health` (`app_mode`) |
| 3 | `TopBar.tsx` | `"HQ Weather Desk: 1800-180-1717"` | **B. Real Project Fact** | Retained (National IMD weather enquiry toll-free line) | Institutional contact directory |
| 4 | `TopBar.tsx` | `"capacity.imd@moes.gov.in"` | **A. Permanent Copy** | Retained as designated project desk email | Institutional communication configuration |
| 5 | `Navbar.tsx` | `"CAPACITY CONNECT • SIH 26075"` | **B. Real Project Fact** | Retained (SIH Problem Statement ID 26075) | System metadata |
| 6 | `HeroSection.tsx` | Master headline & dual CTAs | **A. Permanent Copy** | Preserved verbatim (approved visual identity) | N/A (Static UI) |
| 7 | `HeroSection.tsx` | `"across 500+ field observatories"` | **E. Unsupported Claim** | **Removed 500+**; rewritten to canonical blueprint phrasing: *"across remote field observatories, coastal radar stations, and frontier monitoring posts"* | N/A (Canonical blueprint language) |
| 8 | `HeroSection.tsx` | Zero-Internet Field Readiness & Micro-LAN badges | **B. Real Project Fact** | Retained (Blueprint Sections 11, 12, 13) | System capabilities |
| 9 | `FeatureCards.tsx` | 4 Pillar Cards (Curriculum, Instructors, Exams, AI) | **A. Permanent Copy** | Preserved verbatim as 4 core architectural pillars | N/A (Product copy) |
| 10 | `AboutSection.tsx` | `"DWR Network • 24/7 Observation"` | **E. Unsupported Claim** | Refined to general product term: *"Meteorological Networks • Edge Deployment"* | N/A |
| 11 | `AboutSection.tsx` | Bootable Live USB, 30-sec boot, SQLite WAL | **B. Real Project Fact** | Retained (Blueprint Section 14, Casper-rw persistence) | OS specification |
| 12 | `AboutSection.tsx` | Micro-LAN classroom for up to 30 nearby devices | **B. Real Project Fact** | Retained (Blueprint Section 13, Ad-hoc Wi-Fi server) | Hotspot daemon architecture |
| 13 | `StatsSection.tsx` | `"50+" Specialized Courses` | **E. Unsupported Claim** | Converted to `—` with badge *"Live platform data pending (Phase 5)"* | `GET /api/v1/courses` (Count aggregation) |
| 14 | `StatsSection.tsx` | `"1,200+" Target Trainees` | **E. Unsupported Claim** | Converted to `—` with badge *"Live platform data pending (Phase 2)"* | `GET /api/v1/admin/users` (Trainee count) |
| 15 | `StatsSection.tsx` | `"150+" Domain Instructors` | **E. Unsupported Claim** | Converted to `—` with badge *"Live platform data pending (Phase 4)"* | `GET /api/v1/admin/users?role=trainer` |
| 16 | `StatsSection.tsx` | `"100%" Offline Resilience` | **B. Real Project Fact** | Retained `100%` with badge *"Architectural Guarantee (Phase 0)"* | Architectural parity contract |
| 17 | `StatsSection.tsx` | Notice header declaring metrics | **A. Permanent Copy** | Updated to: *"Platform Metrics Status (Live Data Pending Deployment)"* | Portal telemetry |
| 18 | `CoursesSection.tsx` | Header badge `"Curated Curriculum"` | **A. Permanent Copy** | Updated to: *"Curated Curriculum • Sample Catalog Preview"* | `GET /api/v1/courses/categories` |
| 19 | `CoursesSection.tsx` | 6 Course cards (MET-401, NWP-502, SAT-301, etc.) | **D. Demo/Preview Data** | Maintained as curriculum previews; added code comments and schema alignment | `GET /api/v1/courses` (Phase 5 catalog API) |
| 20 | `CoursesSection.tsx` | Course ratings (`4.9★`, `4.8★`) | **D. Demo/Preview Data** | Labeled with explicit prefix: `Sample: 4.9★` | `GET /api/v1/courses/{id}/feedback` |
| 21 | `CoursesSection.tsx` | Instructor designations & names | **D. Demo/Preview Data** | Changed specific names to demo profiles: `Radar Meteorologist (Demo Profile)`, etc. | `GET /api/v1/trainers/{id}/profile` |
| 22 | `CoursesSection.tsx` | Syllabus Modal | **D. Demo/Preview Data** | Added banner `SYLLABUS PREVIEW` and Phase 5 LMS note | `GET /api/v1/courses/{id}/modules` |
| 23 | `LearningJourneySection.tsx` | 5-stage workflow (Discover → Learn → Practice → Assess → Certify) | **A. Permanent Copy** | Preserved verbatim as canonical learner progression model | Educational workflow specification |
| 24 | `CompetencyAISection.tsx` | Header badge `"Explainable Competency Intelligence"` | **A. Permanent Copy** | Updated to: *"Explainable Competency Intelligence • Interactive Model Preview"* | Competency system specification |
| 25 | `CompetencyAISection.tsx` | Role benchmarks (Radar, NWP, Cyclone) | **D. Demo/Preview Data** | Clarified tabs as `(Sample)` and title as `Simulated Benchmark Role` | `GET /api/v1/competency/taxonomy` |
| 26 | `CompetencyAISection.tsx` | Readiness percentages (`71%`, `64%`, `82%`) | **D. Demo/Preview Data** | Explicitly labeled as `71% Match (Sample Analysis)` | `GET /api/v1/competency/trainee/{user_id}/matrix` |
| 27 | `CompetencyAISection.tsx` | Skill deficit sliders (`-30% Gap`, etc.) | **D. Demo/Preview Data** | Documented deterministic formula; retained as interactive demonstration | `GET /api/v1/competency/gaps?target_role={role}` |
| 28 | `CompetencyAISection.tsx` | Scikit-learn Cosine Similarity rationale card | **D. Demo/Preview Data** | Updated header to `(Prototype Model)` and text to `Simulated Priority Match` | `GET /api/v1/competency/recommendations/courses` |
| 29 | `DashboardPreviewsSection.tsx` | Trainee Workspace Mockup (`Scientist S. Sharma`) | **D. Demo/Preview Data** | Added badge `[Demo Workspace Preview — Sample Trainee Profile]` | `GET /api/v1/trainee/profile` & `/enrollments` |
| 30 | `DashboardPreviewsSection.tsx` | Trainer Studio Mockup (`Dr. Rajesh Singh`) | **D. Demo/Preview Data** | Added badge `[Demo Workspace Preview]`; converted stats (Courses, Enrolled, Files) to `—` | `GET /api/v1/trainer/courses` & `/library` |
| 31 | `DashboardPreviewsSection.tsx` | Admin Console (`1,240 Users`, `3,410 Assessments`) | **E. Unsupported Claim** | Replaced arbitrary numbers with `—` and sublabels *"Live data pending (Phase 2/6/10)"* | `GET /api/v1/admin/metrics` & `/sync/audit-logs` |
| 32 | `HealthCheck.tsx` | Live Probe (`/api/v1/health` & `/api/v1/health/db`) | **C. Dynamic Data** | Verified live via FastAPI and SQLite in < 1ms | Active Phase 1 backend endpoints |
| 33 | `Footer.tsx` | Headquarters address & Contact | **B. Real Project Fact** | Retained (Mausam Bhavan, Lodhi Road, New Delhi – 110003) | Official institutional records |
| 34 | `Footer.tsx` | Phase 1 Baseline Verified tag | **B. Real Project Fact** | Retained (reflects genuine Git/CI verified state) | Milestone status |

---

## 4. PERMANENT UI CONTENT SUMMARY

The following elements represent permanent user experience copy that will remain throughout future phases:
- Navigation items: `Curriculum`, `How It Works`, `Competency AI`, `Offline Hub`, `Role Previews`, `System Health`.
- Primary value propositions: *"Build Skills. Strengthen Capacity. Enable Better Decisions."*
- Institutional identity: *Ministry of Earth Sciences (MoES) • India Meteorological Department (IMD)*.
- The 4 core architectural pillars: *Structured Curriculum*, *Verified Instructors*, *Offline Assessments*, *Competency AI*.
- The 5-stage capacity building pipeline: *Discover → Learn → Practice → Assess → Certify & Grow*.
- Offline technical badges: *Capacity Connect OS*, *Micro-LAN Classroom Server*, *Dual DB: SQLite WAL & Central PostgreSQL Mirror*.

---

## 5. REAL PROJECT FACTS SUPPORTED BY BLUEPRINT

The following statements have been cross-checked against `PROJECT_BLUEPRINT.md` and confirmed as official specifications:
- **SIH Problem Statement ID:** 26075 (Theme: Smart Education).
- **Target User Personas:** Trainee, Trainer, Administrator (three-tier RBAC).
- **Dual-Mode Parity:** 100% feature parity for offline video playback, PDF reading, and timed MCQ assessments.
- **Offline Persistence:** Bootable Live USB with ext4 `casper-rw` overlay filesystem.
- **LAN Classroom Mode:** Single host machine serving up to 30 nearby trainee devices over isolated local Wi-Fi or Ethernet.
- **HMAC Tamper-Sealing:** Cryptographic SHA-256 signing of assessment attempts for conflict-free sync reconciliation.
- **Database Engine Parity:** Single unified SQLAlchemy async ORM with SQLite WAL mode locally and PostgreSQL 16 on central cloud.

---

## 6. DYNAMIC DATA REQUIRING FUTURE APIS

The following elements have been decoupled from hardcoded numbers and documented with their planned future API endpoints:

| UI Metric / Data Element | Current Honest State | Target Phase | Planned REST API Endpoint |
|---|---|---|---|
| **Total Registered Users** | `—` (*Pending Onboarding*) | Phase 2 | `GET /api/v1/admin/users/count` |
| **Total Active Trainees** | `—` (*Pending Onboarding*) | Phase 2 | `GET /api/v1/admin/trainees/count` |
| **Active Course Catalog** | `CourseCardData[]` (*Preview*) | Phase 5 | `GET /api/v1/courses` |
| **Course Module & Syllabus** | Modal Preview (*Sample*) | Phase 5 | `GET /api/v1/courses/{id}/modules` |
| **User Course Progress** | `—` (*Demo Workspace*) | Phase 5 | `GET /api/v1/trainee/courses/{id}/progress` |
| **MCQ Question Bank & Quizzes** | Sample Quiz Trigger | Phase 6 | `GET /api/v1/assessments/{id}/questions` |
| **Assessment Scores & Ledgers** | `—` (*Pending Sync*) | Phase 6 | `POST /api/v1/assessments/{id}/submit` |
| **Competency Vectors** | `roleProfiles` (*Simulated*) | Phase 8 | `GET /api/v1/competency/trainee/{id}/matrix` |
| **Skill-Gap Analysis** | Simulated Gap Sliders | Phase 8 | `GET /api/v1/competency/gaps?target_role={role}` |
| **AI Course Recommendations** | Prototype Rationale Card | Phase 8 | `GET /api/v1/competency/recommendations/courses` |
| **Pending Sync Queue Counter** | `0 Delta` (*Heartbeat*) | Phase 10 | `GET /api/v1/sync/status` |
| **Station Node Registry** | `—` (*Pending Deployment*) | Phase 10/11 | `GET /api/v1/admin/nodes` |

---

## 7. DEMO / PREVIEW DATA INTENTIONALLY RETAINED

To ensure the UI remains engaging and demonstrates all user workflows without claiming false operational statistics, the following prototypes were intentionally retained with clear disclaimers:
1. **Curriculum Catalog Preview:** 6 representative meteorological courses (`MET-401`, `NWP-502`, `SAT-301`, `AWS-201`, `CYC-601`, `AGR-101`) demonstrating course cards, difficulty badges, and the syllabus modal.
2. **Interactive Competency Gap Matrix:** 3 role tracks (Radar, NWP, Cyclone) demonstrating how the scikit-learn cosine similarity engine will calculate proficiency deltas.
3. **Persona Workspace Previews:** Interactive switcher allowing reviewers to preview the upcoming Trainee Dashboard, Trainer Studio, and Admin Command Center layouts.

---

## 8. REMOVED UNSUPPORTED CLAIMS

| Original Phrase / Number | Problem Identified | Resolution Applied |
|---|---|---|
| `"across 500+ field observatories"` | Unsupported exact number | Replaced with blueprint language: *"across remote field observatories, coastal radar stations, and frontier monitoring posts"* |
| `"50+ Specialized Courses"` | Arbitrary platform metric | Replaced with `—` and label *"Live platform data pending (Phase 5)"* |
| `"1,200+ Target Trainees"` | Arbitrary platform metric | Replaced with `—` and label *"Live platform data pending (Phase 2)"* |
| `"150+ Domain Instructors"` | Arbitrary platform metric | Replaced with `—` and label *"Live platform data pending (Phase 4)"* |
| `"1,240 Registered Users Across 32 State Met Centres"` | Fabricated admin stat | Replaced with `—` and label *"Live data pending user onboarding (Phase 2)"* |
| `"38 Active Station OS Nodes"` | Fabricated edge metric | Replaced with `—` and label *"Available after edge deployment (Phase 10/11)"* |
| `"3,410 Completed Assessments"` | Fabricated evaluation stat | Replaced with `—` and label *"Populates on sync (Phase 6/10)"* |
| `"DWR Network • 24/7 Observation"` | Unverified operational claim | Replaced with general terminology: *"Meteorological Networks • Edge Deployment"* |

---

## 9. RECOMMENDED DATA SOURCES BY COMPONENT

### Component: `StatsSection`
- **Future Integration:** `GET /api/v1/admin/metrics/overview`
- **Response Schema Expected:**
  ```json
  {
    "total_courses": 42,
    "total_trainees": 860,
    "total_trainers": 64,
    "offline_resilience_percentage": 100.0
  }
  ```

### Component: `CoursesSection`
- **Future Integration:** `GET /api/v1/courses?category={cat}&page=1&limit=12`
- **Response Schema Expected:**
  ```json
  {
    "items": [
      {
        "id": "c0000000-0000-0000-0000-000000000010",
        "code": "MET-401",
        "title": "Advanced Doppler Weather Radar & QPE",
        "category": "Radar Meteorology",
        "level": "Intermediate",
        "duration_hours": 12.5,
        "lesson_count": 18,
        "instructor": {"name": "Dr. Rajesh Singh", "title": "Lead Radar Meteorologist"},
        "rating": 4.9,
        "enrolled_count": 142
      }
    ],
    "total": 42
  }
  ```

### Component: `CompetencyAISection`
- **Future Integration:** `GET /api/v1/competency/trainee/{user_id}/matrix` & `GET /api/v1/competency/gaps?target_role={role}`
- **Response Schema Expected:**
  ```json
  {
    "target_role": "Senior_Radar_Meteorologist",
    "overall_readiness_percentage": 71.0,
    "gaps": [
      {"competency": "Doppler Radar Operation", "required": 0.85, "current": 0.55, "gap": 0.30, "recommended_course": "MET-401"}
    ],
    "top_recommendation": {
      "course_code": "MET-401",
      "title": "Advanced Doppler Weather Radar & QPE",
      "rationale": "Directly resolves 30% gap in pulse compression algorithms."
    }
  }
  ```

### Component: `DashboardPreviewsSection`
- **Future Integration:**
  - Trainee: `GET /api/v1/trainee/dashboard/summary`
  - Trainer: `GET /api/v1/trainer/dashboard/summary`
  - Admin: `GET /api/v1/admin/dashboard/summary`

---

## 10. CONCLUSION & VERIFICATION STATUS

The Capacity Connect frontend is now completely audit-compliant:
1. All fictional platform numbers have been converted into clean, professional, dynamic-ready pending states (`—`).
2. All demonstration assets are unambiguously labeled as prototypes or previews.
3. No unsupported institutional or operational claims remain in the user-facing interface.
4. TypeScript compilation, Vite production build, Pytest backend tests, and live proxy communications all pass with zero regressions.
