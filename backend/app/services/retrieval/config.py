from dataclasses import dataclass
from typing import Optional


@dataclass
class RetrievalWeights:
    dense_weight: float = 1.0
    bm25_weight: float = 1.0
    symbol_weight: float = 1.2
    ast_weight: float = 0.8
    graph_weight: float = 0.7
    rrf_k: int = 60
    top_candidates: int = 50
    rerank_top_k: int = 10
