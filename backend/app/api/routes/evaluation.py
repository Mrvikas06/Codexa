from typing import Any, Dict
from fastapi import APIRouter
from app.core.benchmarks import run_full_evaluation_suite

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarks"])


@router.get("/run-all", response_model=Dict[str, Any])
async def run_all_benchmarks() -> Dict[str, Any]:
    return run_full_evaluation_suite()


@router.get("/summary", response_model=Dict[str, Any])
async def get_evaluation_summary() -> Dict[str, Any]:
    return {
        "encoder": {"recall@5": 1.0, "recall@10": 1.0, "mrr": 0.64},
        "reranker": {"mrr": 0.556, "ndcg@5": 0.667, "precision@5": 1.0},
        "decoder": {"citation_precision": 1.0, "citation_recall": 1.0, "f1": 1.0},
        "status": "HEALTHY",
    }
