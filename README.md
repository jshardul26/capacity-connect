# CAPACITY CONNECT
### A Digital Capacity Building and Learning Management Portal
**Smart India Hackathon (SIH) — Problem Statement ID:** 26075  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Category:** Software | **Theme:** Smart Education  
**Project Status:** `BLUEPRINT READY` (Phase 0 Complete & Requirements Frozen)

---

## 📌 Overview

**Capacity Connect** is an enterprise-grade, offline-first educational and organizational capacity-building ecosystem designed specifically for the India Meteorological Department (IMD) under the Ministry of Earth Sciences (MoES), Government of India.

IMD personnel stationed at hundreds of remote coastal radar stations, seismological centers, high-altitude mountain observatories, and offshore platforms frequently operate under extreme conditions with intermittent or zero internet connectivity. Capacity Connect bridges this critical gap by delivering a dual-mode learning architecture:
1. **Central Capacity Connect Cloud:** Modern web portal for course authoring, trainee progress monitoring, admin governance, and an explainable AI competency mapping and trainer matching engine.
2. **Capacity Connect OS & Bootable USB:** A tailored, lightweight, distraction-free Linux environment capable of running directly from a persistent bootable USB flash drive on standard x86_64 PCs without installation.
3. **Offline Learning & Assessment Engine:** Trainees watch downloaded video lectures, study presentations and notes, and take timed MCQ assessments with instant automated scoring and cryptographic tamper-proof attempt ledgers completely offline.
4. **Bi-directional Delta Synchronization:** Seamless background sync that automatically pushes completed quiz attempts, scores, and feedback to the central server and pulls newly published courses and bulletins whenever connectivity returns.
5. **LAN Learning Server Mode:** Enables a single field machine to act as a local classroom hub over ad-hoc Wi-Fi or Ethernet, allowing up to 30 nearby trainee devices to access courses and submit assessments without central internet.

---

## 🏛 Canonical Project Documentation (Single Source of Truth)

All contributors, engineers, and AI coding agents must reference these canonical specifications:

- 📘 [**PROJECT_BLUEPRINT.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/PROJECT_BLUEPRINT.md) — The Master Technical Blueprint containing all 30 foundational sections.
- 📐 [**ARCHITECTURE.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/ARCHITECTURE.md) — System topology, offline sync engine, LAN mode, and security design.
- 🗄 [**DATABASE_SCHEMA.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/DATABASE_SCHEMA.md) — Complete PostgreSQL 16 (Central) and SQLite (Offline) DDL and ER model.
- 🔌 [**API_CONTRACT.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/API_CONTRACT.md) — Canonical REST API endpoints, request/response models, and status codes.
- 📖 [**NAMING_CONVENTIONS.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/NAMING_CONVENTIONS.md) — Universal naming dictionary across DB, API, models, and UI.
- 📊 [**DEVELOPMENT_STATUS.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/DEVELOPMENT_STATUS.md) — Active phase registry and multi-AI continuity protocol.
- 📜 [**CHANGELOG.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/CHANGELOG.md) — Chronological log of changes and phase completions.

---

## 🛠 Technology Stack

| Layer | Technologies Selected |
|---|---|
| **Frontend** | React 18+, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Lucide React |
| **Backend API** | Python 3.11+, FastAPI (Central & Local Offline), Pydantic v2 |
| **Database** | PostgreSQL 16 (Central Server) & SQLite with WAL mode (Local Offline Node) |
| **ORM & Migrations** | SQLAlchemy 2.0 (async), Alembic |
| **AI / Machine Learning** | scikit-learn, NumPy (Vector Cosine Similarity for Competency Mapping & Trainer Matching) |
| **Storage** | MinIO (Central S3-compatible Object Store) & Local Checksummed Filesystem Store |
| **Operating System** | Custom Debian 12 / Ubuntu 24.04 LTS Mini Base, Openbox/XFCE, Chromium Kiosk Mode |
| **DevOps & Containers** | Docker, Docker Compose, Nginx, Pytest, Vitest |

---

## 👥 Three Core User Roles

1. **Trainee:** Create professional profile, add qualifications, experience, skills, interests, and certificates; browse and enroll in courses; stream videos and read PDFs; take subject-wise timed MCQ assessments; submit training feedback; track competency growth via radar charts.
2. **Trainer:** Manage profile and domain expertise; build courses, modules, and lessons; upload lecture videos and study materials; manage personal trainer library; create MCQ questionnaires and set deadlines; monitor trainee participation and performance analytics.
3. **Admin:** Review and approve new user signups; manage user roles; monitor courses, enrollments, certifications, and assessments; publish announcements, notifications, and achievements to the portal homepage; audit synchronization logs from distributed stations.

---

## 🚀 Development Roadmap (Phases 0 to 14)

- [x] **Phase 0: Blueprint & Architecture** *(Completed & Frozen)*
- [ ] **Phase 1: Project Foundation** *(Docker Compose, FastAPI, React scaffolding)*
- [ ] **Phase 2: Authentication & RBAC** *(JWT, bcrypt, Admin Approval Workflow)*
- [ ] **Phase 3: Trainee Module** *(Profile, Qualifications, Skills, Dashboard)*
- [ ] **Phase 4: Trainer Module** *(Studio, Course Creator, Trainer Library, Analytics)*
- [ ] **Phase 5: Learning Management** *(Course Delivery, Video Streaming, Progress, Feedback)*
- [ ] **Phase 6: Assessment System** *(MCQ Engine, Timers, Automated Grading, Score Reports)*
- [ ] **Phase 7: Admin Dashboard** *(Approvals, Role Governance, Homepage Bulletins, Audit)*
- [ ] **Phase 8: Competency & AI Matching** *(Skill-Gap Analysis, Recommender, Radar Charts)*
- [ ] **Phase 9: Offline Architecture** *(SQLite WAL Mode, Local Content Store, Disconnected Mode)*
- [ ] **Phase 10: Synchronization Engine** *(Sync Queue, Delta Push/Pull, Conflict Resolution)*
- [ ] **Phase 11: Capacity Connect OS** *(Linux Customization, Systemd, Bootable Live USB)*
- [ ] **Phase 12: LAN Learning Mode** *(Local Classroom Hotspot Server, mDNS Discovery)*
- [ ] **Phase 13: Security, Testing & Optimization** *(E2E Test Suites, Security Audit)*
- [ ] **Phase 14: Deployment & SIH Demo** *(Production Deploy, IMD Dataset, Final Presentation)*

---

## 🔒 Multi-AI Continuity Notice
All architectural specifications and naming contracts are strictly frozen in [**PROJECT_BLUEPRINT.md**](file:///c:/Users/Lenovo/Desktop/capacity-connect/PROJECT_BLUEPRINT.md). No agent may alter database fields, endpoints, or directory structure without formal review.
