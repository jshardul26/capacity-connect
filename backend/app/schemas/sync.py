from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class SyncEventPayload(BaseModel):
    event_id: str
    entity_type: str
    action: str
    payload: dict[str, Any]
    client_signature: str = Field(min_length=64, max_length=64)


class SyncPushRequest(BaseModel):
    device_id: str = Field(min_length=2, max_length=100)
    batch_timestamp: datetime
    events: list[SyncEventPayload] = Field(max_length=50)


class SyncPushResponse(BaseModel):
    status: str = "success"
    accepted_event_ids: list[str]
    failed_event_ids: list[str]


class SyncStatusResponse(BaseModel):
    device_id: str
    pending_events: int
    processing_events: int
    failed_events: int
    last_pull_at: datetime | None = None
    last_push_at: datetime | None = None
    last_error: str | None = None
