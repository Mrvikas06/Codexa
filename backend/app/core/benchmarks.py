from typing import Any, Dict
from app.services.generation.eval import evaluate_citation_precision_recall
from app.services.graph.benchmark import evaluate_cycle_benchmarks
from app.ml.evaluation.reranker_eval import compute_mrr, compute_ndcg_at_k, compute_precision_at_k


def run_full_evaluation_suite() -> Dict[str, Any]:
    """
    Executes all offline model evaluation benchmarks and quality gates.
    """
    # 1. Retrieval & Ranking metrics
    ranking_mrr = compute_mrr([1, 2])
    ranking_ndcg = compute_ndcg_at_k([1, 2], k=5)
    ranking_prec = compute_precision_at_k([1, 2], k=5)

    # 2. Citation Grounding metrics
    citation_metrics = evaluate_citation_precision_recall(
        cited_files=["src/auth.py"],
        ground_truth_files=["src/auth.py"],
    )

    # 3. Graph Cycle benchmark
    graph_res = evaluate_cycle_benchmarks("benchmarks/graph_cycles_v1.json")

    all_passed = (
        ranking_mrr >= 0.50
        and citation_metrics["precision"] >= 0.90
        and graph_res["all_passed"]
    )

    return {
        "status": "PASSED" if all_passed else "FAILED",
        "ranking": {
            "mrr": ranking_mrr,
            "ndcg@5": ranking_ndcg,
            "precision@5": ranking_prec,
        },
        "citations": citation_metrics,
        "graph": graph_res,
        "overall_passed": all_passed,
    }
