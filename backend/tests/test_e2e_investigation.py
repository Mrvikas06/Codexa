import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Dependency, DependencyType, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace


@pytest.mark.asyncio
async def test_end_to_end_investigation_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """
    Full end-to-end integration test:
    1. Repository creation
    2. File & Symbol persistence
    3. Hybrid code search
    4. Graph dependency inspection
    5. Natural language conversation query
    6. Grounded response with verified citations
    """
    # 1. Setup workspace & repository
    user = User(email="e2e@codeatlas.ai", username="e2euser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="E2EWS", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(workspace_id=ws.id, name="e2erepo", status=RepositoryStatus.INDEXED)
    db_session.add(repo)
    await db_session.flush()

    # 2. Add files and symbols
    f_auth = File(
        repository_id=repo.id,
        path="src/security/auth.py",
        filename="auth.py",
        extension=".py",
        language="python",
        content_hash="h-auth",
        line_count=20,
    )
    f_api = File(
        repository_id=repo.id,
        path="src/api/routes.py",
        filename="routes.py",
        extension=".py",
        language="python",
        content_hash="h-api",
        line_count=30,
    )
    db_session.add_all([f_auth, f_api])
    await db_session.flush()

    sym_auth = Symbol(
        id=uuid.uuid4(),
        file_id=f_auth.id,
        name="verify_jwt_token",
        symbol_type=SymbolType.FUNCTION,
        start_line=5,
        end_line=15,
        signature="def verify_jwt_token(token: str) -> bool",
    )
    sym_route = Symbol(
        id=uuid.uuid4(),
        file_id=f_api.id,
        name="login_handler",
        symbol_type=SymbolType.FUNCTION,
        start_line=10,
        end_line=25,
        signature="def login_handler(request)",
    )
    db_session.add_all([sym_auth, sym_route])
    await db_session.flush()

    chunk_auth = CodeChunk(
        id=uuid.uuid4(),
        file_id=f_auth.id,
        symbol_id=sym_auth.id,
        chunk_type=ChunkType.FUNCTION,
        content="def verify_jwt_token(token: str) -> bool:\n    return decode(token).is_valid()",
        content_hash="c-auth",
        start_line=5,
        end_line=15,
        language="python",
        extra_metadata={"file_path": "src/security/auth.py", "symbol_name": "verify_jwt_token"},
    )
    db_session.add(chunk_auth)

    # Dependency: login_handler calls verify_jwt_token
    dep = Dependency(
        source_symbol_id=sym_route.id,
        target_symbol_id=sym_auth.id,
        dependency_type=DependencyType.CALLS,
    )
    db_session.add(dep)
    await db_session.commit()

    # 3. Test Hybrid Retrieval
    search_res = await client.post(
        "/api/v1/search/hybrid",
        json={"query": "verify_jwt_token", "repository_id": str(repo.id), "top_k": 5},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total_results"] >= 1
    assert search_data["results"][0]["file_path"] == "src/security/auth.py"

    # 4. Test Graph Intelligence
    graph_res = await client.get(f"/api/v1/graph/{repo.id}")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert graph_data["total_nodes"] >= 4
    assert graph_data["total_edges"] >= 3

    # Impact analysis: changing verify_jwt_token impacts login_handler
    impact_res = await client.get(f"/api/v1/graph/{repo.id}/impact/{sym_auth.id}")
    assert impact_res.status_code == 200
    impact_data = impact_res.json()
    assert any(up["label"] == "login_handler" for up in impact_data["upstream_dependents"])

    # 5. Test AI Investigation Conversation
    conv_res = await client.post(
        "/api/v1/conversations",
        json={"repository_id": str(repo.id), "title": "Auth Verification Flow"},
    )
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["id"]

    msg_res = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Where is verify_jwt_token implemented and who calls it?"},
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert msg_data["role"] == "assistant"
    assert "src/security/auth.py" in msg_data["content"]
    assert len(msg_data["evidence_references"]) >= 1
    assert msg_data["evidence_references"][0]["is_verified"] is True
