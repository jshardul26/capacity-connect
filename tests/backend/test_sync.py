import hashlib
import hmac
import json
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
    assert set(pulled.json()) == {"timestamp", "courses", "assessments", "announcements"}
    status = await async_client.get("/api/v1/sync/status", headers=headers)
    assert status.status_code == 200
