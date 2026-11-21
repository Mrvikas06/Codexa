import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import Dependency, DependencyType, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace
from app.services.graph.builder import CodeGraphBuilder


@pytest.mark.asyncio
async def test_code_graph_builder(db_session: AsyncSession):
    user = User(email="graph@codeatlas.ai", username="graphuser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="GraphWS", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(workspace_id=ws.id, name="graphrepo", status=RepositoryStatus.INDEXED)
    db_session.add(repo)
    await db_session.flush()

    f1 = File(repository_id=repo.id, path="src/a.py", filename="a.py", extension=".py", language="python", content_hash="h1")
    f2 = File(repository_id=repo.id, path="src/b.py", filename="b.py", extension=".py", language="python", content_hash="h2")
    db_session.add_all([f1, f2])
    await db_session.flush()

    sym_a = Symbol(id=uuid.uuid4(), file_id=f1.id, name="func_a", symbol_type=SymbolType.FUNCTION, start_line=1, end_line=5)
    sym_b = Symbol(id=uuid.uuid4(), file_id=f2.id, name="func_b", symbol_type=SymbolType.FUNCTION, start_line=1, end_line=5)
    db_session.add_all([sym_a, sym_b])
    await db_session.flush()

    dep = Dependency(source_symbol_id=sym_a.id, target_symbol_id=sym_b.id, dependency_type=DependencyType.CALLS)
    db_session.add(dep)
    await db_session.commit()

    builder = CodeGraphBuilder()
    graph = await builder.build_repository_graph(db_session, repo.id, include_symbols=True)

    assert str(f1.id) in graph.nodes
    assert str(f2.id) in graph.nodes
    assert str(sym_a.id) in graph.nodes
    assert str(sym_b.id) in graph.nodes
    assert len(graph.edges) >= 3
