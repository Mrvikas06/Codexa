import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ranking_api_endpoint(client: AsyncClient):
    payload = {
        "query": "Where is token validated?",
        "candidates": [
            {
                "chunk_id": "00000000-0000-0000-0000-000000000001",
                "content": "def validate_token(token):\n    return verify(token)",
                "file_path": "src/auth/service.py",
                "symbol_name": "validate_token",
                "start_line": 10,
                "end_line": 12,
            },
            {
                "chunk_id": "00000000-0000-0000-0000-000000000002",
                "content": "def add_numbers(a, b):\n    return a + b",
                "file_path": "src/math/ops.py",
                "symbol_name": "add_numbers",
                "start_line": 1,
                "end_line": 2,
            },
        ],
        "top_k": 2,
    }

    res = await client.post("/api/v1/ranking/rerank", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["query"] == payload["query"]
    assert data["total_candidates"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["rank"] == 1
    assert data["results"][1]["rank"] == 2
    assert data["results"][0]["score"] >= data["results"][1]["score"]
