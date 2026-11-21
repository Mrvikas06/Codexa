import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from app.core.middleware import SecurityAndTimingMiddleware


@pytest.mark.asyncio
async def test_security_and_timing_headers():
    test_app = FastAPI()
    test_app.add_middleware(SecurityAndTimingMiddleware)

    @test_app.get("/ping")
    async def ping():
        return {"status": "ok"}

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        res = await client.get("/ping")
        assert res.status_code == 200
        assert "x-process-time-ms" in res.headers
        assert res.headers["x-content-type-options"] == "nosniff"
        assert res.headers["x-frame-options"] == "DENY"
        assert res.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"
