import uuid
from app.services.retrieval.rrf import ReciprocalRankFusion


def test_reciprocal_rank_fusion():
    rrf = ReciprocalRankFusion(k=60)
    c1 = uuid.uuid4()
    c2 = uuid.uuid4()
    c3 = uuid.uuid4()

    # System 1: c1 rank 1, c2 rank 2
    # System 2: c2 rank 1, c1 rank 2
    # System 3: c1 rank 1, c3 rank 2
    ranked_lists = {
        "bm25": [(c1, 10.0), (c2, 8.0)],
        "dense": [(c2, 0.95), (c1, 0.90)],
        "symbol": [(c1, 1.0), (c3, 0.5)],
    }

    fused = rrf.fuse(ranked_lists, top_k=3)
    assert len(fused) == 3

    # c1 is ranked 1 in 2 systems, should be top
    top_chunk = fused[0]
    assert top_chunk.chunk_id == c1
    assert "bm25" in top_chunk.ranks_by_system
    assert "dense" in top_chunk.ranks_by_system
    assert "symbol" in top_chunk.ranks_by_system
    assert top_chunk.rrf_score > fused[1].rrf_score
