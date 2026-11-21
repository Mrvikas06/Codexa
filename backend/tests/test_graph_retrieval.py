import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Dependency, DependencyType, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace
from app.services.retrieval.graph_retrieval import DependencyGraphRetriever


@pytest.mark.asyncio
async def test_dependency_graph_retriever(db_session: AsyncSession):
    user = User(email="graph@codeatlas.ai", username="graphuser", hashed_password="pw")
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
        path="src/router.py",
        filename="router.py",
        extension=".py",
        language="python",
        content_hash="h1",
    )
    db_session.add(file_obj)
    await db_session.flush()

    # Route handler calls auth function
    caller_sym = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="login_endpoint",
        symbol_type=SymbolType.FUNCTION,
        start_line=1,
        end_line=5,
    )
    callee_sym = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="verify_credentials",
        symbol_type=SymbolType.FUNCTION,
        start_line=10,
        end_line=15,
    )
    db_session.add(caller_sym)
    db_session.add(callee_sym)
    await db_session.flush()

    # Dependency edge
    dep = Dependency(
        source_symbol_id=caller_sym.id,
        target_symbol_id=callee_sym.id,
        dependency_type=DependencyType.CALLS,
    )
    db_session.add(dep)

    # Chunks
    caller_chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=caller_sym.id,
        chunk_type=ChunkType.FUNCTION,
        content="def login_endpoint(): verify_credentials()",
        content_hash="c_caller",
        start_line=1,
        end_line=5,
        language="python",
    )
    callee_chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=callee_sym.id,
        chunk_type=ChunkType.FUNCTION,
        content="def verify_credentials(): pass",
        content_hash="c_callee",
        start_line=10,
        end_line=15,
        language="python",
    )
    db_session.add(caller_chunk)
    db_session.add(callee_chunk)
    await db_session.commit()

    retriever = DependencyGraphRetriever()
    # Expand from caller -> should find callee
    results = await retriever.expand(db_session, seed_symbol_ids=[caller_sym.id], max_hops=1)

    assert len(results) >= 1
    found_ids = [r[0] for r in results]
    assert callee_chunk.id in found_ids
