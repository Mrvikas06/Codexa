from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import torch

from app.core.logging import get_logger
from app.ml.device import get_device
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.models.symbol import CodeChunk

logger = get_logger("services.reranker")


@dataclass
class RerankedCandidate:
    chunk_id: str
    file_path: str
    symbol_name: Optional[str]
    start_line: int
    end_line: int
    content: str
    score: float
    rank: int


class RerankerService:
    def __init__(
        self,
        model: Optional[CrossEncoderReranker] = None,
        tokenizer: Optional[ByteLevelBPETokenizer] = None,
        device_str: str = "auto",
    ):
        self.device = get_device(device_str)
        self.tokenizer = tokenizer or ByteLevelBPETokenizer()
        self.model = model or CrossEncoderReranker(RerankerConfig())
        self.model.to(self.device)
        self.model.eval()

    def rerank(
        self,
        query: str,
        candidates: List[CodeChunk],
        top_k: int = 10,
    ) -> List[RerankedCandidate]:
        """
        Reranks a list of candidate CodeChunks using Model B (Cross-Encoder).
        Returns top_k candidates sorted by relevance score descending.
        """
        if not candidates:
            return []

        pairs = [(query, c.content) for c in candidates]
        scores = self.model.score_pairs(self.tokenizer, pairs, self.device)

        scored_candidates = []
        for chunk, score in zip(candidates, scores):
            meta = chunk.extra_metadata or {}
            scored_candidates.append(
                RerankedCandidate(
                    chunk_id=str(chunk.id),
                    file_path=meta.get("file_path", "unknown"),
                    symbol_name=meta.get("symbol_name"),
                    start_line=chunk.start_line,
                    end_line=chunk.end_line,
                    content=chunk.content,
                    score=float(score),
                    rank=0,
                )
            )

        scored_candidates.sort(key=lambda x: x.score, reverse=True)

        for rank_idx, cand in enumerate(scored_candidates[:top_k], start=1):
            cand.rank = rank_idx

        return scored_candidates[:top_k]
