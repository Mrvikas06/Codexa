import torch
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer


def test_cross_encoder_forward_tensor_shape():
    config = RerankerConfig(
        vocab_size=300,
        hidden_size=64,
        num_layers=2,
        num_heads=2,
        intermediate_size=128,
        max_seq_len=64,
    )
    model = CrossEncoderReranker(config)

    batch_size = 4
    seq_len = 24
    input_ids = torch.randint(0, config.vocab_size, (batch_size, seq_len))
    attention_mask = torch.ones((batch_size, seq_len), dtype=torch.long)
    attention_mask[:, -6:] = 0

    scores = model(input_ids, attention_mask)
    assert scores.shape == (batch_size, 1)


def test_cross_encoder_score_pairs():
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
    device = torch.device("cpu")

    pairs = [
        ("auth function", "def authenticate(): pass"),
        ("db connect", "def connect_db(): pass"),
    ]

    scores = model.score_pairs(tokenizer, pairs, device)
    assert len(scores) == 2
    assert isinstance(scores[0], float)
