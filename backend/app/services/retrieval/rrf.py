from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import uuid


@dataclass
class RetrievalTrace:
    chunk_id: uuid.UUID
    rrf_score: float
    ranks_by_system: Dict[str, int] = field(default_factory=dict)
    scores_by_system: Dict[str, float] = field(default_factory=dict)


class ReciprocalRankFusion:
    """
    Reciprocal Rank Fusion (RRF) for combining ranked lists from multiple search systems:
    RRF(d) = sum_{m in M} (w_m / (k + rank_m(d)))
    Guarantees that documents appearing highly across multiple diverse systems
    get boosted to the top of the combined candidate pool.
    """

    def __init__(self, k: int = 60):
        self.k = k

    def fuse(
        self,
        ranked_lists: Dict[str, List[Tuple[uuid.UUID, float]]],
        weights: Optional[Dict[str, float]] = None,
        top_k: int = 50,
    ) -> List[RetrievalTrace]:
        """
        Args:
            ranked_lists: mapping of system_name -> list of (chunk_id, original_score)
            weights: optional weight per system (default 1.0)
        Returns:
            Sorted list of RetrievalTrace objects with fused score and provenance.
        """
        weights = weights or {}
        traces: Dict[uuid.UUID, RetrievalTrace] = {}

        for system_name, items in ranked_lists.items():
            w = weights.get(system_name, 1.0)
            for rank_idx, (chunk_id, score) in enumerate(items, start=1):
                if chunk_id not in traces:
                    traces[chunk_id] = RetrievalTrace(
                        chunk_id=chunk_id,
                        rrf_score=0.0,
                    )

                trace = traces[chunk_id]
                contribution = w / (self.k + rank_idx)
                trace.rrf_score += contribution
                trace.ranks_by_system[system_name] = rank_idx
                trace.scores_by_system[system_name] = score

        fused_list = list(traces.values())
        fused_list.sort(key=lambda x: x.rrf_score, reverse=True)

        return fused_list[:top_k]
