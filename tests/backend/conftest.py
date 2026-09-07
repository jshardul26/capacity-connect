import os
import sys
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

# Add backend directory to sys.path so 'app' can be imported
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# Configure environment for tests (Use local SQLite for fast, isolated testing)
os.environ["APP_MODE"] = "local"
os.environ["ENVIRONMENT"] = "testing"
os.environ["SQLITE_LOCAL_URL"] = "sqlite+aiosqlite:///./data/test_capacity_connect.db"

from app.main import app
from app.core.database import engine, Base


@pytest.fixture(scope="function", autouse=True)
async def setup_test_db():
    # Create test database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup test tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
