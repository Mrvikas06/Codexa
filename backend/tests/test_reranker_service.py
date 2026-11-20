import uuid
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.models.symbol import ChunkType, CodeChunk
from app.services.reranker import RerankerService


def test_reranker_service():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    config = RerankerConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
    )
    model = CrossEncoderReranker(config)
    service = RerankerService(model=model, tokenizer=tokenizer, device_str="cpu")

    chunk1 = CodeChunk(
        id=uuid.uuid4(),
        file_id=uuid.uuid4(),
        chunk_type=ChunkType.FUNCTION,
        content="def authenticate_user(token):\n    return verify(token)",
        content_hash="h1",
        start_line=1,
        end_line=2,
        language="python",
        extra_metadata={"file_path": "src/auth.py", "symbol_name": "authenticate_user"},
    )
    chunk2 = CodeChunk(
        id=uuid.uuid4(),
        file_id=uuid.uuid4(),
        chunk_type=ChunkType.FUNCTION,
        content="def calculate_total(items):\n    return sum(items)",
        content_hash="h2",
        start_line=10,
        end_line=11,
        language="python",
        extra_metadata={"file_path": "src/math.py", "symbol_name": "calculate_total"},
    )

    reranked = service.rerank(
        query="Where is user authentication?",
        candidates=[chunk1, chunk2],
        top_k=2,
    )

    assert len(reranked) == 2
    assert reranked[0].rank == 1
    assert reranked[1].rank == 2
    assert reranked[0].score >= reranked[1].score
    assert reranked[0].file_path in ("src/auth.py", "src/math.py")
