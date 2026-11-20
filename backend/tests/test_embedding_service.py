import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.models.ml import ModelStatus, ModelType, ModelVersion
from app.models.symbol import ChunkType, CodeChunk, Embedding
from app.services.embedding import EmbeddingService


@pytest.mark.asyncio
async def test_embedding_service_persistence(db_session: AsyncSession):
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
    service = EmbeddingService(model=model, tokenizer=tokenizer, device_str="cpu")

    # Direct generate_embeddings test
    texts = ["def foo(): return 1", "def bar(): return 2"]
    vectors = service.generate_embeddings(texts, max_seq_len=32)
    assert len(vectors) == 2
    assert len(vectors[0]) == config.hidden_size

    # DB persistence test
    mv = ModelVersion(
        id=uuid.uuid4(),
        name="test-encoder",
        model_type=ModelType.ENCODER,
        version="1.0",
        architecture={"hidden_size": 32},
        status=ModelStatus.READY,
    )
    db_session.add(mv)
    await db_session.flush()

    file_id = uuid.uuid4()
    chunk1 = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_id,
        chunk_type=ChunkType.FUNCTION,
        content="def hello(): pass",
        content_hash="hash1",
        start_line=1,
        end_line=2,
        language="python",
    )
    chunk2 = CodeChunk(
        id=uuid.uuid4(),
        file_id=file_id,
        chunk_type=ChunkType.FUNCTION,
        content="def world(): pass",
        content_hash="hash2",
        start_line=3,
        end_line=4,
        language="python",
    )
    db_session.add(chunk1)
    db_session.add(chunk2)
    await db_session.commit()

    count = await service.index_chunks(db_session, [chunk1, chunk2], mv.id)
    assert count == 2

    # Query embeddings
    res = await db_session.execute(select(Embedding).where(Embedding.model_version_id == mv.id))
    embs = res.scalars().all()
    assert len(embs) == 2
    assert len(embs[0].vector) == config.hidden_size
