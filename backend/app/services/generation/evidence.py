from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from app.services.retrieval.hybrid import HybridSearchResult


@dataclass
class EvidenceCandidate:
    chunk_id: str
    file_path: str
    symbol_name: Optional[str]
    chunk_type: str
    start_line: int
    end_line: int
    language: str
    content: str
    score: float
    retrieval_sources: List[str]
    provenance: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_hybrid_result(cls, res: HybridSearchResult) -> "EvidenceCandidate":
        return cls(
            chunk_id=res.chunk_id,
            file_path=res.file_path,
            symbol_name=res.symbol_name,
            chunk_type=res.chunk_type,
            start_line=res.start_line,
            end_line=res.end_line,
            language=res.language,
            content=res.content,
            score=res.reranker_score if res.reranker_score != 0.0 else res.rrf_score,
            retrieval_sources=res.retrieval_sources,
            provenance=res.provenance,
        )


class EvidenceContextAssembler:
    """
    Assembles top hybrid retrieval evidence into structured context for Model C decoder
    or grounded generation.
    """

    def assemble(self, query: str, candidates: List[EvidenceCandidate]) -> str:
        if not candidates:
            return f"User Query: {query}\n\nEvidence Context: No relevant repository evidence found."

        sections = [f"User Query: {query}\n\nRepository Evidence:"]
        for idx, cand in enumerate(candidates, start=1):
            sym_str = f" | Symbol: {cand.symbol_name}" if cand.symbol_name else ""
            sources_str = ", ".join(cand.retrieval_sources)
            header = f"[{idx}] File: {cand.file_path} (Lines {cand.start_line}-{cand.end_line}){sym_str} | Sources: {sources_str}"
            code_block = f"```{cand.language}\n{cand.content.strip()}\n```"
            sections.append(f"{header}\n{code_block}")

        return "\n\n".join(sections)
