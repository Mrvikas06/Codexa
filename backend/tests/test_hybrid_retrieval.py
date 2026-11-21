import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.models.file import File
from app.models.ml import ModelStatus, ModelType, ModelVersion
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import ChunkType, CodeChunk, Symbol, SymbolType
from app.models.user import User
from app.models.workspace import Workspace
from app.services.embedding import EmbeddingService
from app.services.reranker import RerankerService
from app.services.retrieval.hybrid import HybridRetrievalPipeline


@pytest.mark.asyncio
async def test_hybrid_retrieval_pipeline_end_to_end(db_session: AsyncSession):
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    enc_config = CodeEncoderConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=256,
    )
    encoder = CodeEncoder(enc_config)
    rerank_config = RerankerConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=256,
    )
    reranker = CrossEncoderReranker(rerank_config)

    emb_service = EmbeddingService(model=encoder, tokenizer=tokenizer, device_str="cpu")
    rerank_service = RerankerService(model=reranker, tokenizer=tokenizer, device_str="cpu")

    # DB Records
    user = User(email="hybrid@codeatlas.ai", username="hybriduser", hashed_password="pw")
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

    sym = Symbol(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        name="validate_token",
        symbol_type=SymbolType.FUNCTION,
        start_line=1,
        end_line=5,
        signature="def validate_token(token)",
    )
    db_session.add(sym)
    await db_session.flush()

    chunk = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_obj.id,
        symbol_id=sym.id,
        chunk_type=ChunkType.FUNCTION,
        content="def validate_token(token):\n    return verify_jwt(token)",
        content_hash="c1",
        start_line=1,
        end_line=5,
        language="python",
        extra_metadata={"file_path": "src/auth.py", "symbol_name": "validate_token"},
    )
    db_session.add(chunk)
    await db_session.commit()

    # Index embedding
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
    await emb_service.index_chunks(db_session, [chunk], mv_id)

    # Run Pipeline
    pipeline = HybridRetrievalPipeline(emb_service, rerank_service)
    results = await pipeline.retrieve(
        session=db_session,
        query="validate authentication token",
        repository_id=repo.id,
        top_k=2,
    )

    assert len(results) >= 1
    top = results[0]
    assert top.chunk_id == str(chunk.id)
    assert top.file_path == "src/auth.py"
    assert top.symbol_name == "validate_token"
    assert top.rrf_score > 0.0
    assert len(top.retrieval_sources) >= 1
