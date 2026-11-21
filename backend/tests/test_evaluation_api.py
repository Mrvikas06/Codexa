import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_evaluation_api_endpoints(client: AsyncClient):
    res = await client.get("/api/v1/evaluation/run-all")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PASSED"
    assert data["overall_passed"] is True

    summary_res = await client.get("/api/v1/evaluation/summary")
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["status"] == "HEALTHY"
    assert "encoder" in summary_data
