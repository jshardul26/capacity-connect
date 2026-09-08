"""Local queue transport used by the OS worker; API ingestion lives in api/endpoints/sync.py."""
import json
from datetime import datetime, timedelta, timezone
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.offline import SyncQueue, SyncState


async def flush_queue(db: AsyncSession, access_token: str) -> dict:
    """Push at most 50 eligible events and preserve failures for exponential retry."""
    if not settings.CENTRAL_SYNC_URL:
        return {"sent": 0, "reason": "CENTRAL_SYNC_URL is not configured"}
    now = datetime.now(timezone.utc)
    # A power loss may leave rows in processing.  Their payloads are immutable,
    # so safely return stale leases to the retry queue before resuming.
    stale = (await db.execute(select(SyncQueue).where(
        SyncQueue.status == "processing",
        SyncQueue.processing_started_at <= now - timedelta(minutes=5),
    ))).scalars().all()
    for row in stale:
        row.status = "failed"
        row.last_error = "Recovered after interrupted synchronization."
        row.next_attempt_at = now
    if stale:
        await db.commit()
    rows = (await db.execute(select(SyncQueue).where(
        SyncQueue.status.in_(["pending", "failed"]),
        (SyncQueue.next_attempt_at.is_(None) | (SyncQueue.next_attempt_at <= now)),
    ).order_by(SyncQueue.created_at).limit(50))).scalars().all()
    if not rows:
        return {"sent": 0}
    for row in rows:
        row.status = "processing"
        row.processing_started_at = now
    await db.commit()
    body = {"device_id": settings.STATION_CODE, "batch_timestamp": now.isoformat(), "events": [
        {"event_id": row.id, "entity_type": row.entity_type, "action": row.action, "payload": json.loads(row.payload_json), "client_signature": row.client_signature} for row in rows
    ]}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f"{settings.CENTRAL_SYNC_URL.rstrip('/')}/api/v1/sync/push", json=body, headers={"Authorization": f"Bearer {access_token}"})
            response.raise_for_status()
        accepted = set(response.json().get("accepted_event_ids", []))
        for row in rows:
            if row.id in accepted:
                row.status = "synced"; row.synced_at = now; row.last_error = None; row.processing_started_at = None
            else:
                row.status = "failed"; row.retry_count += 1; row.next_attempt_at = now + timedelta(seconds=min(3600, 2 ** row.retry_count)); row.last_error = "Event rejected by central sync hub."; row.processing_started_at = None
    except Exception as exc:
        for row in rows:
            row.status = "failed"; row.retry_count += 1; row.next_attempt_at = now + timedelta(seconds=min(3600, 2 ** row.retry_count)); row.last_error = str(exc)[:1000]; row.processing_started_at = None
    state = await db.get(SyncState, settings.STATION_CODE) or SyncState(id=settings.STATION_CODE)
    db.add(state); state.last_push_at = now
    await db.commit()
    return {"sent": len(rows), "synced": sum(row.status == "synced" for row in rows)}
