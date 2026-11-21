import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace
from app.services.retrieval.symbol import SymbolSearchEngine


@pytest.mark.asyncio
async def test_symbol_search_engine(db_session: AsyncSession):
    user = User(email="sym@codeatlas.ai", username="symuser", hashed_password="pw")
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
        path="src/auth.py",
        filename="auth.py",
        extension=".py",
        language="python",
        content_hash="h1",
    )
    db_session.add(file_obj)
    await db_session.flush()

    symbol = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="validate_token",
        symbol_type=SymbolType.FUNCTION,
        start_line=1,
        end_line=5,
        signature="def validate_token(token: str) -> bool",
        docstring="Validates the JWT signature and expiration",
    )
    db_session.add(symbol)
    await db_session.flush()

    chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=symbol.id,
        chunk_type=ChunkType.FUNCTION,
        content="def validate_token(token: str) -> bool:\n    pass",
        content_hash="ch1",
        start_line=1,
        end_line=5,
        language="python",
    )
    db_session.add(chunk)
    await db_session.commit()

    engine = SymbolSearchEngine()

    # 1. Exact match
    res_exact = await engine.search(db_session, "validate_token", repository_id=repo.id)
    assert len(res_exact) >= 1
    assert res_exact[0][0] == chunk.id
    assert res_exact[0][1] == 1.0

    # 2. Prefix match
    res_prefix = await engine.search(db_session, "validate", repository_id=repo.id)
    assert len(res_prefix) >= 1
    assert res_prefix[0][0] == chunk.id
    assert res_prefix[0][1] == 0.8

    # 3. Docstring match
    res_doc = await engine.search(db_session, "signature", repository_id=repo.id)
    assert len(res_doc) >= 1
    assert res_doc[0][0] == chunk.id
    assert res_doc[0][1] == 0.4
