import math
from typing import Dict, List, Tuple
import torch
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer


def compute_precision_at_k(ranks: List[int], k: int) -> float:
    if not ranks:
        return 0.0
    return sum(1 for r in ranks if r <= k) / len(ranks)


def compute_mrr(ranks: List[int]) -> float:
    if not ranks:
        return 0.0
    return sum(1.0 / r for r in ranks) / len(ranks)


def compute_ndcg_at_k(ranks: List[int], k: int = 5) -> float:
    if not ranks:
        return 0.0
    scores = []
    for r in ranks:
        if r <= k:
            dcg = 1.0 / math.log2(r + 1)
            scores.append(dcg)
        else:
            scores.append(0.0)
    return sum(scores) / len(scores)


def evaluate_reranker(
    model: CrossEncoderReranker,
    tokenizer: ByteLevelBPETokenizer,
    benchmark_samples: List[Dict[str, any]],
    device: torch.device,
) -> Dict[str, float]:
    """
    Evaluates reranker on queries with 1 positive code candidate and multiple hard negatives.
    Computes:
    - pairwise_accuracy: % of times positive score > negative score
    - mrr: Mean Reciprocal Rank
    - ndcg@5: Normalized Discounted Cumulative Gain
    - precision@1, precision@3, precision@5
    """
    model.eval()
    model.to(device)

    ranks: List[int] = []
    pairwise_correct = 0
    total_pairs = 0

    for item in benchmark_samples:
        query = item["query"]
        pos_code = item["positive"]
        neg_codes = item["negatives"]

        all_candidates = [pos_code] + neg_codes
        pairs = [(query, c) for c in all_candidates]

        scores = model.score_pairs(tokenizer, pairs, device)
        pos_score = scores[0]

        for neg_score in scores[1:]:
            total_pairs += 1
            if pos_score > neg_score:
                pairwise_correct += 1

        # Sort indices by descending score
        indexed_scores = list(enumerate(scores))
        indexed_scores.sort(key=lambda x: x[1], reverse=True)

        # Find 1-based rank of the positive candidate (index 0)
        rank = next(r + 1 for r, (idx, _) in enumerate(indexed_scores) if idx == 0)
        ranks.append(rank)

    return {
        "pairwise_accuracy": pairwise_correct / max(1, total_pairs),
        "mrr": compute_mrr(ranks),
        "ndcg@5": compute_ndcg_at_k(ranks, k=5),
        "precision@1": compute_precision_at_k(ranks, k=1),
        "precision@3": compute_precision_at_k(ranks, k=3),
        "precision@5": compute_precision_at_k(ranks, k=5),
    }
