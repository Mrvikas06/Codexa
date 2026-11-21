from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class HybridSearchRequest(BaseModel):
    query: str = Field(..., description="Developer question or search terms")
    repository_id: Optional[uuid.UUID] = Field(None, description="Optional target repository filter")
    language: Optional[str] = Field(None, description="Optional language filter (e.g. 'python')")
    top_k: int = Field(10, description="Number of results to return")
    enable_reranker: bool = Field(True, description="Whether to apply Model B cross-encoder reranking")


class SearchHitResponse(BaseModel):
    chunk_id: str
    file_path: str
    symbol_name: Optional[str]
    chunk_type: str
    start_line: int
    end_line: int
    language: str
    content: str
    rrf_score: float
    reranker_score: float
    rank: int
    retrieval_sources: List[str]
    provenance: Dict[str, Any]


class HybridSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchHitResponse]
