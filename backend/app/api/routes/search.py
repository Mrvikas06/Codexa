from typing import List
from fastapi import APIRouter
from app.api.dependencies import DBSession
from app.api.schemas.search import HybridSearchRequest, HybridSearchResponse, SearchHitResponse
from app.services.embedding import EmbeddingService
from app.services.reranker import RerankerService
from app.services.retrieval.hybrid import HybridRetrievalPipeline

router = APIRouter(prefix="/search", tags=["Hybrid Retrieval Engine"])

_pipeline = None


def get_pipeline() -> HybridRetrievalPipeline:
    global _pipeline
    if _pipeline is None:
        emb_service = EmbeddingService()
        rerank_service = RerankerService()
        _pipeline = HybridRetrievalPipeline(emb_service, rerank_service)
    return _pipeline


@router.post("/hybrid", response_model=HybridSearchResponse)
async def hybrid_search(request: HybridSearchRequest, db: DBSession) -> HybridSearchResponse:
    pipeline = get_pipeline()
    results = await pipeline.retrieve(
        session=db,
        query=request.query,
        repository_id=request.repository_id,
        language=request.language,
        top_k=request.top_k,
        enable_reranker=request.enable_reranker,
    )

    hits = [
        SearchHitResponse(
            chunk_id=r.chunk_id,
            file_path=r.file_path,
            symbol_name=r.symbol_name,
            chunk_type=r.chunk_type,
            start_line=r.start_line,
            end_line=r.end_line,
            language=r.language,
            content=r.content,
            rrf_score=r.rrf_score,
            reranker_score=r.reranker_score,
            rank=r.final_rank,
            retrieval_sources=r.retrieval_sources,
            provenance=r.provenance,
        )
        for r in results
    ]

    return HybridSearchResponse(
        query=request.query,
        total_results=len(hits),
        results=hits,
    )
