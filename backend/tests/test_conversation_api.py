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
async def test_conversation_api_endpoints(client: AsyncClient, db_session: AsyncSession):
    # Setup database records
    user = User(email="chat@codeatlas.ai", username="chatuser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="ChatWS", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(workspace_id=ws.id, name="chatrepo", status=RepositoryStatus.INDEXED)
    db_session.add(repo)
    await db_session.flush()

    file_obj = File(
        repository_id=repo.id,
        path="src/auth.py",
        filename="auth.py",
        extension=".py",
        language="python",
        content_hash="hash-1",
    )
    db_session.add(file_obj)
    await db_session.flush()

    sym = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="verify_jwt",
        symbol_type=SymbolType.FUNCTION,
        start_line=1,
        end_line=5,
        signature="def verify_jwt(token: str) -> bool",
    )
    db_session.add(sym)
    await db_session.flush()

    chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=sym.id,
        chunk_type=ChunkType.FUNCTION,
        content="def verify_jwt(token: str) -> bool:\n    return True",
        content_hash="chunk-hash-1",
        start_line=1,
        end_line=5,
        language="python",
        extra_metadata={"file_path": "src/auth.py", "symbol_name": "verify_jwt"},
    )
    db_session.add(chunk)
    await db_session.commit()

    # 1. Create Conversation
    conv_res = await client.post(
        "/api/v1/conversations",
        json={"repository_id": str(repo.id), "title": "Auth Investigation"},
    )
    assert conv_res.status_code == 201
    conv_data = conv_res.json()
    conv_id = conv_data["id"]
    assert conv_data["title"] == "Auth Investigation"
    assert conv_data["repository_id"] == str(repo.id)

    # 2. List Conversations
    list_res = await client.get(f"/api/v1/conversations?repository_id={repo.id}")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data) >= 1
    assert any(c["id"] == conv_id for c in list_data)

    # 3. Post Message to Conversation (executes retrieval + generation + citation validation)
    msg_res = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Where is verify_jwt implemented?"},
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert msg_data["conversation_id"] == conv_id
    assert msg_data["role"] == "assistant"
    assert "src/auth.py" in msg_data["content"]
    assert msg_data["extra_metadata"] is not None
    assert len(msg_data["extra_metadata"]["investigation_steps"]) >= 1

    # 4. Get Conversation Detail
    detail_res = await client.get(f"/api/v1/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == conv_id
    # Should have 2 messages: user query and assistant response
    assert len(detail_data["messages"]) == 2
    assert detail_data["messages"][0]["role"] == "user"
    assert detail_data["messages"][1]["role"] == "assistant"
