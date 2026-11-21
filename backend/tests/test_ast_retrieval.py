import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace
from app.services.retrieval.ast_retrieval import ASTStructuralRetriever


@pytest.mark.asyncio
async def test_ast_structural_retriever(db_session: AsyncSession):
    user = User(email="ast@codeatlas.ai", username="astuser", hashed_password="pw")
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
        path="src/service.py",
        filename="service.py",
        extension=".py",
        language="python",
        content_hash="h1",
    )
    db_session.add(file_obj)
    await db_session.flush()

    sym_cls = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="UserService",
        symbol_type=SymbolType.CLASS,
        start_line=1,
        end_line=20,
    )
    db_session.add(sym_cls)
    await db_session.flush()

    sym_func = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="find_user",
        symbol_type=SymbolType.METHOD,
        start_line=5,
        end_line=10,
        parent_symbol_id=sym_cls.id,
    )
    db_session.add(sym_func)
    await db_session.flush()

    chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=sym_func.id,
        chunk_type=ChunkType.METHOD,
        content="def find_user(id): pass",
        content_hash="ch1",
        start_line=5,
        end_line=10,
        language="python",
    )
    db_session.add(chunk)
    await db_session.commit()

    retriever = ASTStructuralRetriever()
    results = await retriever.search(
        session=db_session,
        symbol_type=SymbolType.METHOD,
        name_pattern="find_user",
        repository_id=repo.id,
    )

    assert len(results) >= 1
    assert results[0][0] == chunk.id
    assert results[0][1] >= 0.8
