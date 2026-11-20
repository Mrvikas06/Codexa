import math
from typing import Dict, List, Tuple
import torch
import torch.nn.functional as F
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import PAD_ID


def compute_mrr(ranks: List[int]) -> float:
    if not ranks:
        return 0.0
    return sum(1.0 / rank for rank in ranks) / len(ranks)


def compute_ndcg_at_k(ranks: List[int], k: int = 10) -> float:
    if not ranks:
        return 0.0
    scores = []
    for rank in ranks:
        if rank <= k:
            dcg = 1.0 / math.log2(rank + 1)
            scores.append(dcg)
        else:
            scores.append(0.0)
    return sum(scores) / len(scores)


def evaluate_code_retrieval(
    model: CodeEncoder,
    tokenizer: ByteLevelBPETokenizer,
    query_code_pairs: List[Tuple[str, str]],
    device: torch.device,
    max_seq_len: int = 512,
) -> Dict[str, float]:
    """
    Evaluates CodeEncoder on zero-shot retrieval over test query-code pairs.
    Returns:
        {
            "recall@5": float,
            "recall@10": float,
            "mrr": float,
            "ndcg@10": float,
        }
    """
    if not query_code_pairs:
        return {"recall@5": 0.0, "recall@10": 0.0, "mrr": 0.0, "ndcg@10": 0.0}

    model.eval()
    model.to(device)

    queries = [p[0] for p in query_code_pairs]
    codes = [p[1] for p in query_code_pairs]
    n = len(query_code_pairs)

    def encode_texts(texts: List[str]) -> torch.Tensor:
        all_embeddings = []
        batch_size = 32
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i : i + batch_size]
                ids_list = [
                    tokenizer.encode(t, add_special_tokens=True, max_length=max_seq_len)
                    for t in batch_texts
                ]
                max_len = max(len(ids) for ids in ids_list)
                padded = [ids + [PAD_ID] * (max_len - len(ids)) for ids in ids_list]
                mask = [[1] * len(ids) + [0] * (max_len - len(ids)) for ids in ids_list]

                in_tensor = torch.tensor(padded, dtype=torch.long, device=device)
                mask_tensor = torch.tensor(mask, dtype=torch.long, device=device)

                emb = model.encode(in_tensor, mask_tensor)
                all_embeddings.append(emb.cpu())
        return torch.cat(all_embeddings, dim=0)

    query_embeddings = encode_texts(queries)
    code_embeddings = encode_texts(codes)

    # Compute cosine similarity matrix: (n_queries, n_codes)
    similarity = torch.matmul(query_embeddings, code_embeddings.T)

    ranks: List[int] = []
    recall_at_5_count = 0
    recall_at_10_count = 0

    for i in range(n):
        # The correct matching code is at index i
        sim_scores = similarity[i]
        sorted_indices = torch.argsort(sim_scores, descending=True).tolist()
        rank = sorted_indices.index(i) + 1  # 1-based rank
        ranks.append(rank)

        if rank <= 5:
            recall_at_5_count += 1
        if rank <= 10:
            recall_at_10_count += 1

    return {
        "recall@5": recall_at_5_count / n,
        "recall@10": recall_at_10_count / n,
        "mrr": compute_mrr(ranks),
        "ndcg@10": compute_ndcg_at_k(ranks, k=10),
    }
