import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation, Message, MessageRole
from app.models.file import File
from app.models.indexing import IndexingJob, JobStatus, JobType
from app.models.ml import ModelStatus, ModelType, ModelVersion
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.user import UserRepository


@pytest.mark.asyncio
async def test_user_repository_and_cascade(db_session: AsyncSession):
    user_repo = UserRepository()

    # Create user
    user = User(
        email="dev@codeatlas.ai",
        username="lead_engineer",
        hashed_password="hashed_pw_test",
    )
    created_user = await user_repo.create(db_session, user)
    assert created_user.id is not None
    assert created_user.email == "dev@codeatlas.ai"

    # Query via repository
    by_email = await user_repo.get_by_email(db_session, "dev@codeatlas.ai")
    assert by_email is not None
    assert by_email.id == created_user.id

    by_username = await user_repo.get_by_username(db_session, "lead_engineer")
    assert by_username is not None
    assert by_username.id == created_user.id

    # Create workspace
    workspace = Workspace(
        name="Primary Workspace",
        description="Core codebase intelligence workspace",
        owner_id=created_user.id,
    )
    db_session.add(workspace)
    await db_session.flush()
    assert workspace.id is not None

    # Create repository
    repo = Repository(
        workspace_id=workspace.id,
        name="Codexa",
        url="https://github.com/Mrvikas06/Codexa",
        status=RepositoryStatus.INDEXED,
        total_files=42,
    )
    db_session.add(repo)
    await db_session.flush()
    assert repo.id is not None

    # Create file
    file = File(
        repository_id=repo.id,
        path="src/auth/service.py",
        filename="service.py",
        extension=".py",
        language="python",
        content_hash="abc123hash",
        line_count=150,
    )
    db_session.add(file)
    await db_session.flush()

    # Create symbol & chunk
    symbol = Symbol(
        file_id=file.id,
        name="authenticate_user",
        symbol_type=SymbolType.FUNCTION,
        start_line=20,
        end_line=45,
        signature="def authenticate_user(token: str) -> User",
    )
    db_session.add(symbol)
    await db_session.flush()

    chunk = CodeChunk(
        file_id=file.id,
        symbol_id=symbol.id,
        chunk_type=ChunkType.FUNCTION,
        content="def authenticate_user(token: str) -> User:\n    return verify(token)",
        content_hash="chunkhash456",
        start_line=20,
        end_line=45,
        language="python",
    )
    db_session.add(chunk)
    await db_session.flush()

    # Create conversation and message
    conv = Conversation(
        workspace_id=workspace.id,
        repository_id=repo.id,
        title="Auth inspection",
    )
    db_session.add(conv)
    await db_session.flush()

    msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content="Where is authentication implemented?",
    )
    db_session.add(msg)
    await db_session.flush()

    # Create ModelVersion
    mv = ModelVersion(
        name="codeatlas-encoder-v1",
        model_type=ModelType.ENCODER,
        version="1.0.0",
        architecture={"layers": 6, "heads": 4, "hidden": 256},
        param_count=14_000_000,
        vocab_size=16000,
        status=ModelStatus.READY,
    )
    db_session.add(mv)
    await db_session.flush()

    # Create indexing job
    job = IndexingJob(
        repository_id=repo.id,
        job_type=JobType.FULL,
        status=JobStatus.COMPLETED,
        total_files=42,
        processed_files=42,
    )
    db_session.add(job)
    await db_session.flush()

    assert job.id is not None
    assert mv.id is not None
    assert msg.id is not None
