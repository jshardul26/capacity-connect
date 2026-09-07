# CAPACITY CONNECT — MASTER PROJECT BLUEPRINT
## A Digital Capacity Building and Learning Management Portal
### Smart India Hackathon (SIH) — Problem Statement ID: 26075
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Category:** Software | **Theme:** Smart Education  
**Document Status:** FIXED & FROZEN (Single Source of Truth)  
**Version:** 1.0.0  
**Date:** September 2026  

---

## TABLE OF CONTENTS
1. [Problem Definition](#1-problem-definition)
2. [Solution Definition](#2-solution-definition)
3. [Complete Functional Requirements](#3-complete-functional-requirements)
4. [Complete Non-Functional Requirements](#4-complete-non-functional-requirements)
5. [Final Feature List](#5-final-feature-list)
6. [Final Tech Stack](#6-final-tech-stack)
7. [Complete System Architecture](#7-complete-system-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Backend Architecture](#9-backend-architecture)
10. [AI/ML Architecture (Intelligent Capacity Building)](#10-aiml-architecture)
11. [Offline Architecture](#11-offline-architecture)
12. [Synchronization Architecture](#12-synchronization-architecture)
13. [LAN Architecture (Local Learning Server)](#13-lan-architecture)
14. [Linux/OS Architecture (Capacity Connect OS)](#14-linuxos-architecture)
15. [Database ER Design](#15-database-er-design)
16. [Complete Database Schema (PostgreSQL & SQLite)](#16-complete-database-schema)
17. [API Architecture](#17-api-architecture)
18. [API Naming Conventions](#18-api-naming-conventions)
19. [Folder Structure](#19-folder-structure)
20. [Naming Conventions (Canonical Dictionary)](#20-naming-conventions)
21. [Security Architecture](#21-security-architecture)
22. [Testing Strategy](#22-testing-strategy)
23. [Deployment Architecture](#23-deployment-architecture)
24. [Git Strategy](#24-git-strategy)
25. [Development Phases (Phases 0 to 14)](#25-development-phases)
26. [Phase Dependencies](#26-phase-dependencies)
27. [Acceptance Criteria](#27-acceptance-criteria)
28. [SIH Demonstration Workflow](#28-sih-demonstration-workflow)
29. [Risks and Mitigations](#29-risks-and-mitigations)
30. [Final Project Scope & Freeze Statement](#30-final-project-scope)

---

## 1. PROBLEM DEFINITION

### 1.1 Background & Context
The India Meteorological Department (IMD), operating under the Ministry of Earth Sciences (MoES), Government of India, is responsible for meteorological observations, weather forecasting, seismology, and climate services across the subcontinent. To support mission-critical operations, IMD operates hundreds of remote weather observatories, coastal radar stations, upper-air monitoring stations, and seismological centers located in remote, rural, mountainous, and coastal areas (e.g., Leh, Lakshadweep, Andaman & Nicobar, high-altitude Western Ghats, and remote northeast frontiers).

### 1.2 Core Challenges
1. **Severe Connectivity Constraints:** Personnel deployed at peripheral observatories, marine buoys, radar stations, and field posts frequently experience low-bandwidth, intermittent, or non-existent internet access, rendering traditional cloud-only learning management systems (LMS) completely unusable.
2. **Dynamic Skill and Competency Gaps:** Meteorology, atmospheric instrumentation, numerical weather prediction (NWP), radar meteorology, and disaster warning systems require continuous upskilling. Currently, no unified platform tracks individual competency profiles, maps organizational requirements, or matches domain experts with learners needing specialized training.
3. **Inefficient Training Logistics:** Physical training requires transporting field personnel to central institutes (such as IMD Pune or New Delhi), incurring high travel costs, duty disruptions, and delays.
4. **Lack of Standardized Offline Assessments & Verification:** When training occurs remotely or offline, progress tracking, MCQ evaluations, and certification compliance cannot be verified or synchronized reliably once connectivity returns.
5. **Absence of Dedicated Educational Computing Environments:** General-purpose PCs at field stations often have misconfigured software, missing media codecs, or distracting non-educational tools.

### 1.3 Problem Statement Alignment
- **Problem Statement ID:** 26075
- **Goal:** Design and deliver a modern, resilient, digital capacity building and learning management portal tailored for MoES/IMD, solving both central digital management and extreme field deployment via offline capabilities.

---

## 2. SOLUTION DEFINITION

### 2.1 The Capacity Connect Ecosystem
Capacity Connect is an **offline-first educational and organizational capacity-building ecosystem** comprising nine interlinked pillars:

```
+-----------------------------------------------------------------------------------+
|                        CENTRAL CAPACITY CONNECT CLOUD / SERVER                    |
|  - Central FastAPI Backend + PostgreSQL + MinIO Object Store                     |
|  - Central Admin / Trainer / Trainee Portals                                      |
|  - AI/ML Competency & Trainer-Matching Engine                                     |
|  - Bi-directional Delta Synchronization Hub                                       |
+------------------------------------------+----------------------------------------+
                                           |
                    (Intermittent Sync via HTTPS / USB Pack)
                                           |
+------------------------------------------v----------------------------------------+
|                      CAPACITY CONNECT OS (PORTABLE / USB)                         |
|  - Custom Lightweight Linux Environment (Ubuntu Mini / Debian Live Base)          |
|  - Kiosk / Education Desktop UI                                                   |
|  - Local Offline FastAPI Service + SQLite (WAL Mode)                              |
|  - Local Content Store (Encrypted, Checksummed Lectures, Slides, PDFs)            |
|  - Offline MCQ Assessment Engine with Cryptographic Attempt Ledgers               |
|  - Background Two-Way Synchronization Daemon                                      |
+------------------------------------------+----------------------------------------+
                                           |
                               (Local Wi-Fi / Ethernet LAN)
                                           |
+------------------------------------------v----------------------------------------+
|                          LAN LEARNING SERVER MODE                                 |
|  - Single OS machine acts as offline access point / local server                  |
|  - Up to 30 nearby trainee devices connect locally without central internet       |
+-----------------------------------------------------------------------------------+
```

### 2.2 Key Distinguishing Capabilities
1. **Full Dual-Mode Operation:** 100% feature parity for offline course consumption, PDF reading, slide viewing, and MCQ assessments.
2. **Cryptographic Two-Way Sync:** Tamper-evident, idempotent synchronization queue with SHA-256 validation, conflict resolution, and offline JWT preservation.
3. **Capacity Connect OS on Live USB:** Plug-and-play bootable flash drive with persistent overlay filesystem enabling zero-install training on any standard x86_64 computer.
4. **Micro-LAN Server Mode:** Instant field-classroom deployment where one station hosts the courseware for local laptops/tablets over an isolated Wi-Fi or ad-hoc LAN.
5. **Intelligent Competency Mapping:** Explainable scikit-learn matching engine that maps trainee skills, identifies job-role competency gaps, recommends curated learning tracks, and matches qualified trainers to subjects.
6. **Curated Offline Content Packs (`.ccpack`):** Secure, compressed content archives exportable by trainers/admins for physical air-gapped distribution.

---

## 3. COMPLETE FUNCTIONAL REQUIREMENTS

### 3.1 Authentication & Role-Based Access Control (RBAC)
- **F-AUTH-01 (Signup):** Trainees and Trainers can register using full name, official email, password, phone number, and organization/station identifier.
- **F-AUTH-02 (Password Security):** Passwords hashed using bcrypt (cost factor 12) with salt. Minimum 8 characters, requiring uppercase, lowercase, numeric, and special characters.
- **F-AUTH-03 (Admin Approval Workflow):** Newly registered accounts default to `status = 'pending_approval'`. Only users approved by an Admin receive `status = 'approved'` and can access authenticated workflows.
- **F-AUTH-04 (JWT Session Management):** Access tokens (short-lived: 60 minutes) and Refresh tokens (long-lived: 30 days) with role claims and station claims.
- **F-AUTH-05 (Three Core Roles):** Strict role boundaries for `trainee`, `trainer`, and `admin`. Multi-role elevation restricted to admin control.
- **F-AUTH-06 (Offline Authentication):** Offline OS caches salted password hashes and cryptographic tokens of approved station personnel, allowing local login when internet is disconnected.

### 3.2 Trainee Module
- **F-TRN-01 (Profile Management):** Maintain comprehensive profile: personal details, designation, department/division, posting location/observatory.
- **F-TRN-02 (Qualifications):** Add, edit, and delete academic qualifications (degree, field of study, institution, graduation year, grade).
- **F-TRN-03 (Work Experience):** Manage professional experience (organization, role, start/end dates, key meteorological/technical duties).
- **F-TRN-04 (Interests & Skills):** Self-declare technical skills with proficiency levels (Beginner, Intermediate, Advanced) and meteorological domain interests (e.g., Radar Meteorology, NWP Modeling, Cyclone Tracking).
- **F-TRN-05 (Certificates):** Upload existing certificates (PDF/PNG) and view system-issued digital certificates upon course completion.
- **F-TRN-06 (Course Enrollment):** Browse course catalog, view syllabi, prerequisites, and enroll in available courses.
- **F-TRN-07 (Learning Resource Access):** Stream/download recorded video lectures, view presentations (slide decks), read study PDFs, and view supplementary lab manuals.
- **F-TRN-08 (MCQ Assessments):** Take subject-wise MCQ quizzes with countdown timers, randomize questions/options, submit answers, and receive instant score breakdowns.
- **F-TRN-09 (Feedback Submission):** Submit qualitative and 5-star rating feedback upon completing modules or courses.
- **F-TRN-10 (Progress Tracking):** Real-time granular progress monitoring: percentage completed, video watch duration, completed modules, quiz history, and competency level advancements.

### 3.3 Trainer Module
- **F-TNR-01 (Trainer Profile & Expertise):** Manage trainer bio, years of specialized meteorological experience, publications, and verified subject expertise areas.
- **F-TNR-02 (Course Management):** Create and structure courses into modules, lessons, and required competencies. Edit course descriptions, learning objectives, and prerequisites.
- **F-TNR-03 (Learning Content Upload):** Upload recorded lecture videos (MP4, WebM), presentations (PDF, PPTX), and study documents (PDF, DOCX) with auto-generated metadata and checksums.
- **F-TNR-04 (Trainer Library):** Personal repository for drafting, storing, and organizing pedagogical resources before publishing.
- **F-TNR-05 (Access Delegation):** Publish curated materials from the trainer library directly into active course modules accessible by trainees.
- **F-TNR-06 (Questionnaire & Assessment Builder):** Create subject-wise MCQ assessments, configure passing criteria, time limits, question weights, negative marking (optional), and submission deadlines.
- **F-TNR-07 (Trainee Monitoring):** Real-time dashboard of enrolled trainee progress, module completion rates, and average assessment scores.
- **F-TNR-08 (Performance Analytics):** Granular question-level item analysis, score distributions, and identification of struggling trainees for targeted mentoring.

### 3.4 Admin Module
- **F-ADM-01 (User Approval & Management):** Central approval queue for pending signups. Capability to approve, reject, suspend, or reactivate user accounts.
- **F-ADM-02 (Role Governance):** Assign and modify user roles (`trainee`, `trainer`, `admin`).
- **F-ADM-03 (Course & Content Auditing):** Monitor all published and draft courses across divisions; unpublish or archive inappropriate/outdated content.
- **F-ADM-04 (Enrollment & Certification Governance):** Track global enrollment metrics, issue or revoke official certificates, and inspect digital signatures.
- **F-ADM-05 (Assessment Monitoring):** Review assessment schedules, pass/fail percentages, and department-wide performance benchmarks.
- **F-ADM-06 (Homepage & Bulletin Management):** Publish announcements, urgent meteorological training bulletins, achievements, featured courses, and top trainee highlights directly to the public/authenticated homepage.
- **F-ADM-07 (Notification Dispatcher):** Broadcast system notifications, deadline alerts, and course updates via in-app banners and notifications.
- **F-ADM-08 (Offline Content Pack Bundler):** Export selected courses, assessments, and multimedia assets into encrypted, portable `.ccpack` packages for offline air-gapped distribution.
- **F-ADM-09 (Sync Audit & Health Dashboard):** Monitor node sync events, queue sizes, conflict logs, and device health across distributed field observatories.

### 3.5 Competency Mapping & Intelligent Capacity Building
- **F-CMP-01 (Competency Taxonomy):** Standardized hierarchy of competencies, skills, and sub-skills tailored to atmospheric sciences, instrumentation, forecasting, and data systems.
- **F-CMP-02 (Skill-Gap Detection):** Compare trainee current proficiency matrix against target job-role competencies; calculate numerical and percentage skill gaps.
- **F-CMP-03 (Competency Dashboard):** Visual radar/spider charts displaying current vs. required competencies for trainees, team readiness for trainers, and departmental gaps for admins.
- **F-CMP-04 (Course & Learning Path Recommendation):** Scikit-learn recommendation engine suggesting courses that address detected skill deficiencies.
- **F-CMP-05 (Trainer-Subject Matching):** Algorithmic matching of qualified trainers to specialized subject demands based on domain expertise, past performance ratings, and availability.

### 3.6 Offline-First & Synchronization
- **F-OFF-01 (Local Offline Store):** Fully functional local SQLite database and local filesystem storing downloaded courses, videos, PDFs, and assessments.
- **F-OFF-02 (Offline Assessment Attempt Engine):** Trainees can take quizzes completely disconnected from the internet. Attempts are sealed locally with timestamps and SHA-256 checksums.
- **F-OFF-03 (Sync Queue):** Local mutations (progress, attempts, feedback) append to an idempotent, transactional sync queue.
- **F-OFF-04 (Automatic Sync Daemon):** Monitors network state; initiates bi-directional delta synchronization immediately when an internet connection (Wi-Fi, 4G, LAN) is detected.
- **F-OFF-05 (Conflict Resolution):** Deterministic conflict rules: Trainee quiz attempts are strictly append-only (no overwrite); course content follows central server authority with version vectors.

### 3.7 Local Learning Server / LAN Mode
- **F-LAN-01 (Ad-Hoc Hotspot / LAN Hosting):** Capacity Connect OS machine can run as a local server over Wi-Fi hotspot or local switch.
- **F-LAN-02 (Local Multi-User Access):** Trainees on nearby laptops/smartphones connect to the host machine via mDNS/local IP (`http://capacityconnect.local`) without internet.
- **F-LAN-03 (Local Collation):** All LAN attendee quiz submissions and progress records collate into the host machine’s local database, ready to sync to the central server when the host gains connectivity.

---

## 4. COMPLETE NON-FUNCTIONAL REQUIREMENTS

| Category | Requirement ID | Specification | Metric / Acceptance Standard |
|---|---|---|---|
| **Performance** | NF-PERF-01 | Central API Latency | 95th percentile response time < 200 ms for core CRUD endpoints under 500 concurrent requests. |
| **Performance** | NF-PERF-02 | Local API Latency | Local SQLite/FastAPI response time < 50 ms on low-spec x86 hardware (Intel Celeron / Core i3, 4GB RAM). |
| **Performance** | NF-PERF-03 | Content Loading | Local video playback and PDF rendering starts in < 1.5 seconds without network dependency. |
| **Scalability** | NF-SCAL-01 | Horizontal Backend Scaling | Central FastAPI backend is stateless; can scale horizontally behind Nginx/Traefik load balancers. |
| **Scalability** | NF-SCAL-02 | Database Throughput | Central PostgreSQL configured with connection pooling (PgBouncer) supporting 5,000+ active connections. |
| **Availability** | NF-AVAL-01 | Central Uptime | 99.9% availability for central cloud services. |
| **Availability** | NF-AVAL-02 | Offline Independence | 100% availability of local courseware regardless of external cloud outages. |
| **Security** | NF-SEC-01 | Transport Encryption | All network communications (API, video streaming, sync) enforce TLS 1.3 / HTTPS. |
| **Security** | NF-SEC-02 | Data at Rest | Passwords hashed using bcrypt; sensitive local tokens encrypted with AES-GCM-256. |
| **Security** | NF-SEC-03 | OWASP Top 10 Mitigation | SQL injection prevented via SQLAlchemy parameterized queries; XSS mitigated via React auto-escaping; CSRF/CORS enforced. |
| **Usability** | NF-USE-01 | Responsive Design | Fully responsive across mobile (360px+), tablet (768px+), and desktop (1080p, 4K) screens. |
| **Usability** | NF-USE-02 | Accessibility | Compliance with WCAG 2.1 Level AA (color contrast >= 4.5:1, keyboard navigation, screen-reader aria labels). |
| **Reliability** | NF-REL-01 | Data Integrity | SHA-256 file checksum verification for every downloaded and synchronized media file. |
| **Reliability** | NF-REL-02 | Idempotent Sync | Zero duplicate attempts or lost progress records across arbitrary network drops and reconnects. |
| **Maintainability**| NF-MNT-01 | Modular Codebase | Clean layered architecture; 100% type-annotated Python (Pydantic v2) and TypeScript. |
| **Portability** | NF-PORT-01 | OS Portability | Capacity Connect OS image bootable on standard UEFI and Legacy BIOS x86_64 systems with >= 4GB RAM. |

---

## 5. FINAL FEATURE LIST

### 5.1 Core Platform Features
1. **Public/Landing Portal:** IMD/MoES branding, mission statement, featured training courses, recent notifications, top announcements, portal statistics counter.
2. **Auth & RBAC Module:** Signup, login, password reset, admin approval queue, session token refresh, multi-device login tracking.
3. **Trainee Workspace:** Profile editor, academic qualifications, experience log, skill matrix, enrolled course viewer, video player with speed control and bookmarking, PDF reader, assessment launcher, certificate repository.
4. **Trainer Studio:** Course builder, module manager, video/presentation/study note uploader, personal trainer library, assessment creator (MCQ bank, time limits, deadlines), class performance analytics, gradebook.
5. **Admin Console:** User approvals table, role reassignment, content auditing, global assessment metrics, bulletin/announcement manager, offline pack builder, sync audit monitor.
6. **Competency Engine:** Skill taxonomy builder, trainee radar charts, organizational gap analyzer, scikit-learn recommendation matrix, trainer expertise matcher.

### 5.2 Evaluated & Approved Additions
7. **Addition 1: Competency/Skill-Gap Dashboard:** Interactive visual dashboard embedded across Trainee, Trainer, and Admin views with real-time gap delta calculations, target benchmarks, and dynamic next-step learning recommendations.
8. **Addition 2: Offline Content Pack / Training Pack (`.ccpack`):** Secure ZIP-based package utility with manifest signing, allowing trainers to export complete courses for USB transfer, and offline nodes to import with one click.

### 5.3 Offline & Ecosystem Features
9. **Capacity Connect OS Desktop:** Tailored, lightweight x86_64 Linux OS running Chromium in controlled app mode, hosting the local backend and database as systemd services.
10. **Bootable Live USB with Persistence:** Dual-partition flash drive (EFI bootable + persistent writable `casper-rw` partition) preserving trainee data across reboots.
11. **Local Two-Way Sync Daemon:** Background worker with connectivity watcher, exponential backoff retries, batch delta sync, and visual sync status indicator (Online, Offline, Syncing, Synced, Error).
12. **LAN Classroom Server Mode:** Single-click toggle in Admin/Trainer settings enabling host hotspot/mDNS broadcast, allowing 30+ devices on local Wi-Fi to learn and test without internet.

---

## 6. FINAL TECH STACK

| Component Layer | Technology Selected | Version | Justification / Rationale |
|---|---|---|---|
| **Frontend Framework** | React.js | 18.3+ | Industry standard, massive ecosystem, component reusability, virtual DOM performance. |
| **Frontend Language** | TypeScript | 5.4+ | Strict compile-time typing, prevents contract mismatches between client and API. |
| **Frontend Build Tool** | Vite | 5.2+ | Instant HMR, ultra-fast production bundling, optimized asset splitting for offline caches. |
| **CSS & Styling** | Tailwind CSS | 3.4+ | Utility-first, responsive layouts, zero runtime overhead, built-in dark/light mode support. |
| **Frontend State** | Zustand | 4.5+ | Lightweight, intuitive state management without boilerplate; ideal for offline queue state. |
| **Data Fetching** | TanStack Query (React Query) | 5.28+ | Declarative caching, background refetching, automatic offline state hydration. |
| **Icons & UI Kit** | Lucide React | 0.350+ | Clean, consistent, accessible icon set with low bundle footprint. |
| **Central Backend** | Python / FastAPI | 0.110+ | Asynchronous high-throughput, automatic OpenAPI/Swagger generation, strict Pydantic models. |
| **Local Offline Backend**| Python / FastAPI (Single Codebase)| 0.110+ | Identical API contract offline and online; shared logic eliminates code drift. |
| **Data Validation** | Pydantic | 2.6+ | High-speed Rust-based parsing, schema enforcement, clean error serialization. |
| **ORM & Database Driver**| SQLAlchemy + Asyncpg (Central) / aiosqlite (Local) | 2.0+ | Unified repository pattern; supports PostgreSQL in production and SQLite offline. |
| **Central Database** | PostgreSQL | 16+ | Robust ACID compliance, native JSONB support for questions/competency vectors, high concurrency. |
| **Offline Database** | SQLite (WAL Mode enabled) | 3.45+ | Zero-configuration, zero-dependency, atomic operations, lightning-fast file database. |
| **Database Migrations** | Alembic | 1.13+ | Version-controlled schema migrations, automated DDL generation. |
| **AI / Machine Learning** | scikit-learn + NumPy | 1.4+ | Deterministic, lightweight, fast vector cosine similarity for competency matching without heavy LLM costs. |
| **File / Object Storage**| MinIO / Local Filesystem Abstraction | Current | S3-compatible API for central cloud; transparent local filesystem fallback for offline nodes. |
| **Operating System Base**| Ubuntu 24.04 LTS Mini / Debian Live | 24.04 | Stable long-term support, hardware compatibility across diverse PCs, robust live-build tooling. |
| **Containerization** | Docker & Docker Compose | 26.0+ | Reproducible multi-service deployment (PostgreSQL, MinIO, Central Backend, Frontend). |
| **Testing Tools** | Pytest, HTTPX, Vitest | Current | Comprehensive async testing for APIs, unit logic, sync simulations, and UI components. |

---

## 7. COMPLETE SYSTEM ARCHITECTURE

### 7.1 High-Level Architecture Diagram
```
+----------------------------------------------------------------------------------------------------+
|                                      CENTRAL CLOUD ENVIRONMENT                                     |
|                                                                                                    |
|  +--------------------+      +-----------------------------------------+      +-----------------+  |
|  |   React Frontend   | ---> |        Nginx Reverse Proxy / SSL        | ---> |  MinIO Storage  |  |
|  |   (Web Client)     |      +--------------------+--------------------+      | (Videos, PDFs)  |  |
|  +--------------------+                           |                           +-----------------+  |
|                                                   v                                                |
|                              +-----------------------------------------+                           |
|                              |       Central FastAPI Application       |                           |
|                              |  - Auth & RBAC (JWT Engine)             |                           |
|                              |  - Course & Content Engine              |                           |
|                              |  - Assessment Engine                    |                           |
|                              |  - Competency & Matching Engine (AI/ML) |                           |
|                              |  - Central Sync Hub (Batch Delta API)   |                           |
|                              +--------------------+--------------------+                           |
|                                                   |                                                |
|                                                   v                                                |
|                              +-----------------------------------------+                           |
|                              |         PostgreSQL 16 Database          |                           |
|                              |  - Relational tables & JSONB metadata   |                           |
|                              |  - Full audit trail & sync change-logs  |                           |
|                              +-----------------------------------------+                           |
+---------------------------------------------------+------------------------------------------------+
                                                    |
                         HTTPS Synchronization Pipe (Internet or LAN Tether)
                                                    |
+---------------------------------------------------v------------------------------------------------+
|                         CAPACITY CONNECT OS (FIELD / OFFLINE MACHINE)                              |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Kiosk Display / Education Desktop (Lightweight XFCE/Openbox + Chromium in App Mode)         |  |
|  | Accessible via Localhost (Single User) or Local Wi-Fi / Ethernet LAN (Multi-Trainee Mode)    |  |
|  +-----------------------------------------------+----------------------------------------------+  |
|                                                  |                                                 |
|                                                  v                                                 |
|  +----------------------------------------------------------------------------------------------+  |
|  | Local FastAPI Application Daemon (127.0.0.1:8000)                                            |  |
|  |  - Identical REST API interface for Trainee & Trainer workflows                              |  |
|  |  - Local Auth Cache (verifies cached credentials without cloud connection)                   |  |
|  |  - Local Assessment Runner & Instant Grading Engine                                          |  |
|  |  - Pack Import/Export Utility (.ccpack handler)                                             |  |
|  +-----------------------+----------------------------------------------+-----------------------+  |
|                          |                                              |                          |
|                          v                                              v                          |
|  +----------------------------------------+  +--------------------------------------------------+  |
|  | Local SQLite Database (WAL Mode)       |  | Local Content Store (/var/capacity-connect/data) |  |
|  |  - Replicated courses, lessons, quizzes|  |  - Encrypted/Checksummed MP4s, PDFs, PPTXs       |  |
|  |  - Offline attempt ledger & sync queue |  |  - Static frontend assets & documents            |  |
|  +-----------------------+----------------+  +--------------------------------------------------+  |
|                          ^                                                                         |
|                          |                                                                         |
|  +-----------------------+----------------------------------------------------------------------+  |
|  | Background Sync Daemon (Python systemd service)                                             |  |
|  |  - Network Monitor (ping/HTTP probe to central heartbeat)                                    |  |
|  |  - Push Engine: Flushes pending local sync_queue items to Central API                         |  |
|  |  - Pull Engine: Requests delta updates using cursor timestamps                                |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

### 7.2 Architecture Principles
1. **Modular Monolith Core:** Clean internal domain boundaries (auth, courses, assessments, competency, sync). Avoids unnecessary network overhead and microservice deployment fragility for a student/field deployment.
2. **Unified Codebase Strategy:** The backend API codebase runs seamlessly in both Central mode (PostgreSQL backend, full admin tools) and Local/OS mode (SQLite backend, optimized for offline playback and low memory).
3. **Fail-Safe Offline Autonomy:** An offline field node never blocks user interactions waiting for a network handshake. All writes persist immediately to the local transactional SQLite database and enqueue for background propagation.

---

## 8. FRONTEND ARCHITECTURE

### 8.1 Directory Structure & Component Boundaries
```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── main.tsx                   # React root entry point
    ├── App.tsx                    # Top-level router and global providers
    ├── assets/                    # IMD/MoES logos, banners, icons
    ├── components/                # Reusable UI components
    │   ├── common/                # Buttons, Inputs, Modals, Badges, Loaders
    │   ├── layout/                # Navbar, Sidebar, Footer, Breadcrumbs
    │   ├── media/                 # VideoPlayer, PDFViewer, SlideViewer
    │   ├── assessment/            # QuizTimer, QuestionCard, OptionList, ResultSummary
    │   ├── competency/            # RadarChart, SkillProgressBar, GapBadge
    │   └── sync/                  # SyncStatusBar, OfflineIndicator, SyncModal
    ├── context/                   # AuthContext, SyncContext, ThemeContext
    ├── hooks/                     # Custom hooks (useAuth, useSync, useOnlineStatus)
    ├── services/                  # API client modules
    │   ├── api.ts                 # Axios / Fetch instance with JWT interceptors
    │   ├── auth.service.ts        # Login, signup, token refresh
    │   ├── course.service.ts      # Courses, lessons, resources
    │   ├── assessment.service.ts  # Quiz questions, attempt submissions
    │   ├── competency.service.ts  # Competency scores, recommendations
    │   ├── admin.service.ts       # Approvals, bulletins, statistics
    │   └── sync.service.ts        # Manual sync trigger, queue status
    ├── pages/                     # Routed view components
    │   ├── public/                # Home, About, CourseCatalog, Login, Signup
    │   ├── trainee/               # Dashboard, Profile, MyCourses, CourseDetail, QuizView
    │   ├── trainer/               # Dashboard, CourseStudio, AssessmentBuilder, Analytics
    │   ├── admin/                 # Dashboard, UserApprovals, BulletinManager, SyncAudit
    │   └── common/                # NotFound, Unauthorized, OfflineNotice
    ├── store/                     # Zustand state stores (useAuthStore, useSyncStore)
    ├── types/                     # TypeScript interfaces matching backend models
    └── utils/                     # Formatters, validators, date helpers
```

### 8.2 State Management & Client-Side Strategy
- **Authentication Store (`useAuthStore`):** Stores decoded JWT token, user role, station code, approval status, and active session expiry.
- **Sync Status Store (`useSyncStore`):** Tracks online/offline status, queue count, last successful sync timestamp, and active sync progress animation.
- **Optimistic UI Updates:** Assessment submissions and progress ticks register immediately on the client UI while asynchronously writing to the local API.

---

## 9. BACKEND ARCHITECTURE

### 9.1 Layered Architecture Pattern
```
backend/
├── app/
│   ├── main.py                    # FastAPI application initialization & middleware
│   ├── core/                      # Core configuration and security
│   │   ├── config.py              # Environment settings (Pydantic BaseSettings)
│   │   ├── security.py            # Password hashing, JWT encode/decode
│   │   ├── database.py            # SQLAlchemy engine, session maker, base model
│   │   └── dependencies.py        # Request dependencies (get_db, get_current_user, require_role)
│   ├── models/                    # SQLAlchemy ORM database models
│   │   ├── user.py                # User, Role, Profile, Qualification, Experience
│   │   ├── course.py              # Course, Module, Lesson, LearningResource
│   │   ├── assessment.py          # Assessment, Question, AssessmentAttempt, AssessmentAnswer
│   │   ├── competency.py          # Competency, Skill, TraineeCompetency, TrainerExpertise
│   │   ├── bulletin.py            # Notification, Announcement, Achievement
│   │   ├── feedback.py            # CourseFeedback
│   │   └── sync.py                # SyncQueue, SyncAuditLog, ContentPack
│   ├── schemas/                   # Pydantic validation schemas (Request/Response)
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── assessment.py
│   │   ├── competency.py
│   │   ├── bulletin.py
│   │   ├── feedback.py
│   │   └── sync.py
│   ├── api/                       # API route controllers (v1)
│   │   ├── api_v1.py              # Consolidated v1 router
│   │   └── endpoints/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── trainee.py
│   │       ├── trainer.py
│   │       ├── courses.py
│   │       ├── assessments.py
│   │       ├── competency.py
│   │       ├── admin.py
│   │       ├── content_packs.py
│   │       └── sync.py
│   ├── services/                  # Business logic services
│   │   ├── auth_service.py
│   │   ├── course_service.py
│   │   ├── assessment_service.py
│   │   ├── competency_service.py
│   │   ├── sync_service.py
│   │   └── pack_service.py
│   └── utils/                     # Utility helpers (file hashing, storage drivers)
│       ├── storage.py             # MinIO / Local FS storage provider
│       └── hasher.py              # SHA-256 and checksum verification
├── alembic/                       # Database migration scripts
├── tests/                         # Pytest automated test suites
├── Dockerfile
└── requirements.txt
```

### 9.2 Request Lifecycle & Security Middleware
1. **Request Ingestion:** Nginx / FastAPI CORS middleware validates origins.
2. **Authentication Middleware:** Extracts `Bearer <JWT>`, validates cryptographic signature, checks expiration, and queries revocation cache.
3. **Role-Based Authorization:** Custom dependency `require_role(["trainer", "admin"])` evaluates user role claims before invoking controllers.
4. **Service Layer Execution:** Controllers delegate business operations to dedicated services wrapped in SQLAlchemy transactional contexts.
5. **Response Serialization:** Output validated against strict Pydantic schemas, stripping sensitive fields (e.g., password hashes).

---

## 10. AI/ML ARCHITECTURE (INTELLIGENT CAPACITY BUILDING)

### 10.1 Mathematical & Algorithmic Foundation
The competency engine relies on **deterministic, explainable vector modeling** rather than opaque, heavy generative LLMs, ensuring fast execution even on low-power offline edge hardware.

#### A. Competency Vector Representation
Let $C = \{c_1, c_2, \dots, c_m\}$ be the universe of $m$ standardized domain competencies.
- **Trainee Current Profile:** Vector $\vec{T} = [t_1, t_2, \dots, t_m]$, where $t_i \in [0.0, 1.0]$ represents the trainee’s current verified proficiency in competency $c_i$.
- **Target Job-Role Requirement:** Vector $\vec{R} = [r_1, r_2, \dots, r_m]$, where $r_i \in [0.0, 1.0]$ is the minimum required proficiency for a specific role (e.g., "Senior Radar Meteorologist").
- **Course Competency Yield:** Vector $\vec{K} = [k_1, k_2, \dots, k_m]$, where $k_i \in [0.0, 1.0]$ denotes the gain in competency $c_i$ imparted by completing course $K$.

#### B. Skill Gap Formulation
The skill deficiency vector $\vec{G}$ is calculated via non-negative difference:
$$g_i = \max(0, r_i - t_i) \quad \forall i \in \{1, \dots, m\}$$
Total Skill Gap Magnitude:
$$Gap(\vec{T}, \vec{R}) = \sum_{i=1}^m w_i \cdot g_i$$
where $w_i$ is the operational criticality weight of competency $i$.

#### C. Course Recommendation Engine
Given skill deficiency vector $\vec{G}$, the recommendation engine computes the Cosine Similarity between $\vec{G}$ and each available course's yield vector $\vec{K}_j$:
$$Sim(\vec{G}, \vec{K}_j) = \frac{\vec{G} \cdot \vec{K}_j}{\|\vec{G}\|_2 \|\vec{K}_j\|_2} = \frac{\sum_{i=1}^m g_i \cdot k_{j,i}}{\sqrt{\sum_{i=1}^m g_i^2} \sqrt{\sum_{i=1}^m k_{j,i}^2}}$$
Courses are ranked in descending order of similarity, prioritizing courses that directly address the largest open gaps.

#### D. Trainer-Subject Matching Engine
Let a subject/course demand a competency profile $\vec{D}$. Each trainer $p$ has an expertise profile $\vec{E}_p$, verified years of experience $Y_p$, and a cumulative trainee satisfaction rating $S_p \in [1, 5]$.
The matching score $M(p, \vec{D})$ is defined as:
$$M(p, \vec{D}) = \alpha \cdot \text{CosineSim}(\vec{E}_p, \vec{D}) + \beta \cdot \min\left(1.0, \frac{Y_p}{15}\right) + \gamma \cdot \left(\frac{S_p}{5.0}\right)$$
Default calibrated weights: $\alpha = 0.60, \beta = 0.25, \gamma = 0.15$.
This formula guarantees that recommendations are 100% explainable, reproducible, and verifiable by administrative authorities.

---

## 11. OFFLINE ARCHITECTURE

### 11.1 Local Content Store & Cache Layout
On the Capacity Connect OS, all pedagogical assets reside in a structured, restricted filesystem directory:
```
/var/capacity-connect/
├── database/
│   └── capacity_connect_local.db       # SQLite database (WAL mode)
├── content_store/
│   ├── videos/                         # Stored by content hash (e.g., 4a7f...mp4)
│   ├── presentations/                  # Slide decks (PDF/PPTX)
│   ├── study_materials/                # Lecture notes & lab guides (PDF)
│   └── packages/                       # Downloaded / Imported .ccpack files
└── metadata/
    └── content_manifest.json           # Local catalog with SHA-256 signatures
```

### 11.2 Offline Operation Lifecycle
1. **Disconnected Execution:** When the system has no WAN access, the local FastAPI service directly serves courses, streams videos from `/var/capacity-connect/content_store/`, and renders assessments.
2. **Local Attempt Ledger:** When a trainee takes an MCQ assessment offline:
   - Quiz questions are loaded from the local SQLite store.
   - The countdown timer runs locally in the browser.
   - Upon submission, the local backend computes the score, generates a unique attempt UUIDv7, signs the attempt record with a local device secret, and stores it in `assessment_attempts`.
   - A corresponding `sync_queue` item is generated with action `CREATE_ATTEMPT` and status `PENDING`.
3. **Local Progress Persistence:** Video watch markers (seconds watched, percentage completed) write to `progress` and enqueue in `sync_queue` every 30 seconds.

---

## 12. SYNCHRONIZATION ARCHITECTURE

### 12.1 Bi-Directional Delta Synchronization Model
```
   LOCAL FIELD SYSTEM (Capacity Connect OS)                  CENTRAL SERVER
+--------------------------------------------+    HTTPS     +-----------------------------------+
| [sync_queue]                               |            |                                   |
| - ID: uuid-01 | Action: ATTEMPT_SUBMIT     | ---------> | POST /api/v1/sync/push            |
| - ID: uuid-02 | Action: PROGRESS_UPDATE    |   (Push)   | - Ingests batch in transaction    |
| - ID: uuid-03 | Action: FEEDBACK_SUBMIT    |            | - Deduplicates via event UUIDs    |
|                                            | <--------- | - Returns 200 OK + ACK list       |
| Marks items SYNCED or purges on ACK        |            +-----------------------------------+
|                                            |                                                |
| GET /api/v1/sync/pull?since=<last_pull_ts> | ---------> | GET /api/v1/sync/pull             |
|                                            |   (Pull)   | - Fetches delta updates:          |
| Ingests new courses, quizzes, bulletins    | <--------- |   new courses, resources, notices |
| Downloads referenced media files (checksum)|            +-----------------------------------+
+--------------------------------------------+
```

### 12.2 Sync Protocol Specification
- **Push Payload (`Local -> Central`):**
  - Sends batch of up to 50 pending `sync_queue` records.
  - Contains: `event_id` (UUID), `entity_type` (`attempt`, `progress`, `feedback`), `action` (`CREATE`, `UPDATE`), `payload_json`, `device_timestamp`, `client_signature`.
  - Central server verifies JWT, validates payload, commits to PostgreSQL, and returns list of accepted `event_id`s.
- **Pull Payload (`Central -> Local`):**
  - Local client passes `last_sync_timestamp` and station identifier.
  - Central server queries audit tables for records modified since `last_sync_timestamp`.
  - Returns delta JSON: new courses, revised questionnaires, global bulletins, certificate approvals.
  - Local client applies delta updates inside a local SQLite transaction and updates its `last_sync_timestamp`.
- **Media Asset Synchronization:**
  - Delta updates contain URLs and SHA-256 hashes of new media files.
  - Local sync daemon downloads files in chunks with background resume support.
  - Files are placed into `/var/capacity-connect/content_store/` only after passing SHA-256 checksum verification.
- **Conflict Handling Rules:**
  - **Assessment Attempts:** Immutable append-only. No conflicts possible.
  - **Learning Progress:** Monotonic progress rule: `max(local_progress, central_progress)`.
  - **Courseware & Content:** Central server is the authoritative source. Server content supersedes local edits if version conflict occurs.
  - **User Profile:** Last-Write-Wins based on ISO-8601 UTC timestamp.

---

## 13. LAN ARCHITECTURE (LOCAL LEARNING SERVER)

### 13.1 Field Classroom Scenario
In remote stations lacking internet where multiple trainees share a facility, a single machine running Capacity Connect OS can be switched to **LAN Server Mode**.

```
                           +-------------------------------------+
                           |      Capacity Connect OS Host       |
                           |   (IP: 192.168.4.1 / cc.local)      |
                           | - Wi-Fi Hotspot / Ethernet Switch   |
                           | - Local FastAPI + SQLite DB         |
                           | - Local Content Media Store         |
                           +------------------+------------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
          Wi-Fi / Ethernet LAN     Wi-Fi / Ethernet LAN     Wi-Fi / Ethernet LAN
                     |                        |                        |
                     v                        v                        v
            +-----------------+      +-----------------+      +-----------------+
            | Trainee Laptop  |      | Trainee Tablet  |      | Trainee Mobile  |
            | Browser opens:  |      | Browser opens:  |      | Browser opens:  |
            | http://cc.local |      | http://cc.local |      | http://cc.local |
            +-----------------+      +-----------------+      +-----------------+
```

### 13.2 Technical Implementation of LAN Mode
1. **Network Provisioning:** Built-in bash utility (`cc-lan-toggle on`) configures `dnsmasq` and `hostapd` (or binds to the existing local subnet switch).
2. **mDNS Discovery:** Advertises `capacityconnect.local` on port 80/443 via Avahi daemon.
3. **Multi-Tenant Local Sessions:** Multiple distinct trainees can log in simultaneously from different browser sessions.
4. **Central Sync Proxy:** When the host machine later connects to the internet, it pushes all accumulated test attempts from all LAN trainees in a single consolidated sync batch.

---

## 14. LINUX/OS ARCHITECTURE (CAPACITY CONNECT OS)

### 14.1 Base System & Customization Approach
- **Selected Foundation:** **Debian 12 / Ubuntu 24.04 LTS Mini Base** using `live-build` and `debootstrap` / `systemd`.
- **Display Manager:** Minimalist X11 server with Openbox / XFCE session launching Chromium in Kiosk (`--kiosk --app=http://localhost:8000`) or standard desktop mode.
- **Distraction-Free Environment:** Unnecessary consumer applications (games, multimedia chat, background telemetry) stripped out. Focused strictly on system utilities, network setup, and Capacity Connect.

### 14.2 Bootable USB Partition Structure
A 32GB+ USB flash drive is partitioned as follows:
```
+-----------------------------------------------------------------------------------------------+
| Partition 1: EFI System Partition (ESP) | FAT32 | 512 MB | GRUB2 EFI Bootloader               |
+-----------------------------------------------------------------------------------------------+
| Partition 2: Read-Only System Root (ISO)| ISO9660 / SquashFS | 4.0 GB | Base OS & Runtime     |
+-----------------------------------------------------------------------------------------------+
| Partition 3: Persistent Data Partition   | Ext4  | Remainder | Label: "casper-rw"              |
|  - Holds /var/capacity-connect (SQLite DB, Videos, PDFs, Sync Queue)                          |
|  - Retains all user progress and downloaded packages across reboots and PC changes            |
+-----------------------------------------------------------------------------------------------+
```

### 14.3 System Services (systemd Units)
1. `capacity-connect-backend.service`: Runs the local FastAPI server via Uvicorn on port 8000.
2. `capacity-connect-sync.service`: Runs the background connectivity detection and sync daemon.
3. `capacity-connect-kiosk.service`: Manages the fullscreen Chromium browser session.

---

## 15. DATABASE ER DESIGN

### 15.1 Core Entity Relationships
```
[User] 1 ──── 1 [TraineeProfile] 1 ──── * [Qualification]
  |       │                  1 ──── * [WorkExperience]
  |       │                  1 ──── * [Skill]
  |       │                  1 ──── * [Interest]
  |       │                  1 ──── * [Certificate]
  |       │                  1 ──── * [TraineeCompetency]
  |       │
  |       └─── 1 [TrainerProfile] 1 ──── * [TrainerExpertise]
  |                              1 ──── * [TrainerLibrary]
  |
  ├─── * [Course] (Created by Trainer)
  │        │
  │        ├─── * [CourseModule] 1 ──── * [Lesson] 1 ──── * [LearningResource]
  │        ├─── * [CourseEnrollment] * ──── 1 [User/Trainee]
  │        ├─── * [CourseProgress]   * ──── 1 [User/Trainee]
  │        ├─── * [CourseFeedback]   * ──── 1 [User/Trainee]
  │        └─── * [CourseCompetency] * ──── 1 [Competency]
  │
  ├─── * [Assessment] (Created by Trainer/Admin)
  │        │
  │        ├─── * [Question] (MCQs with options and scoring)
  │        └─── * [AssessmentAttempt] 1 ──── * [AssessmentAnswer]
  │                   *
  │                   │
  │                   1 [User/Trainee]
  │
  ├─── * [Notification] ─── (Global or targeted to User)
  ├─── * [Announcement] ─── (Public / Portal-wide)
  ├─── * [Achievement]  ─── (Recognitions & Milestones)
  └─── * [SyncQueue]     ─── (Local & Central audit change logs)
```

---

## 16. COMPLETE DATABASE SCHEMA

### 16.1 Central PostgreSQL 16 DDL (Standardized & Production-Grade)
```sql
-- CAPACITY CONNECT: Central PostgreSQL Schema
-- Version: 1.0.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES 
('trainee', 'Trainee learner role'),
('trainer', 'Trainer and subject-matter expert role'),
('admin', 'System and operational administrator role');

-- 2. Users Table
CREATE TABLE users (
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role_id ON users(role_id);

-- 3. Trainee Profiles & Nested Details
CREATE TABLE trainee_profiles (
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

CREATE TABLE qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    degree VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(150) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    passing_year INTEGER NOT NULL,
    grade_or_percentage VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_experiences (
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

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_profile_id UUID NOT NULL REFERENCES trainee_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates (
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
CREATE TABLE trainer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(100),
    division VARCHAR(100),
    years_of_experience NUMERIC(4,1) DEFAULT 0.0,
    biography TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trainer_expertise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_profile_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'expert' CHECK (proficiency_level IN ('intermediate', 'advanced', 'expert')),
    years_in_subject NUMERIC(4,1) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trainer_library (
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

-- 5. Courses, Modules, Lessons, and Resources
CREATE TABLE courses (
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

CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_text TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_resources (
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

CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'dropped')),
    UNIQUE(user_id, course_id)
);

CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    watch_time_seconds INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- 6. Assessments, Questions, Attempts, and Answers
CREATE TABLE assessments (
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

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false')),
    options_json JSONB NOT NULL, -- e.g. [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}]
    correct_option VARCHAR(10) NOT NULL, -- "A", "B", etc.
    explanation TEXT,
    marks NUMERIC(4,2) DEFAULT 1.0,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    score_obtained NUMERIC(5,2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT FALSE,
    attempt_status VARCHAR(50) DEFAULT 'completed' CHECK (attempt_status IN ('in_progress', 'completed', 'timed_out')),
    attempt_signature VARCHAR(128), -- SHA-256 HMAC for anti-tamper verification
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10),
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded NUMERIC(4,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Competency Mapping
CREATE TABLE competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    domain VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trainee_competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    proficiency_level NUMERIC(3,2) DEFAULT 0.00 CHECK (proficiency_level BETWEEN 0.00 AND 1.00),
    last_evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, competency_id)
);

CREATE TABLE course_competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    yield_level NUMERIC(3,2) DEFAULT 0.50 CHECK (yield_level BETWEEN 0.00 AND 1.00),
    UNIQUE(course_id, competency_id)
);

-- 8. Bulletins, Announcements, Achievements, and Feedback
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    published_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_featured_on_homepage BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL indicates global broadcast
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    badge_icon_url VARCHAR(500),
    awarded_date DATE DEFAULT CURRENT_DATE,
    is_displayed_on_homepage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- 9. Synchronization Queue & Content Packs
CREATE TABLE sync_queue (
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

CREATE TABLE sync_audit_log (
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

CREATE TABLE content_packs (
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
```

### 16.2 Offline SQLite Schema
The local SQLite schema provides the exact mirror of entities required for offline learning, replacing PostgreSQL-specific UUID extensions with text-based UUIDs, and JSONB with TEXT:
- `users` (cached approved accounts for local authentication)
- `courses`, `course_modules`, `lessons`, `learning_resources`
- `assessments`, `questions`
- `assessment_attempts`, `assessment_answers`
- `progress`, `course_enrollments`, `course_feedback`
- `competencies`, `trainee_competencies`
- `announcements`, `notifications`, `achievements`
- `sync_queue` (primary local outbound mutation log)

---

## 17. API ARCHITECTURE

### 17.1 API Design Principles
- **Base URI:** `/api/v1`
- **Protocol:** RESTful with JSON bodies and standard HTTP status codes:
  - `200 OK`: Successful retrieval or synchronous update.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Validation error in payload.
  - `401 Unauthorized`: Missing or invalid JWT.
  - `403 Forbidden`: Insufficient role permissions.
  - `404 Not Found`: Resource does not exist.
  - `409 Conflict`: Unique constraint violation or duplicate sync event.
  - `500 Internal Server Error`: Server exception.
- **Authentication Header:** `Authorization: Bearer <access_token>`

---

## 18. API NAMING CONVENTIONS

All API routes strictly follow REST resource naming conventions with plural nouns and kebab-case URLs:

### 18.1 Authentication & Profile Endpoints
- `POST /api/v1/auth/signup` - Register a new user account
- `POST /api/v1/auth/login` - Authenticate credentials and issue JWT tokens
- `POST /api/v1/auth/refresh` - Rotate and issue new access token
- `GET /api/v1/auth/me` - Get current authenticated user details
- `PUT /api/v1/trainee/profile` - Update trainee profile
- `POST /api/v1/trainee/qualifications` - Add academic qualification
- `POST /api/v1/trainee/work-experiences` - Add work experience
- `POST /api/v1/trainee/skills` - Add skill with proficiency level
- `POST /api/v1/trainee/interests` - Add meteorological domain interest
- `POST /api/v1/trainee/certificates` - Upload / register certificate

### 18.2 Trainer Endpoints
- `GET /api/v1/trainer/profile` - View trainer profile and verified expertise
- `PUT /api/v1/trainer/profile` - Update bio and expertise
- `POST /api/v1/trainer/courses` - Create a new course
- `PUT /api/v1/trainer/courses/{course_id}` - Edit course details
- `POST /api/v1/trainer/courses/{course_id}/modules` - Add module to course
- `POST /api/v1/trainer/modules/{module_id}/lessons` - Add lesson to module
- `POST /api/v1/trainer/resources/upload` - Upload video, presentation, or study note
- `GET /api/v1/trainer/library` - Retrieve trainer's personal content library
- `POST /api/v1/trainer/library/publish` - Publish library resource to course
- `GET /api/v1/trainer/analytics/courses/{course_id}` - View trainee progress and scores

### 18.3 Course & Learning Endpoints
- `GET /api/v1/courses` - List published courses (filterable by category/level)
- `GET /api/v1/courses/{course_id}` - Get full course syllabus and lessons
- `POST /api/v1/courses/{course_id}/enroll` - Enroll current trainee in course
- `GET /api/v1/courses/{course_id}/progress` - Get current trainee's course progress
- `POST /api/v1/courses/{course_id}/progress` - Update lesson progress/watch-time
- `POST /api/v1/courses/{course_id}/feedback` - Submit course rating and feedback

### 18.4 Assessment Endpoints
- `GET /api/v1/assessments` - List available assessments
- `GET /api/v1/assessments/{assessment_id}` - Get assessment metadata
- `POST /api/v1/assessments` - Create assessment (Trainer/Admin)
- `POST /api/v1/assessments/{assessment_id}/questions` - Add MCQ questions
- `POST /api/v1/assessments/{assessment_id}/start` - Begin quiz attempt (returns questions)
- `POST /api/v1/assessments/{assessment_id}/submit` - Submit answers and calculate score
- `GET /api/v1/assessments/{assessment_id}/attempts/{attempt_id}` - View detailed attempt report

### 18.5 Competency & AI Endpoints
- `GET /api/v1/competency/taxonomy` - Retrieve global competency catalog
- `GET /api/v1/competency/trainee/{user_id}/matrix` - Retrieve trainee competency spider chart data
- `GET /api/v1/competency/gaps` - Calculate trainee skill gaps against target job role
- `GET /api/v1/competency/recommendations/courses` - AI-recommended courses based on skill gaps
- `POST /api/v1/competency/match-trainer` - Recommend optimal trainers for a given subject

### 18.6 Admin Endpoints
- `GET /api/v1/admin/users/pending` - List pending user approvals
- `POST /api/v1/admin/users/{user_id}/approve` - Approve user account
- `POST /api/v1/admin/users/{user_id}/reject` - Reject user account
- `PUT /api/v1/admin/users/{user_id}/role` - Modify user role
- `GET /api/v1/admin/analytics/overview` - Portal-wide metrics (users, courses, completions)
- `POST /api/v1/admin/announcements` - Create portal announcement
- `POST /api/v1/admin/achievements` - Award or publish achievement
- `GET /api/v1/admin/sync/audit-logs` - Inspect distributed station sync logs

### 18.7 Offline & Synchronization Endpoints
- `POST /api/v1/sync/push` - Ingest batch of local offline changes to central server
- `GET /api/v1/sync/pull` - Retrieve delta changes modified since timestamp
- `GET /api/v1/sync/status` - Health check and pending queue stats
- `POST /api/v1/packs/export` - Export curated course pack (`.ccpack`)
- `POST /api/v1/packs/import` - Import and unpack `.ccpack` into local storage

---

## 19. FOLDER STRUCTURE

The canonical project repository structure is strictly fixed as follows:

```
capacity-connect/
│
├── README.md
├── PROJECT_BLUEPRINT.md
├── ARCHITECTURE.md
├── DATABASE_SCHEMA.md
├── API_CONTRACT.md
├── NAMING_CONVENTIONS.md
├── DEVELOPMENT_STATUS.md
├── CHANGELOG.md
├── .gitignore
├── docker-compose.yml
├── docker-compose.dev.yml
│
├── backend/                        # Central & Local FastAPI Backend Service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py
│       ├── core/
│       ├── models/
│       ├── schemas/
│       ├── api/
│       ├── services/
│       └── utils/
│
├── frontend/                       # Single Page Web Client (React + Vite + Tailwind)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── public/
│   └── src/
│
├── ai_engine/                      # Scikit-learn Competency & Matching Engine
│   ├── __init__.py
│   ├── competency_gap.py
│   ├── course_recommender.py
│   ├── trainer_matcher.py
│   └── models/
│
├── offline/                        # Offline Daemon & Pack Management
│   ├── sync_daemon.py
│   ├── sync_worker.py
│   ├── pack_bundler.py
│   └── pack_installer.py
│
├── os/                             # Capacity Connect OS Customization & Live USB
│   ├── build_iso.sh
│   ├── configs/
│   │   ├── systemd/
│   │   ├── x11/
│   │   └── kiosk/
│   ├── scripts/
│   │   ├── cc_lan_toggle.sh
│   │   └── usb_persist_setup.sh
│   └── isolinux/
│
├── database/                       # Migrations, DDL scripts, & Seed Data
│   ├── central_postgres.sql
│   ├── local_sqlite.sql
│   └── seed_data/
│       ├── 01_roles.sql
│       ├── 02_competencies.sql
│       └── 03_demo_courses.sql
│
├── tests/                          # Automated Pytest and Vitest Suites
│   ├── backend/
│   ├── frontend/
│   ├── sync/
│   └── ai_engine/
│
├── docs/                           # Architecture, Deployment, & Manuals
│   ├── architecture/
│   ├── user_guides/
│   └── api/
│
├── scripts/                        # Automation & Devops Helpers
│   ├── setup_dev.sh
│   ├── run_tests.sh
│   └── build_all.sh
│
└── deployment/                     # Production Deployment Configurations
    ├── nginx/
    │   └── default.conf
    └── systemd/
```

---

## 20. NAMING CONVENTIONS

Strict adherence to this canonical dictionary is mandatory across all code, schemas, and endpoints:

| Domain Concept | Database Table | Python/Pydantic Class | API Path Fragment | Frontend Type/Interface |
|---|---|---|---|---|
| User | `users` | `User` | `/users` | `User` |
| Role | `roles` | `Role` | `/roles` | `Role` |
| Trainee Profile | `trainee_profiles`| `TraineeProfile` | `/trainee/profile`| `TraineeProfile` |
| Qualification | `qualifications` | `Qualification` | `/qualifications` | `Qualification` |
| Work Experience | `work_experiences`| `WorkExperience` | `/work-experiences`| `WorkExperience` |
| Skill | `skills` | `Skill` | `/skills` | `Skill` |
| Interest | `interests` | `Interest` | `/interests` | `Interest` |
| Certificate | `certificates` | `Certificate` | `/certificates` | `Certificate` |
| Trainer Profile | `trainer_profiles`| `TrainerProfile` | `/trainer/profile`| `TrainerProfile` |
| Trainer Expertise| `trainer_expertise`| `TrainerExpertise`| `/trainer/expertise`| `TrainerExpertise` |
| Trainer Library | `trainer_library` | `TrainerLibrary` | `/trainer/library`| `TrainerLibrary` |
| Course | `courses` | `Course` | `/courses` | `Course` |
| Course Module | `course_modules` | `CourseModule` | `/modules` | `CourseModule` |
| Lesson | `lessons` | `Lesson` | `/lessons` | `Lesson` |
| Learning Resource| `learning_resources`| `LearningResource`| `/resources` | `LearningResource` |
| Enrollment | `course_enrollments`| `CourseEnrollment`| `/enroll` | `CourseEnrollment` |
| Progress | `progress` | `Progress` | `/progress` | `Progress` |
| Assessment | `assessments` | `Assessment` | `/assessments` | `Assessment` |
| Question | `questions` | `Question` | `/questions` | `Question` |
| Assessment Attempt| `assessment_attempts`| `AssessmentAttempt`| `/attempts` | `AssessmentAttempt` |
| Assessment Answer| `assessment_answers`| `AssessmentAnswer`| `/answers` | `AssessmentAnswer` |
| Competency | `competencies` | `Competency` | `/competency` | `Competency` |
| Trainee Competency| `trainee_competencies`| `TraineeCompetency`| `/trainee-competencies`| `TraineeCompetency` |
| Course Competency| `course_competencies`| `CourseCompetency`| `/course-competencies`| `CourseCompetency` |
| Notification | `notifications` | `Notification` | `/notifications` | `Notification` |
| Announcement | `announcements` | `Announcement` | `/announcements` | `Announcement` |
| Achievement | `achievements` | `Achievement` | `/achievements` | `Achievement` |
| Course Feedback | `course_feedback` | `CourseFeedback` | `/feedback` | `CourseFeedback` |
| Sync Queue | `sync_queue` | `SyncQueue` | `/sync/queue` | `SyncQueueItem` |
| Content Pack | `content_packs` | `ContentPack` | `/packs` | `ContentPack` |

---

## 21. SECURITY ARCHITECTURE

### 21.1 Core Security Tenets
1. **Password Hashing:** Passwords hashed with `bcrypt` (work factor 12) with unique per-user cryptographically random salts. Plaintext passwords are never logged or stored.
2. **JWT Security:** Stateless access tokens signed with `RS256` or `HS256` (256-bit secret key). Access tokens expire after 60 minutes; refresh tokens expire after 30 days and are tracked in database revocation tables.
3. **Role-Based Access Control (RBAC):** Every non-public API endpoint is protected by declarative FastAPI dependency guards (`require_role(["trainer", "admin"])`).
4. **Offline Tamper Resistance:**
   - Offline quiz attempts are hashed using HMAC-SHA-256 with a machine-bound hardware key.
   - When attempts are synchronized to the central server, the central backend verifies the signature before accepting the score.
5. **Input Sanitation & Injection Defense:**
   - SQLAlchemy ORM parameterizes all database queries, eliminating SQL injection vectors.
   - Pydantic v2 schemas reject unexpected payload fields.
   - React automatically escapes rendered strings, mitigating Stored and Reflected XSS.
6. **File Upload Hardening:**
   - Uploaded files are checked against allowed MIME types and magic byte headers (`video/mp4`, `application/pdf`).
   - File extensions are normalized; filenames are renamed using UUIDs to prevent directory traversal (`../../etc/passwd`).

---

## 22. TESTING STRATEGY

### 22.1 Multi-Layered Quality Assurance Plan
```
+-------------------------------------------------------------+
|                      E2E System Tests                       |
|  - Full user journeys (Signup -> Approval -> Learn -> Test) |
|  - Complete Offline -> Sync -> Verification Cycle           |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                     Integration Tests                       |
|  - API endpoint contracts & status codes                    |
|  - PostgreSQL & SQLite transaction integrity                |
|  - Delta Sync Push & Pull batch processing                  |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                        Unit Tests                           |
|  - Password hashing & JWT verification logic                |
|  - Competency gap & cosine similarity calculations          |
|  - Pydantic schema validation & serialization               |
+-------------------------------------------------------------+
```

### 22.2 Mandatory Test Scenarios
1. **Dual DB Concurrency:** Verify identical API behaviors across PostgreSQL (central) and SQLite (offline).
2. **Network Interruption Simulation:** Disconnect socket midway through a 50-item sync push; verify zero duplicate records and successful retry resumption.
3. **Idempotent Sync Verification:** Send identical batch payloads multiple times; verify HTTP 200/409 without state duplication.
4. **Admin Approval Gate:** Verify that unapproved trainee accounts receive HTTP 403 when attempting course enrollment or quiz attempts.
5. **Competency Engine Explainability:** Verify that a known skill deficiency vector deterministically yields the exact expected course recommendation ranking.

---

## 23. DEPLOYMENT ARCHITECTURE

### 23.1 Production Central Cloud Deployment
- **Container Orchestration:** Docker Compose / Kubernetes ready.
- **Reverse Proxy:** Nginx terminating TLS 1.3 with Let’s Encrypt certificates, proxying `/api` to FastAPI Uvicorn workers and serving static frontend assets.
- **Database:** Managed PostgreSQL 16 container with persistent named volume, daily automated pg_dump backups, and connection pooling.
- **Media Storage:** MinIO S3-compatible object storage container with private bucket policies for protected lecture videos and public read for thumbnails.

### 23.2 Field & USB Deployment
- **Custom ISO / Live USB:** Built via Debian `live-build`.
- **System Service Auto-Start:** Uvicorn and Chromium start automatically upon boot; system lands directly on the Capacity Connect portal in under 30 seconds.

---

## 24. GIT STRATEGY

### 24.1 Branching & Commit Conventions
- **Main Branch:** `main` (Strictly contains working, tested, production-grade releases).
- **Milestone Branches:** `phase-01-foundation`, `phase-02-authentication`, ..., `phase-14-deployment`.
- **Commit Message Standard:**
  - `feat(phase-02): implement jwt auth and user approval flow`
  - `fix(sync): resolve race condition in offline queue batch commit`
  - `docs(blueprint): finalize master technical specification`
  - `test(assessment): add unit tests for automated mcq grading`

---

## 25. DEVELOPMENT PHASES

| Phase | Phase Name | Objective | Primary Deliverables | Status |
|---|---|---|---|---|
| **Phase 0** | **Blueprint & Architecture** | Complete requirements freeze, canonical architecture, schemas, API contracts. | Master Blueprint, DB Schema, API Contract, Naming Conventions, Roadmap. | **COMPLETED** |
| **Phase 1** | **Project Foundation** | Repository layout, Docker Compose, FastAPI foundation, React + Vite scaffolding. | Docker setup, backend core, frontend root, CI pipeline. | PENDING |
| **Phase 2** | **Authentication & RBAC** | Secure signup, login, JWT issuance, admin approval workflow, role guards. | Auth endpoints, login/signup UI, approval queue. | PENDING |
| **Phase 3** | **Trainee Module** | Trainee profile, qualifications, experience, skills, interests, dashboard. | Profile editor, skill matrix, trainee home UI. | PENDING |
| **Phase 4** | **Trainer Module** | Trainer profile, expertise, course creator, trainer library, resource uploader. | Course studio, library manager, analytics view. | PENDING |
| **Phase 5** | **Learning Management** | Course catalog, modules, video player, presentation viewer, progress tracker. | Course viewer, media streaming, enrollment logic. | PENDING |
| **Phase 6** | **Assessment System** | Subject-wise MCQs, question builder, timed quiz runner, automated scoring. | Assessment engine, quiz UI, score reports. | PENDING |
| **Phase 7** | **Admin Dashboard** | Approvals, user roles, course audit, announcements, achievements, homepage CMS. | Admin console, bulletin manager, analytics. | PENDING |
| **Phase 8** | **Competency & AI Matching**| Competency models, skill-gap analysis, course recommender, trainer matcher. | AI algorithms, radar charts, gap dashboard. | PENDING |
| **Phase 9** | **Offline Architecture** | SQLite integration, local content store, offline UI, offline assessment engine. | Local database layer, offline playback. | PENDING |
| **Phase 10** | **Synchronization Engine** | Sync queue, push/pull delta handlers, conflict resolution, sync daemon. | Sync engine, retry worker, UI sync status. | PENDING |
| **Phase 11** | **Capacity Connect OS** | Linux base configuration, live-build recipe, kiosk mode, bootable USB guide. | OS scripts, systemd units, USB persistence guide. | PENDING |
| **Phase 12** | **LAN Learning Mode** | Local hotspot server setup, mDNS resolution, multi-device offline classroom. | LAN toggle script, multi-user local test. | PENDING |
| **Phase 13** | **Security & Testing** | Comprehensive Pytest suite, E2E sync testing, security hardening, audit logs. | Automated test suites, vulnerability audit. | PENDING |
| **Phase 14** | **Deployment & SIH Demo** | Production Docker compose, demo dataset, walkthrough video, jury presentation. | Live deployment, sample IMD data, pitch deck. | PENDING |

---

## 26. PHASE DEPENDENCIES

```
Phase 0 (Blueprint & Architecture)
   │
   ▼
Phase 1 (Project Foundation: Docker, FastAPI, React)
   │
   ▼
Phase 2 (Authentication & RBAC, Admin Approval)
   │
   ├───────────────────────────┬───────────────────────────┐
   ▼                           ▼                           ▼
Phase 3 (Trainee Module)    Phase 4 (Trainer Module)    Phase 7 (Admin Dashboard)
   │                           │                           │
   └─────────────┬─────────────┘                           │
                 ▼                                         │
          Phase 5 (Learning Management)                     │
                 │                                         │
                 ▼                                         │
          Phase 6 (Assessment System)                      │
                 │                                         │
                 ▼                                         │
          Phase 8 (Competency & AI Matching)               │
                 │                                         │
                 ├─────────────────────────────────────────┘
                 ▼
          Phase 9 (Offline Architecture & SQLite)
                 │
                 ▼
          Phase 10 (Synchronization Engine)
                 │
                 ├─────────────────────────────┐
                 ▼                             ▼
          Phase 11 (Capacity Connect OS)  Phase 12 (LAN Learning Mode)
                 │                             │
                 └─────────────┬───────────────┘
                               ▼
                        Phase 13 (Security, Testing & Optimization)
                               │
                               ▼
                        Phase 14 (Deployment & SIH Demo)
```

---

## 27. ACCEPTANCE CRITERIA

Every phase must satisfy strict acceptance criteria before transition:
1. **Zero Placeholder Code:** All functions, endpoints, and components must be fully implemented and runnable.
2. **Contract Consistency:** Schema field names, API paths, and frontend models must match the Canonical Naming Dictionary with 100% precision.
3. **Automated Test Coverage:** Every newly introduced API endpoint must have automated test cases verifying success (200/201), validation failure (400/422), and unauthorized access (401/403).
4. **Documentation Sync:** `CHANGELOG.md` and `DEVELOPMENT_STATUS.md` must be updated to reflect exact changes.

---

## 28. SIH DEMONSTRATION WORKFLOW

The final hackathon demonstration to jury members will follow this structured 6-act flow:
1. **Act 1: Administrative Governance & MoES/IMD Portal Overview:**
   - Admin logs into central portal; reviews pending trainee/trainer signups; approves users with role assignments.
   - Demonstrates published announcements and meteorological bulletins on the public homepage.
2. **Act 2: Trainer Course Creation & Library Delegation:**
   - Trainer uploads a specialized course: "Advanced Radar Meteorology & Cyclone Tracking".
   - Uploads lecture video, presentation PDF, and study notes; creates a 10-question MCQ assessment with a 15-minute deadline.
3. **Act 3: Trainee Competency Discovery & Learning:**
   - Trainee logs in, views their competency radar chart, and identifies a critical skill gap in "Doppler Radar Interpretation".
   - AI recommendation engine suggests the newly created course; trainee enrolls and watches the lecture.
4. **Act 4: The Offline Field Simulation (The Core SIH Innovation):**
   - Presenter physically disconnects the ethernet/Wi-Fi cable (or switches system to airplane mode).
   - Capacity Connect OS boots from a Live USB on a standalone field laptop.
   - Trainee logs into the local system, watches the pre-loaded Doppler Radar lecture, reads the PDF, and takes the MCQ assessment.
   - Local grading engine instantly calculates score (e.g., 90%), updates the offline progress bar, and seals the result in the local tamper-resistant ledger.
5. **Act 5: Automatic Synchronization Re-Establishment:**
   - Presenter reconnects the network cable.
   - Sync status bar animates from "Offline" to "Syncing..." to "Synced".
   - Presenter switches to the central cloud admin monitor: the new test score, progress percentage, and updated competency vector are instantly reflected on the central server!
6. **Act 6: LAN Classroom Server Showcase:**
   - Host machine enables LAN Mode; two adjacent mobile phones connect via Wi-Fi to `http://capacityconnect.local` without central internet and take quizzes concurrently.

---

## 29. RISKS AND MITIGATIONS

| Risk Factor | Probability | Impact | Mitigation Strategy |
|---|---|---|---|
| **Network Flapping during Sync** | High | High | Sync mutations use idempotent UUIDs; partial batch failures rollback cleanly and resume from last acknowledged cursor. |
| **USB Flash Drive Corruption** | Medium | High | Use Ext4 journaling on the persistent partition with graceful sync flushing before unmount; store daily SQLite backups. |
| **Inconsistent Schema Evolution**| Low | Critical | Alembic migrations checked into source control; strict schema freeze enforced by Master Blueprint. |
| **Low-End Hardware Bottlenecks**| Medium | Medium | Fast, lightweight stack (FastAPI + SQLite + Tailwind); no heavy runtime LLMs; client-side video decoding. |
| **Air-Gapped Content Delivery** | Medium | Medium | Evaluated and approved Feature 2: Encrypted `.ccpack` bundles allow manual import/export without network connectivity. |

---

## 30. FINAL PROJECT SCOPE & FREEZE STATEMENT

### 30.1 Project Scope Boundary
The finalized scope encompasses:
- Full central portal with Trainee, Trainer, and Admin roles.
- Complete courseware delivery (video, presentation, study documents, assessments).
- Deterministic AI competency gap and trainer recommendation engine.
- Complete offline capability via SQLite and local content store.
- Robust two-way synchronization engine with conflict resolution.
- Capacity Connect OS customization recipes and Live USB documentation.
- LAN Learning Server mode.

**Out-of-Scope (Excluded):**
- Complex real-time generative video synthesis or cloud LLM chat bots.
- Third-party commercial payment gateways (not required for MoES/IMD internal capacity building).
- Proprietary proprietary hardware design (standard commodity x86_64 PCs and USB flash drives are used).

### 30.2 REQUIREMENTS FREEZE
By order of the Senior Software Architect and Project Engineering Team:
**THE MASTER PROJECT BLUEPRINT IS HEREBY FROZEN.**
No architectural changes, technology additions, or naming deviations may be introduced without formal review and approval.

---
`PROJECT STATUS: BLUEPRINT READY`
