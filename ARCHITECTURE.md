# CAPACITY CONNECT — SYSTEM ARCHITECTURE SPECIFICATION
## Comprehensive Architecture Document for MoES/IMD Capacity Building Ecosystem
**Document Status:** FROZEN | **Version:** 1.0.0

---

## 1. ARCHITECTURAL OVERVIEW & TOPOLOGY

Capacity Connect is an **offline-first educational and organizational capacity-building ecosystem** built specifically for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD). It solves the critical operational challenge of training personnel stationed at remote observatories, radar facilities, and field stations with limited or zero internet connectivity.

```
                                  [CENTRAL CLOUD PLATFORM]
                     +-------------------------------------------------+
                     |                 Nginx SSL Proxy                 |
                     +------------------------+------------------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
                   v                                                     v
    +------------------------------+                      +------------------------------+
    |   Central FastAPI Backend    |                      |   MinIO S3 / Object Store    |
    |  - Trainee, Trainer, Admin   |                      |  - Lecture Videos (MP4)      |
    |  - Scikit-learn AI Matcher   |                      |  - Presentations (PDF, PPTX) |
    |  - Delta Sync Ingestion API  |                      |  - Study Notes & Syllabi     |
    +--------------+---------------+                      +------------------------------+
                   |
                   v
    +------------------------------+
    |    PostgreSQL 16 Database    |
    |  - ACID Master Records       |
    |  - Competency Vectors        |
    |  - Sync Delta Audit Logs     |
    +------------------------------+
                   ▲
                   │
                   │ Bi-directional Delta Sync (HTTPS when connected)
                   │ OR Physical USB Content Pack (.ccpack)
                   │
                   ▼
+----------------------------------------------------------------------+
|             CAPACITY CONNECT OS (FIELD / OFFLINE MACHINE)            |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Kiosk / Educational Desktop (Chromium App Mode / XFCE UI)      |  |
|  +--------------------------------+-------------------------------+  |
|                                   |                                  |
|                                   v                                  |
|  +----------------------------------------------------------------+  |
|  | Local FastAPI Application (Dual-Engine: Central & Local)       |  |
|  |  - Serves identical UI & API contracts                         |  |
|  |  - Local Auth verification using cached hashes                 |  |
|  |  - Local Assessment Grader & Cryptographic Attempt Sealer      |  |
|  +----------------+-------------------------------+---------------+  |
|                   |                               |                  |
|                   v                               v                  |
|  +---------------------------------+  +---------------------------+  |
|  | Local SQLite DB (WAL Enabled)   |  | Local Content Store       |  |
|  |  - Courses, Quizzes, Progress   |  |  - Checksummed MP4s, PDFs |  |
|  |  - Outbound sync_queue records  |  |  - Stored by content hash |  |
|  +----------------+----------------+  +---------------------------+  |
|                   ▲                                                  |
|                   │                                                  |
|  +----------------+-----------------------------------------------+  |
|  | Background Sync Daemon (Python systemd service)                |  |
|  |  - Connectivity watcher (Heartbeat & WAN detection)            |  |
|  |  - Push Worker: Flushes local attempts to Central API          |  |
|  |  - Pull Worker: Fetches new courses, materials, notices        |  |
|  +----------------------------------------------------------------+  |
+-----------------------------------+----------------------------------+
                                    |
                Optional Local Wi-Fi Hotspot / Ethernet LAN
                                    |
       +----------------------------+----------------------------+
       |                                                         |
       v                                                         v
+--------------------------+                              +--------------------------+
| Trainee Device 1         |                              | Trainee Device 2         |
| Browser: cc.local        |                              | Browser: cc.local        |
+--------------------------+                              +--------------------------+
```

---

## 2. CENTRAL PLATFORM ARCHITECTURE

### 2.1 Backend Design: Modular Monolith
The central backend is implemented in Python 3.11+ using FastAPI. It uses a **Modular Monolith** architecture:
- **Zero Microservice Overhead:** Avoids distributed tracing, network partitioning, and multiple deployment overheads.
- **Domain Decoupling:** Modules are strictly isolated into distinct packages (`auth`, `courses`, `assessments`, `competency`, `bulletin`, `sync`).
- **Database Access:** Asynchronous SQLAlchemy 2.0 with PostgreSQL 16.

### 2.2 Storage Layer
- **Relational Data:** PostgreSQL 16 stores user accounts, profiles, enrollments, assessment questions, student submissions, and audit logs.
- **Binary/Media Assets:** MinIO S3-compatible object storage stores high-bitrate video lectures, presentation slide decks, and study PDFs.
- **Content Addressing:** All stored files are renamed using their SHA-256 cryptographic digest to guarantee deduplication and data integrity.

---

## 3. OFFLINE-FIRST ARCHITECTURE

### 3.1 Principles of Offline-First Design
1. **Local Autonomy:** The user experience is 100% functional without internet connectivity.
2. **Local Write First:** Every user action (progress tick, quiz submission, profile update) commits immediately to the local transactional SQLite database.
3. **Eventual Consistency:** Synchronization runs asynchronously in the background when connectivity is restored without blocking user interaction.

### 3.2 Offline Assessment & Tamper-Proofing
- When a trainee submits an assessment offline:
  1. The local FastAPI service grades the multiple-choice responses against the local question bank.
  2. A local attempt record is created with `start_time`, `end_time`, `score_obtained`, and `is_passed`.
  3. The local engine computes an **Attempt Signature**:
     $$\text{Signature} = \text{HMAC-SHA256}(\text{DeviceKey}, \text{user\_id} \parallel \text{assessment\_id} \parallel \text{score} \parallel \text{timestamp})$$
  4. The attempt and its cryptographic signature are committed to the local `assessment_attempts` table.
  5. A sync task is pushed into `sync_queue` with status `pending`.

---

## 4. TWO-WAY SYNCHRONIZATION ARCHITECTURE

### 4.1 Sync Engine Component Breakdown
```
+-----------------------------------------------------------------------------+
|                           LOCAL SYNC DAEMON                                 |
|                                                                             |
|  +---------------------+        +--------------------+                      |
|  | Connectivity Monitor| -----> | State: ONLINE      |                      |
|  +---------------------+        +---------+----------+                      |
|                                           |                                 |
|                   +-----------------------+-----------------------+         |
|                   |                                               |         |
|                   v                                               v         |
|        +---------------------+                         +------------------+ |
|        |    Push Worker      |                         |   Pull Worker    | |
|        |  (sync_queue -> API)|                         | (API -> Local DB)| |
|        +----------+----------+                         +--------+---------+ |
|                   |                                             |           |
+-------------------|---------------------------------------------|-----------+
                    |                                             |
                    v (POST /api/v1/sync/push)                    v (GET /api/v1/sync/pull)
+-----------------------------------------------------------------------------+
|                          CENTRAL SYNC HUB                                   |
|                                                                             |
|  - Idempotent Ingestion via Event UUIDs                                     |
|  - Validates HMAC Attempt Signatures                                        |
|  - Updates Global Competency Profiles                                       |
|  - Emits Delta JSON of new courses, resources, bulletins since timestamp    |
+-----------------------------------------------------------------------------+
```

### 4.2 Conflict Resolution Matrix

| Entity | Conflict Scenario | Resolution Policy | Rationale |
|---|---|---|---|
| **Assessment Attempts** | Same attempt synced twice or out of order | **Idempotent Append-Only (Deduplication via UUIDv7)** | Trainee quiz attempts are immutable history; once completed, they cannot be mutated. |
| **Lesson Progress** | Watch-time differs between local and central | **Monotonic Maximum (`max(local, central)`)** | A trainee's verified learning progress never regresses. |
| **Course Content** | Local file modified vs central course update | **Central Authority Precedence** | Central trainers and admins maintain authoritative course syllabi. |
| **Trainee Profile** | Profile edited both offline and online | **Last-Write-Wins (LWW via ISO-8601 UTC timestamp)** | Respects the user's most recent deliberate profile edit. |

---

## 5. LAN ARCHITECTURE (LOCAL LEARNING SERVER)

### 5.1 LAN Topology & Multi-User Classroom
When deployed in a remote facility without internet (such as a coastal radar station or island observatory):
- One machine running Capacity Connect OS is designated as the **LAN Master**.
- The LAN Master broadcasts an ad-hoc Wi-Fi network (SSID: `CapacityConnect-FieldNet`) or connects to an unmanaged Ethernet switch.
- The built-in DNS / DHCP service (`dnsmasq`) assigns private IP addresses (`192.168.4.x`).
- The Avahi daemon broadcasts mDNS: trainees connect directly to `http://capacityconnect.local` on laptops, tablets, or smartphones.
- Multiple trainees can log in, stream video lectures from the local storage, and submit quiz attempts. All records persist to the LAN Master's local database.

---

## 6. CAPACITY CONNECT OS & BOOTABLE USB ARCHITECTURE

### 6.1 OS Stack
- **Base:** Debian 12 / Ubuntu 24.04 LTS Minimal Base.
- **Window Manager:** Openbox / XFCE with custom IMD/MoES branding, system tray network indicator, and sync status icon.
- **Kiosk Runtime:** Chromium launched in app mode with strict flags (`--no-first-run --disable-sync --app=http://127.0.0.1:8000`).

### 6.2 Bootable USB Layout
```
+-----------------------------------------------------------------------------+
| Partition 1: EFI System Partition (FAT32, 512MB)                            |
| - /EFI/BOOT/BOOTX64.EFI (GRUB2 Bootloader)                                  |
| - grub.cfg with persistence kernel boot parameters                         |
+-----------------------------------------------------------------------------+
| Partition 2: Live System (ISO9660 / Read-Only SquashFS, 4GB)                |
| - Compressed Linux Kernel (vmlinuz), Initramfs                              |
| - Base OS files and Capacity Connect application binaries                   |
+-----------------------------------------------------------------------------+
| Partition 3: Persistent Data Partition (Ext4, Remainder of USB, "casper-rw")|
| - Overlayfs persistent storage                                              |
| - /var/capacity-connect/database/capacity_connect_local.db                  |
| - /var/capacity-connect/content_store/ (Videos, PDFs, Syllabi)              |
+-----------------------------------------------------------------------------+
```

---

## 7. AI/ML COMPETENCY & MATCHING ARCHITECTURE

### 7.1 Competency Engine Modules
1. **Skill-Gap Detection Engine (`competency_gap.py`):**
   - Ingests trainee self-declared skills and assessment scores.
   - Computes weighted delta against the benchmark profile of the trainee's target job role.
2. **Course Recommendation Engine (`course_recommender.py`):**
   - Applies scikit-learn Cosine Similarity across the normalized skill deficiency vector and all published courses' competency yield vectors.
   - Generates a prioritized list of remedial and advancement courses with explainable match percentages.
3. **Trainer Matching Engine (`trainer_matcher.py`):**
   - Analyzes subject/course requirements and ranks verified trainers using a weighted multi-factor scoring algorithm (expertise vector similarity, years of experience, and trainee feedback ratings).

---

## 8. SECURITY ARCHITECTURE

1. **Authentication:** Signed JWT tokens with short expiry (60 min) and cryptographically secure refresh tokens (30 days).
2. **Password Storage:** bcrypt with cost factor 12.
3. **RBAC:** Strict role checks at the API controller dependency level (`trainee`, `trainer`, `admin`).
4. **Data Validation:** Pydantic v2 validation guards against invalid data formats and payload tampering.
5. **Content Verification:** SHA-256 hashes generated upon upload and verified before local disk writes.
