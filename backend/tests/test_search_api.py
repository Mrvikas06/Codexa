import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace


@pytest.mark.asyncio
async def test_search_api_endpoint(client: AsyncClient, db_session: AsyncSession):
    user = User(email="searchapi@codeatlas.ai", username="searchuser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="WS", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(workspace_id=ws.id, name="repo", status=RepositoryStatus.INDEXED)
    db_session.add(repo)
    await db_session.flush()

    file_obj = File(
        repository_id=repo.id,
        path="src/jwt.py",
        filename="jwt.py",
        extension=".py",
        language="python",
        content_hash="h1",
    )
    db_session.add(file_obj)
    await db_session.flush()

    sym = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="decode_token",
        symbol_type=SymbolType.FUNCTION,
        start_line=1,
        end_line=4,
    )
    db_session.add(sym)
    await db_session.flush()

    chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=sym.id,
        chunk_type=ChunkType.FUNCTION,
        content="def decode_token(jwt):\n    return verify(jwt)",
        content_hash="c1",
        start_line=1,
        end_line=4,
        language="python",
        extra_metadata={"file_path": "src/jwt.py", "symbol_name": "decode_token"},
    )
    db_session.add(chunk)
    await db_session.commit()

    payload = {
        "query": "jwt decode token",
        "repository_id": str(repo.id),
        "top_k": 5,
        "enable_reranker": False,
    }

    res = await client.post("/api/v1/search/hybrid", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["query"] == payload["query"]
    assert data["total_results"] >= 1
    assert data["results"][0]["file_path"] == "src/jwt.py"
    assert data["results"][0]["symbol_name"] == "decode_token"
