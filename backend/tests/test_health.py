import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    # Top level checks
    assert "status" in data
    assert data["version"] == "0.1.0"
    assert "services" in data

    services = data["services"]
    assert "api" in services
    assert services["api"]["status"] == "healthy"

    assert "database" in services
    assert services["database"]["status"] in ("healthy", "unhealthy")

    assert "gpu" in services
    assert "available" in services["gpu"]
