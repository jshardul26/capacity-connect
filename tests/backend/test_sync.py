import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from app.core.config import settings


async def admin_token(client: AsyncClient) -> str:
    response = await client.post("/api/v1/auth/login", json={"email": "admin.imd@moes.gov.in", "password": "Admin@CapacityConnect2026"})
    return response.json()["access_token"]


def signed(device_id: str, entity_type: str, action: str, payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str)
    return hmac.new(settings.SYNC_HMAC_SECRET.encode(), f"{device_id}:{entity_type}:{action}:{raw}".encode(), hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_sync_push_is_hmac_validated_and_idempotent(async_client: AsyncClient):
    token = await admin_token(async_client); headers = {"Authorization": f"Bearer {token}"}
    event_id, device_id = "event-sync-idempotent-001", "IMD-TEST-NODE"
    event_payload = {"user_id": "admin", "lesson_id": "missing-lesson", "watch_time_seconds": 30}
    body = {"device_id": device_id, "batch_timestamp": datetime.now(timezone.utc).isoformat(), "events": [{"event_id": event_id, "entity_type": "other", "action": "CREATE", "payload": event_payload, "client_signature": signed(device_id, "other", "CREATE", event_payload)}]}
    first = await async_client.post("/api/v1/sync/push", headers=headers, json=body)
    second = await async_client.post("/api/v1/sync/push", headers=headers, json=body)
    assert first.status_code == second.status_code == 200
    assert first.json()["accepted_event_ids"] == second.json()["accepted_event_ids"] == [event_id]
    body["events"][0]["event_id"] = "event-sync-invalid-002"; body["events"][0]["client_signature"] = "0" * 64
    rejected = await async_client.post("/api/v1/sync/push", headers=headers, json=body)
    assert rejected.json()["failed_event_ids"] == ["event-sync-invalid-002"]


@pytest.mark.asyncio
async def test_sync_pull_and_status_are_admin_protected(async_client: AsyncClient):
    token = await admin_token(async_client); headers = {"Authorization": f"Bearer {token}"}
    pulled = await async_client.get("/api/v1/sync/pull?device_id=IMD-TEST-NODE", headers=headers)
    assert pulled.status_code == 200
    assert set(pulled.json()) == {"timestamp", "courses", "assessments", "announcements", "users", "competencies"}
    assert pulled.json()["competencies"], "taxonomy must accompany every pull for offline gap analysis"
    status = await async_client.get("/api/v1/sync/status", headers=headers)
    assert status.status_code == 200


@pytest.mark.asyncio
async def test_sync_pull_returns_published_content_and_approved_account_delta(async_client: AsyncClient):
    token = await admin_token(async_client); headers = {"Authorization": f"Bearer {token}"}
    email = f"sync.trainer.{uuid.uuid4().hex[:8]}@imd.gov.in"
    signup = await async_client.post("/api/v1/auth/signup", json={
        "email": email, "password": "Password123!", "full_name": "Sync Trainer",
        "role": "trainer", "station_code": "IMD-SYNC",
    })
    assert signup.status_code == 201
    trainer_id = signup.json()["id"]
    assert (await async_client.post(f"/api/v1/admin/users/{trainer_id}/approve", headers=headers)).status_code == 200
    trainer_login = await async_client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    trainer_headers = {"Authorization": f"Bearer {trainer_login.json()['access_token']}"}
    course = await async_client.post("/api/v1/trainer/courses", headers=trainer_headers, json={
        "title": "Delta Pull Course", "code": f"SYNC-{uuid.uuid4().hex[:8]}", "description": "Central to local delta",
        "category": "Forecasting", "level": "beginner", "estimated_hours": 2,
    })
    assert course.status_code == 201
    course_id = course.json()["id"]
    module = await async_client.post(f"/api/v1/trainer/courses/{course_id}/modules", headers=trainer_headers, json={"title": "M1", "order_index": 1})
    lesson = await async_client.post(f"/api/v1/trainer/modules/{module.json()['id']}/lessons", headers=trainer_headers, json={"title": "L1", "order_index": 1, "duration_minutes": 5})
    assessment = await async_client.post("/api/v1/assessments", headers=trainer_headers, json={
        "title": "Delta Quiz", "subject": "Forecasting", "duration_minutes": 10, "passing_score": 50, "total_marks": 10,
        "course_id": course_id, "is_published": True,
    })
    q = await async_client.post(f"/api/v1/assessments/{assessment.json()['id']}/questions", headers=trainer_headers, json={
        "question_text": "Radar mode question?", "question_type": "mcq",
        "options_json": [{"id": "A", "text": "1"}, {"id": "B", "text": "2"}], "correct_option": "A", "marks": 10,
    })
    assert q.status_code == 201
    # publish the course
    assert (await async_client.put(f"/api/v1/admin/courses/{course_id}/publish?is_published=true", headers=headers)).status_code == 200

    pulled = await async_client.get("/api/v1/sync/pull?device_id=IMD-SYNC-NODE", headers=headers)
    assert pulled.status_code == 200
    body = pulled.json()
    assert len(body["courses"]) == 1
    assert body["courses"][0]["modules"][0]["lessons"][0]["id"] == lesson.json()["id"]
    pulled_assessment = next(a for a in body["assessments"] if a["id"] == assessment.json()["id"])
    assert pulled_assessment["questions"], "published assessment must include its questions"
    assert any(u["id"] == trainer_id for u in body["users"]), "approved accounts must be cached for offline authentication"


@pytest.mark.asyncio
async def test_sync_push_applies_attempt_domain_record_and_competency_evidence(async_client: AsyncClient):
    token = await admin_token(async_client); headers = {"Authorization": f"Bearer {token}"}
    admin_headers = headers
    # Trainee who will "complete" the attempted assessment
    email = f"sync.trainee.{uuid.uuid4().hex[:8]}@imd.gov.in"
    signup = await async_client.post("/api/v1/auth/signup", json={
        "email": email, "password": "Password123!", "full_name": "Sync Trainee", "role": "trainee", "station_code": "IMD-SYNC"})
    assert signup.status_code == 201
    trainee_id = signup.json()["id"]
    assert (await async_client.post(f"/api/v1/admin/users/{trainee_id}/approve", headers=admin_headers)).status_code == 200

    # Trainer creates an assessment mapped to the canonical radar competency
    t_email = f"sync.assess.{uuid.uuid4().hex[:8]}@imd.gov.in"
    t_signup = await async_client.post("/api/v1/auth/signup", json={
        "email": t_email, "password": "Password123!", "full_name": "Sync Assessor", "role": "trainer", "station_code": "IMD-SYNC"})
    assert t_signup.status_code == 201
    assert (await async_client.post(f"/api/v1/admin/users/{t_signup.json()['id']}/approve", headers=admin_headers)).status_code == 200
    t_login = await async_client.post("/api/v1/auth/login", json={"email": t_email, "password": "Password123!"})
    t_headers = {"Authorization": f"Bearer {t_login.json()['access_token']}"}
    taxonomy = await async_client.get("/api/v1/competency/taxonomy", headers=admin_headers)
    radar = next(c for c in taxonomy.json()["competencies"] if "Doppler" in c["name"])
    assessment = await async_client.post("/api/v1/assessments", headers=t_headers, json={
        "title": "Sync Radar Quiz", "subject": "Radar", "duration_minutes": 10, "passing_score": 50, "total_marks": 100,
        "is_published": True})
    assessment_id = assessment.json()["id"]
    assert (await async_client.post(f"/api/v1/competency/assessments/{assessment_id}/mapping", headers=t_headers,
                                    json={"competency_id": radar["id"]})).status_code == 200

    attempt_id = f"attempt-{uuid.uuid4()}"
    payload = {
        "attempt_id": attempt_id, "assessment_id": assessment_id, "user_id": trainee_id,
        "score_obtained": 90.0, "total_marks": 100.0, "is_passed": True, "attempt_status": "completed",
        "attempt_signature": signed("IMD-SYNC-NODE", "attempt", "CREATE", {"dummy": 1})[:64],
        "answers": [],
    }
    device_id = "IMD-SYNC-NODE"
    body = {"device_id": device_id, "batch_timestamp": datetime.now(timezone.utc).isoformat(),
            "events": [{"event_id": attempt_id, "entity_type": "attempt", "action": "CREATE",
                        "payload": payload, "client_signature": signed(device_id, "attempt", "CREATE", payload)}]}
    pushed = await async_client.post("/api/v1/sync/push", headers=admin_headers, json=body)
    assert pushed.status_code == 200
    assert attempt_id in pushed.json()["accepted_event_ids"]

    # Replayed push must be idempotent (deduplicated, no duplicate records)
    replayed = await async_client.post("/api/v1/sync/push", headers=admin_headers, json=body)
    assert attempt_id in replayed.json()["accepted_event_ids"]

    # Central domain records must exist
    matrix = await async_client.get(f"/api/v1/competency/trainee/{trainee_id}/matrix", headers=admin_headers)
    assert matrix.status_code == 200
    assert any(item["competency_id"] == radar["id"] and item["proficiency_level"] > 0 for item in matrix.json()["competencies"])

    audit = await async_client.get("/api/v1/sync/audit-logs?device_id=IMD-SYNC-NODE", headers=admin_headers)
    assert audit.status_code == 200
    assert any(e["event_id"] == attempt_id for e in audit.json()["events"])
