# CHANGELOG — CAPACITY CONNECT
All notable changes and phase milestones for the Capacity Connect project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]
- Phase 1: Project Foundation (Docker, Backend, Frontend, Database)

---

## [0.1.0] - 2026-09-08
### Added (Phase 0 — Blueprint & Architecture Complete)
- **Master Project Blueprint (`PROJECT_BLUEPRINT.md`):** Complete 30-section frozen master technical specification covering MoES/IMD SIH problem statement 26075, requirements, modular monolith architecture, offline-first ecosystem, Capacity Connect OS, bootable USB, LAN learning server, scikit-learn competency engine, dual database design, API design, security, testing, and deployment roadmap.
- **System Architecture (`ARCHITECTURE.md`):** Comprehensive topology diagrams, data flows, offline attempt HMAC tamper-proofing, two-way sync protocol with delta push/pull and conflict resolution rules, LAN classroom mode, and bootable USB partition architecture.
- **Database Schema (`DATABASE_SCHEMA.md`):** Complete production-grade PostgreSQL 16 DDL with indexes, foreign keys, check constraints, and corresponding offline SQLite schema, plus initial canonical seed data for roles and meteorological competencies.
- **API Contract (`API_CONTRACT.md`):** OpenAPI 3.1 aligned REST API endpoint specifications for Auth, Trainee, Trainer, Courses, Assessments, Competency/AI, Admin, Content Packs, and Synchronization.
- **Canonical Naming Conventions (`NAMING_CONVENTIONS.md`):** Universal vocabulary dictionary and casing rules across database tables, backend models, API routes, and frontend types.
- **Development Status Registry (`DEVELOPMENT_STATUS.md`):** Phase registry tracking Phase 0 to Phase 14 with multi-AI continuity instructions.
- **Project Scope Freeze:** Formal requirements freeze locking the architectural baseline.
