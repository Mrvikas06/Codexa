import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import Dependency, DependencyType, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace


@pytest.mark.asyncio
async def test_graph_api_endpoints(client: AsyncClient, db_session: AsyncSession):
    user = User(email="graphapi@codeatlas.ai", username="graphapiuser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="GraphAPIWS", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(workspace_id=ws.id, name="graphapirepo", status=RepositoryStatus.INDEXED)
    db_session.add(repo)
    await db_session.flush()

    f1 = File(repository_id=repo.id, path="src/main.py", filename="main.py", extension=".py", language="python", content_hash="h1")
    f2 = File(repository_id=repo.id, path="src/sub.py", filename="sub.py", extension=".py", language="python", content_hash="h2")
    db_session.add_all([f1, f2])
    await db_session.flush()

    sym1 = Symbol(id=uuid.uuid4(), file_id=f1.id, name="entrypoint", symbol_type=SymbolType.FUNCTION, start_line=1, end_line=10)
    sym2 = Symbol(id=uuid.uuid4(), file_id=f2.id, name="worker", symbol_type=SymbolType.FUNCTION, start_line=1, end_line=10)
    db_session.add_all([sym1, sym2])
    await db_session.flush()

    # Create cycle: sym1 -> sym2 and sym2 -> sym1
    dep1 = Dependency(source_symbol_id=sym1.id, target_symbol_id=sym2.id, dependency_type=DependencyType.CALLS)
    dep2 = Dependency(source_symbol_id=sym2.id, target_symbol_id=sym1.id, dependency_type=DependencyType.CALLS)
    db_session.add_all([dep1, dep2])
    await db_session.commit()

    # 1. GET /graph/{repository_id}
    res = await client.get(f"/api/v1/graph/{repo.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["total_nodes"] >= 4
    assert data["total_edges"] >= 4

    # 2. GET /graph/{repository_id}/cycles
    cycle_res = await client.get(f"/api/v1/graph/{repo.id}/cycles")
    assert cycle_res.status_code == 200
    cycle_data = cycle_res.json()
    assert cycle_data["count"] >= 1

    # 3. GET /graph/{repository_id}/impact/{target_id}
    impact_res = await client.get(f"/api/v1/graph/{repo.id}/impact/{sym1.id}")
    assert impact_res.status_code == 200
    impact_data = impact_res.json()
    assert impact_data["target_id"] == str(sym1.id)
    assert impact_data["total_affected_count"] >= 1

    # 4. GET /graph/{repository_id}/architecture
    arch_res = await client.get(f"/api/v1/graph/{repo.id}/architecture")
    assert arch_res.status_code == 200
    arch_data = arch_res.json()
    assert arch_data["total_nodes"] >= 4
    assert arch_data["density"] > 0
