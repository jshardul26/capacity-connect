import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.ratelimit import auth_login_limiter
from app.api.api_v1 import api_router
from app.core.database import engine
from app.core.init_db import init_db

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("capacity_connect.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup lifecycle
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} in [{settings.APP_MODE.upper()}] mode...")
    logger.info(f"Station Code: {settings.STATION_CODE} | Environment: {settings.ENVIRONMENT}")
    try:
        await init_db()
        logger.info("Database initialized and canonical roles verified.")
    except Exception as exc:
        logger.error(f"Error during database initialization: {exc}", exc_info=True)
    yield
    # Shutdown lifecycle
    logger.info(f"Shutting down {settings.APP_NAME} database engine...")
    await engine.dispose()
    logger.info("Graceful shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


@app.middleware("http")
async def auth_rate_limit(request: Request, call_next):
    """Bound unauthenticated credential attempts without changing API contracts."""
    if settings.ENVIRONMENT != "testing" and request.url.path in {"/api/v1/auth/login", "/api/v1/auth/signup", "/api/v1/auth/refresh"}:
        client = request.client.host if request.client else "unknown"
        if not auth_login_limiter.allow(client):
            return JSONResponse(status_code=429, content={"detail": "Too many authentication attempts. Try again later."})
    return await call_next(request)

# CORS configuration
origins = settings.BACKEND_CORS_ORIGINS
if isinstance(origins, list):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register v1 router
app.include_router(api_router, prefix="/api/v1")

# The OS image uses the same compiled React application in local mode.  API
# routes remain mounted first, so this cannot shadow backend endpoints.
if settings.APP_MODE.lower() == "local" and settings.LOCAL_FRONTEND_PATH:
    frontend_path = Path(settings.LOCAL_FRONTEND_PATH)
    if frontend_path.is_dir():
        app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="local_frontend")


@app.get("/", tags=["Root"])
async def root():
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": settings.APP_MODE,
        "docs_url": "/docs",
        "api_v1_health": "/api/v1/health",
        "station_code": settings.STATION_CODE
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )
