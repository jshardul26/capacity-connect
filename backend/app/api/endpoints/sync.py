import hashlib
import hmac
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_approved_user
from app.models.admin import Announcement
from app.models.learning import LessonProgress
from app.models.offline import SyncEvent, SyncQueue, SyncState
from app.models.user import User
from app.schemas.sync import SyncPushRequest, SyncPushResponse, SyncStatusResponse
from app.offline.sync_service import flush_queue

router = APIRouter(prefix="/sync", tags=["Synchronization"])


def valid_signature(device_id: str, event) -> bool:
    payload = json.dumps(event.payload, sort_keys=True, default=str)
    expected = hmac.new(settings.SYNC_HMAC_SECRET.encode(), f"{device_id}:{event.entity_type}:{event.action}:{payload}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, event.client_signature)


@router.post("/push", response_model=SyncPushResponse)
async def push_events(payload: SyncPushRequest, current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    accepted, failed = [], []
    for event in payload.events:
        if not valid_signature(payload.device_id, event):
            failed.append(event.event_id)
            continue
        prior = await db.scalar(select(SyncEvent).where(SyncEvent.id == event.event_id))
        if prior:
            accepted.append(event.event_id)
            continue
        event_user_id = event.payload.get("user_id")
        if current_user.role.name == "trainee" and event_user_id != current_user.id:
            failed.append(event.event_id)
            continue
        # Canonical conflict matrix: attempts remain append-only; progress is monotonic.
        if event.entity_type == "progress" and event.action == "UPDATE":
            lesson_id = event.payload.get("lesson_id")
            if not lesson_id:
                failed.append(event.event_id)
                continue
            progress = await db.scalar(select(LessonProgress).where(LessonProgress.user_id == event_user_id, LessonProgress.lesson_id == lesson_id))
            if progress:
                progress.watch_time_seconds = max(progress.watch_time_seconds, int(event.payload.get("watch_time_seconds", 0)))
                progress.is_completed = progress.is_completed or bool(event.payload.get("is_completed"))
        db.add(SyncEvent(id=event.event_id, device_id=payload.device_id, entity_type=event.entity_type, action=event.action, payload_json=json.dumps(event.payload, sort_keys=True, default=str)))
        accepted.append(event.event_id)
    state = await db.get(SyncState, payload.device_id)
    if not state:
        state = SyncState(id=payload.device_id); db.add(state)
    state.last_push_at = datetime.now(timezone.utc)
    await db.commit()
    return SyncPushResponse(accepted_event_ids=accepted, failed_event_ids=failed)


@router.get("/pull")
async def pull_delta(device_id: str = Query(...), since_timestamp: datetime | None = Query(None), current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    query = select(Announcement).where(Announcement.is_active.is_(True))
    if since_timestamp:
        query = query.where(Announcement.updated_at > since_timestamp)
    announcements = (await db.execute(query.order_by(Announcement.updated_at.asc()))).scalars().all()
    state = await db.get(SyncState, device_id)
    if not state:
        state = SyncState(id=device_id); db.add(state)
    now = datetime.now(timezone.utc); state.last_pull_at = now
    await db.commit()
    return {"timestamp": now, "courses": [], "assessments": [], "announcements": [{"id": a.id, "title": a.title, "content": a.content, "updated_at": a.updated_at} for a in announcements]}


@router.get("/status", response_model=SyncStatusResponse)
async def sync_status(current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can inspect synchronization status.")
    counts = {value: await db.scalar(select(func.count(SyncQueue.id)).where(SyncQueue.status == value)) or 0 for value in ("pending", "processing", "failed")}
    state = await db.get(SyncState, settings.STATION_CODE)
    return SyncStatusResponse(device_id=settings.STATION_CODE, pending_events=counts["pending"], processing_events=counts["processing"], failed_events=counts["failed"], last_pull_at=state.last_pull_at if state else None, last_push_at=state.last_push_at if state else None, last_error=state.last_error if state else None)


@router.post("/run")
async def run_local_queue(current_user: User = Depends(require_approved_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can run the local synchronization worker.")
    # The OS service invokes this same processor with a station token; no LAN transport is involved.
    return await flush_queue(db, "")
