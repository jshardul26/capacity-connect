from datetime import datetime
from pydantic import BaseModel, Field


class OfflineStatusResponse(BaseModel):
    app_mode: str
    station_code: str
    database_dialect: str
    content_store_ready: bool
    pending_sync_events: int


class SyncQueueItemResponse(BaseModel):
    id: str
    entity_type: str
    action: str
    status: str
    created_at: datetime


class PackExportRequest(BaseModel):
    course_ids: list[str] = Field(min_length=1)
    package_title: str = Field(min_length=2, max_length=255)
    encrypt: bool = Field(False, description="Seal the pack with AES-256-GCM before transfer.")
