import os
import time
import logging
from typing import AsyncGenerator, Dict, Any
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger("capacity_connect.database")

class Base(DeclarativeBase):
    pass


# Ensure data directory exists if using SQLite
if "sqlite" in settings.effective_database_url:
    db_path = settings.effective_database_url.replace("sqlite+aiosqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

# Engine initialization kwargs
engine_kwargs: Dict[str, Any] = {
    "echo": False,
    "future": True,
}

if "sqlite" in settings.effective_database_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True

engine: AsyncEngine = create_async_engine(
    settings.effective_database_url,
    **engine_kwargs
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health() -> Dict[str, Any]:
    """
    Checks connectivity to the active database.
    Executes 'SELECT 1' and returns latency, dialect, and health status.
    """
    start_time = time.perf_counter()
    try:
        async with async_session_factory() as session:
            result = await session.execute(text("SELECT 1"))
            val = result.scalar()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            dialect = engine.dialect.name
            return {
                "status": "healthy" if val == 1 else "degraded",
                "dialect": dialect,
                "latency_ms": latency_ms,
                "database_url_type": "sqlite" if "sqlite" in settings.effective_database_url else "postgresql"
            }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.warning(f"Database health check failed: {exc}")
        return {
            "status": "unreachable",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "error": str(exc),
            "database_url_type": "sqlite" if "sqlite" in settings.effective_database_url else "postgresql"
        }
