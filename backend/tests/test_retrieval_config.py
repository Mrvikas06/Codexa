from app.services.retrieval.config import RetrievalWeights


def test_retrieval_weights_defaults():
    cfg = RetrievalWeights()
    assert cfg.dense_weight == 1.0
    assert cfg.bm25_weight == 1.0
    assert cfg.symbol_weight == 1.2
    assert cfg.ast_weight == 0.8
    assert cfg.graph_weight == 0.7
    assert cfg.rrf_k == 60
    assert cfg.top_candidates == 50
    assert cfg.rerank_top_k == 10
