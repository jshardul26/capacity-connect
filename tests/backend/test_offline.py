import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from app.core.database import engine


ADMIN_EMAIL = "admin.imd@moes.gov.in"
ADMIN_PASSWORD = "Admin@CapacityConnect2026"


async def admin_token(client: AsyncClient) -> str:
    response = await client.post("/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 200
    return response.json()["access_token"]


async def approved_user(client: AsyncClient, role: str) -> tuple[str, str]:
    token = await admin_token(client)
    email = f"offline.{role}.{uuid.uuid4().hex[:8]}@imd.gov.in"
    signup = await client.post("/api/v1/auth/signup", json={
        "email": email, "password": "Password123!", "full_name": f"Offline {role}",
        "role": role, "station_code": "IMD-OFFLINE",
    })
    assert signup.status_code == 201
    user_id = signup.json()["id"]
    approved = await client.post(f"/api/v1/admin/users/{user_id}/approve", headers={"Authorization": f"Bearer {token}"})
    assert approved.status_code == 200
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    assert login.status_code == 200
    return user_id, login.json()["access_token"]


@pytest.mark.asyncio
async def test_local_sqlite_wal_and_offline_status(async_client: AsyncClient):
    _, token = await approved_user(async_client, "trainee")
    response = await async_client.get("/api/v1/offline/status", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["database_dialect"] == "sqlite"
    assert response.json()["content_store_ready"] is True
    async with engine.connect() as connection:
        journal_mode = (await connection.execute(text("PRAGMA journal_mode"))).scalar()
    assert journal_mode.lower() == "wal"


@pytest.mark.asyncio
async def test_local_progress_is_persisted_and_queued(async_client: AsyncClient):
    trainer_id, trainer_token = await approved_user(async_client, "trainer")
    _, trainee_token = await approved_user(async_client, "trainee")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}
    course = await async_client.post("/api/v1/trainer/courses", headers=trainer_headers, json={
        "title": "Offline Course", "code": f"OFF-{uuid.uuid4().hex[:8]}", "description": "Offline persistence test",
        "category": "Instrumentation", "level": "beginner", "estimated_hours": 1,
    })
    assert course.status_code == 201
    course_id = course.json()["id"]
    module = await async_client.post(f"/api/v1/trainer/courses/{course_id}/modules", headers=trainer_headers, json={"title": "Module", "order_index": 1})
    lesson = await async_client.post(f"/api/v1/trainer/modules/{module.json()['id']}/lessons", headers=trainer_headers, json={"title": "Lesson", "order_index": 1, "duration_minutes": 10})
    assert lesson.status_code == 201
    assert (await async_client.post(f"/api/v1/courses/{course_id}/enroll", headers=trainee_headers)).status_code == 200
    saved = await async_client.post(f"/api/v1/courses/{course_id}/progress", headers=trainee_headers, json={"lesson_id": lesson.json()["id"], "watch_time_seconds": 60, "is_completed": True})
    assert saved.status_code == 200
    assert saved.json()["watch_time_seconds"] == 60
    admin_headers = {"Authorization": f"Bearer {await admin_token(async_client)}"}
    queue = await async_client.get("/api/v1/offline/queue", headers=admin_headers)
    assert queue.status_code == 200
    assert any(item["entity_type"] == "progress" and item["status"] == "pending" for item in queue.json())


@pytest.mark.asyncio
async def test_pack_export_and_local_admin_import_authorization(async_client: AsyncClient):
    _, trainer_token = await approved_user(async_client, "trainer")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    course = await async_client.post("/api/v1/trainer/courses", headers=trainer_headers, json={
        "title": "Pack Course", "code": f"PACK-{uuid.uuid4().hex[:8]}", "description": "Portable course",
        "category": "Forecasting", "level": "beginner", "estimated_hours": 1,
    })
    exported = await async_client.post("/api/v1/packs/export", headers=trainer_headers, json={"course_ids": [course.json()["id"]], "package_title": f"offline-{uuid.uuid4().hex[:6]}"})
    assert exported.status_code == 200
    pack = await async_client.get(exported.json()["download_url"], headers=trainer_headers)
    assert pack.status_code == 200
    trainee_id, trainee_token = await approved_user(async_client, "trainee")
    denied = await async_client.post("/api/v1/packs/import", headers={"Authorization": f"Bearer {trainee_token}"}, files={"package_file": ("pack.ccpack", pack.content, "application/zip")})
    assert denied.status_code == 403
    imported = await async_client.post("/api/v1/packs/import", headers={"Authorization": f"Bearer {await admin_token(async_client)}"}, files={"package_file": ("pack.ccpack", pack.content, "application/zip")})
    assert imported.status_code == 200
    assert imported.json()["courses_registered"] == 1


@pytest.mark.asyncio
async def test_aes256_gcm_encrypted_pack_export_import_and_tamper_detection(async_client: AsyncClient):
    _, trainer_token = await approved_user(async_client, "trainer")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    course = await async_client.post("/api/v1/trainer/courses", headers=trainer_headers, json={
        "title": "Encrypted Pack Course", "code": f"ENC-{uuid.uuid4().hex[:8]}", "description": "Sealed course",
        "category": "Radar", "level": "beginner", "estimated_hours": 1,
    })
    assert course.status_code == 201
    exported = await async_client.post("/api/v1/packs/export", headers=trainer_headers, json={
        "course_ids": [course.json()["id"]], "package_title": f"sealed-{uuid.uuid4().hex[:6]}", "encrypt": True,
    })
    assert exported.status_code == 200
    pack = await async_client.get(exported.json()["download_url"], headers=trainer_headers)
    assert pack.status_code == 200
    assert pack.content.startswith(b"CCPCKENC1"), "sealed packs must carry the AES-GCM envelope marker"

    # Import of a sealed pack restores the same content.
    imported = await async_client.post("/api/v1/packs/import",
        headers={"Authorization": f"Bearer {await admin_token(async_client)}"},
        files={"package_file": ("sealed.ccpack", pack.content, "application/octet-stream")})
    assert imported.status_code == 200
    assert imported.json()["courses_registered"] == 1

    # A single flipped byte anywhere in the envelope must be rejected.
    tampered = bytearray(pack.content)
    tampered[-1] ^= 0x01
    rejected = await async_client.post("/api/v1/packs/import",
        headers={"Authorization": f"Bearer {await admin_token(async_client)}"},
        files={"package_file": ("tampered.ccpack", bytes(tampered), "application/octet-stream")})
    assert rejected.status_code == 422, "tampered encrypted pack must not be accepted"


@pytest.mark.asyncio
async def test_local_assessment_attempt_is_sealed_and_queued(async_client: AsyncClient):
    _, trainer_token = await approved_user(async_client, "trainer")
    _, trainee_token = await approved_user(async_client, "trainee")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}
    assessment = await async_client.post("/api/v1/assessments", headers=trainer_headers, json={
        "title": "Offline Quiz", "subject": "Radar", "duration_minutes": 10,
        "passing_score": 50, "total_marks": 10, "is_published": True,
    })
    assert assessment.status_code == 201
    question = await async_client.post(f"/api/v1/assessments/{assessment.json()['id']}/questions", headers=trainer_headers, json={
        "question_text": "Offline question?", "question_type": "mcq",
        "options_json": [{"id": "A", "text": "Correct"}, {"id": "B", "text": "Wrong"}],
        "correct_option": "A", "marks": 10,
    })
    started = await async_client.post(f"/api/v1/assessments/{assessment.json()['id']}/start", headers=trainee_headers)
    assert started.status_code == 200
    submitted = await async_client.post(f"/api/v1/assessments/{assessment.json()['id']}/submit", headers=trainee_headers, json={
        "attempt_id": started.json()["attempt_id"], "answers": [{"question_id": question.json()["id"], "selected_option": "A"}],
    })
    assert submitted.status_code == 200
    assert submitted.json()["attempt_signature"]
    queue = await async_client.get("/api/v1/offline/queue", headers={"Authorization": f"Bearer {await admin_token(async_client)}"})
    assert any(item["entity_type"] == "attempt" and item["action"] == "CREATE" for item in queue.json())
