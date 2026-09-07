from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    app_name: str = Field(..., json_schema_extra={"example": "Capacity Connect"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    app_mode: str = Field(..., json_schema_extra={"example": "central"})
    environment: str = Field(..., json_schema_extra={"example": "development"})
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    station_code: str = Field(..., json_schema_extra={"example": "IMD-HQ-DELHI"})


class DatabaseHealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    dialect: str = Field(..., json_schema_extra={"example": "postgresql"})
    latency_ms: float = Field(..., json_schema_extra={"example": 4.25})
    database_url_type: str = Field(..., json_schema_extra={"example": "postgresql"})
    error: Optional[str] = Field(None, json_schema_extra={"example": None})
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
