from datetime import datetime, timezone
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import check_db_health
from app.schemas.health import HealthResponse, DatabaseHealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Health Check",
    description="Returns the operational status, application version, active engine mode (central/local), and station identifier.",
    status_code=status.HTTP_200_OK
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        app_mode=settings.APP_MODE,
        environment=settings.ENVIRONMENT,
        station_code=settings.STATION_CODE
    )


@router.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    summary="Database Connectivity Check",
    description="Performs an active probe ('SELECT 1') against the configured database engine (PostgreSQL or SQLite).",
    status_code=status.HTTP_200_OK
)
async def db_health_check() -> DatabaseHealthResponse:
    db_status = await check_db_health()
    return DatabaseHealthResponse(
        status=db_status["status"],
        dialect=db_status["dialect"],
        latency_ms=db_status["latency_ms"],
        database_url_type=db_status["database_url_type"],
        error=db_status.get("error")
    )


@router.get(
    "/health/full",
    summary="Comprehensive System Health Check",
    description="Returns an aggregated health status of the application runtime and database connectivity.",
    status_code=status.HTTP_200_OK
)
async def full_health_check():
    db_status = await check_db_health()
    is_healthy = db_status["status"] == "healthy"
    
    return {
        "status": "healthy" if is_healthy else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "application": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "mode": settings.APP_MODE,
            "environment": settings.ENVIRONMENT,
            "station_code": settings.STATION_CODE
        },
        "database": db_status
    }
