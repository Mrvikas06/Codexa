import torch
from app.ml.evaluation.reranker_eval import compute_mrr, compute_ndcg_at_k, compute_precision_at_k, evaluate_reranker
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer


def test_ranking_metric_functions():
    ranks = [1, 2, 3]
    assert compute_precision_at_k(ranks, k=1) == 1 / 3
    assert compute_precision_at_k(ranks, k=2) == 2 / 3
    assert compute_precision_at_k(ranks, k=3) == 1.0

    mrr = compute_mrr(ranks)
    assert abs(mrr - (1.0 + 0.5 + 0.3333) / 3) < 0.01

    ndcg = compute_ndcg_at_k(ranks, k=5)
    assert ndcg > 0.0


def test_evaluate_reranker():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    samples = [
        {
            "query": "find auth",
            "positive": "def auth(): pass",
            "negatives": ["def other1(): pass", "def other2(): pass"],
        },
        {
            "query": "find db",
            "positive": "def db(): pass",
            "negatives": ["def unrelated(): pass"],
        },
    ]

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

    results = evaluate_reranker(model, tokenizer, samples, device)
    assert "pairwise_accuracy" in results
    assert "mrr" in results
    assert "ndcg@5" in results
    assert "precision@1" in results
    assert 0.0 <= results["pairwise_accuracy"] <= 1.0
