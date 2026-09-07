import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "Capacity Connect"
    assert "version" in data
    assert data["docs_url"] == "/docs"
    assert "station_code" in data


@pytest.mark.asyncio
async def test_api_v1_health(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "Capacity Connect"
    assert data["version"] == "1.0.0"
    assert "station_code" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_api_v1_health_db(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["dialect"] in ["sqlite", "postgresql"]
    assert "latency_ms" in data
    assert data["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_api_v1_health_full(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health/full")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "application" in data
    assert "database" in data
    assert data["application"]["name"] == "Capacity Connect"
    assert data["database"]["status"] == "healthy"
