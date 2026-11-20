from typing import List, Optional
from pydantic import BaseModel, Field


class CandidateInput(BaseModel):
    chunk_id: str
    content: str
    file_path: Optional[str] = "unknown"
    symbol_name: Optional[str] = None
    start_line: Optional[int] = 1
    end_line: Optional[int] = 1


class RerankRequest(BaseModel):
    query: str = Field(..., description="Natural language search query")
    candidates: List[CandidateInput] = Field(..., description="Candidates retrieved from BM25 or dense retrieval")
    top_k: int = Field(10, description="Number of top candidates to return")


class ScoredCandidateResponse(BaseModel):
    chunk_id: str
    file_path: str
    symbol_name: Optional[str]
    start_line: int
    end_line: int
    content: str
    score: float
    rank: int


class RerankResponse(BaseModel):
    query: str
    total_candidates: int
    top_k: int
    results: List[ScoredCandidateResponse]
