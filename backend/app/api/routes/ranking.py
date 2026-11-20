import uuid
from typing import List
from fastapi import APIRouter, status
from app.api.schemas.ranking import RerankRequest, RerankResponse, ScoredCandidateResponse
from app.models.symbol import ChunkType, CodeChunk
from app.services.reranker import RerankerService

router = APIRouter(prefix="/ranking", tags=["Neural Reranker"])
_reranker_service = None


def get_reranker_service() -> RerankerService:
    global _reranker_service
    if _reranker_service is None:
        _reranker_service = RerankerService()
    return _reranker_service


@router.post("/rerank", response_model=RerankResponse)
async def rerank_candidates(request: RerankRequest) -> RerankerResponse:
    service = get_reranker_service()

    # Convert candidate inputs to CodeChunk instances
    chunks: List[CodeChunk] = []
    for c in request.candidates:
        try:
            cid = uuid.UUID(c.chunk_id)
        except ValueError:
            cid = uuid.uuid4()

        chunk = CodeChunk(
            id=cid,
            file_id=uuid.uuid4(),
            chunk_type=ChunkType.FUNCTION,
            content=c.content,
            content_hash="runtime",
            start_line=c.start_line or 1,
            end_line=c.end_line or 1,
            language="unknown",
            extra_metadata={
                "file_path": c.file_path,
                "symbol_name": c.symbol_name,
            },
        )
        chunks.append(chunk)

    reranked = service.rerank(request.query, chunks, top_k=request.top_k)

    results = [
        ScoredCandidateResponse(
            chunk_id=r.chunk_id,
            file_path=r.file_path,
            symbol_name=r.symbol_name,
            start_line=r.start_line,
            end_line=r.end_line,
            content=r.content,
            score=r.score,
            rank=r.rank,
        )
        for r in reranked
    ]

    return RerankResponse(
        query=request.query,
        total_candidates=len(request.candidates),
        top_k=request.top_k,
        results=results,
    )
