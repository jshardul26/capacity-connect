# CHANGELOG — CAPACITY CONNECT
All notable changes and phase milestones for the Capacity Connect project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]
- Phase 2: Authentication & RBAC (Signup, Login, JWT, Admin Approval, Role Guards)

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
