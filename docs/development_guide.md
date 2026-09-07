# CAPACITY CONNECT — DEVELOPMENT GUIDE
## Phase 1: Project Foundation Quickstart & Developer Guide
**Document Status:** ACTIVE | **Version:** 1.0.0

---

## 1. PREREQUISITES

- **Operating System:** Windows 10/11, Ubuntu 22.04+, or macOS
- **Python:** 3.11 or 3.12
- **Node.js:** 20+ or 22+ (LTS recommended)
- **Docker & Docker Compose:** Docker Engine 24+ (Optional for containerized run)

---

## 2. LOCAL NATIVE SETUP (HOST MACHINE)

### 2.1 Backend Setup (Python Virtual Environment)
From the project root:

```bash
# 1. Create dedicated Python virtual environment
python -m venv .venv

# 2. Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Copy environment configuration
cp backend/.env.example backend/.env

# 5. Run FastAPI backend server (Defaults to SQLite for local development)
cd backend
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:
- Root: `http://localhost:8000/`
- Interactive OpenAPI / Swagger Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`
- Health Endpoint: `http://localhost:8000/api/v1/health`
- Database Probe: `http://localhost:8000/api/v1/health/db`

---

### 2.2 Frontend Setup (React + Vite)
In a separate terminal:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy frontend environment configuration
cp .env.example .env

# 4. Start Vite development server
npm run dev
```

The frontend web application will start at: `http://localhost:5173/`

---

## 3. DOCKER COMPOSE SETUP (CONTAINERIZED RUN)

To run the complete ecosystem (PostgreSQL 16, MinIO, FastAPI Backend, React Frontend, Nginx):

```bash
# 1. Ensure Docker Desktop / Docker daemon is running
docker info

# 2. Copy root environment file
cp .env.example .env

# 3. Build and launch all containers
docker compose up --build -d

# 4. Check container health
docker compose ps

# 5. View backend logs
docker compose logs -f backend
```

Access points in Docker mode:
- Web App (Nginx): `http://localhost` or `http://localhost:5173`
- Backend Direct: `http://localhost:8000/docs`
- MinIO Web Console: `http://localhost:9001` (User: `minioadmin`, Password: `minioadmin123`)

---

## 4. RUNNING AUTOMATED TESTS

### 4.1 Backend Pytest Suite
```bash
# Activate virtual environment
.venv\Scripts\activate

# Run backend health and connectivity tests
pytest tests/backend/ -v
```

### 4.2 Frontend Build & TypeScript Verification
```bash
cd frontend
npm run build
```
