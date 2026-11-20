import torch
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.evaluation.encoder_eval import compute_mrr, compute_ndcg_at_k, evaluate_code_retrieval
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer


def test_ranking_metrics_calculation():
    # Ranks: [1, 2, 4] -> MRR = (1/1 + 1/2 + 1/4) / 3 = 1.75 / 3 = 0.5833
    ranks = [1, 2, 4]
    mrr = compute_mrr(ranks)
    assert abs(mrr - 0.5833) < 0.01

    ndcg = compute_ndcg_at_k(ranks, k=10)
    assert ndcg > 0.0


def test_evaluate_code_retrieval():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    pairs = [
        ("authenticate user", "def authenticate_user(): pass"),
        ("database connect", "def connect_database(): pass"),
        ("hash password", "def hash_password(): pass"),
    ]
    texts = [p[0] for p in pairs] + [p[1] for p in pairs]
    tokenizer.train(texts)

    config = CodeEncoderConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
    )
    model = CodeEncoder(config)
    device = torch.device("cpu")

    results = evaluate_code_retrieval(model, tokenizer, pairs, device, max_seq_len=32)

    assert "recall@5" in results
    assert "recall@10" in results
    assert "mrr" in results
    assert "ndcg@10" in results
    assert 0.0 <= results["recall@5"] <= 1.0
    assert 0.0 <= results["mrr"] <= 1.0
