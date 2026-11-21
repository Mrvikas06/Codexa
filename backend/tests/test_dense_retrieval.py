import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.models.file import File
from app.models.ml import ModelStatus, ModelType, ModelVersion
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Embedding
from app.models.user import User
from app.models.workspace import Workspace
from app.services.embedding import EmbeddingService
from app.services.retrieval.dense import DenseRetriever


@pytest.mark.asyncio
async def test_dense_retriever(db_session: AsyncSession):
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    config = CodeEncoderConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
    )
    model = CodeEncoder(config)
    emb_service = EmbeddingService(model=model, tokenizer=tokenizer, device_str="cpu")

    # DB records
    user = User(email="dense@codeatlas.ai", username="denseuser", hashed_password="pw")
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
        path="src/dense.py",
        filename="dense.py",
        extension=".py",
        language="python",
        content_hash="h1",
    )
    db_session.add(file_obj)
    await db_session.flush()

    chunk1 = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        chunk_type=ChunkType.FUNCTION,
        content="def authenticate_jwt(): pass",
        content_hash="c1",
        start_line=1,
        end_line=2,
        language="python",
    )
    chunk2 = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        chunk_type=ChunkType.FUNCTION,
        content="def compute_fibonacci(): pass",
        content_hash="c2",
        start_line=3,
        end_line=4,
        language="python",
    )
    db_session.add(chunk1)
    db_session.add(chunk2)
    await db_session.commit()

    mv_id = uuid.uuid4()
    mv = ModelVersion(
        id=mv_id,
        name="test-mv",
        model_type=ModelType.ENCODER,
        version="1.0",
        architecture={"hidden": 32},
        status=ModelStatus.READY,
    )
    db_session.add(mv)
    await db_session.commit()

    await emb_service.index_chunks(db_session, [chunk1, chunk2], mv_id)

    retriever = DenseRetriever(emb_service)
    results = await retriever.search(db_session, "authenticate token", repository_id=repo.id, top_k=2)

    assert len(results) == 2
    assert results[0][0] in (chunk1.id, chunk2.id)
    assert isinstance(results[0][1], float)
