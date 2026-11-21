from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.file import File
from app.models.symbol import CodeChunk, Symbol, SymbolType
from app.services.embedding import EmbeddingService
from app.services.reranker import RerankerService
from app.services.retrieval.ast_retrieval import ASTStructuralRetriever
from app.services.retrieval.bm25 import BM25Index
from app.services.retrieval.dense import DenseRetriever
from app.services.retrieval.graph_retrieval import DependencyGraphRetriever
from app.services.retrieval.query import expand_query, extract_keywords
from app.services.retrieval.rrf import ReciprocalRankFusion, RetrievalTrace
from app.services.retrieval.symbol import SymbolSearchEngine

logger = get_logger("services.retrieval.hybrid")


@dataclass
class HybridSearchResult:
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
    final_rank: int
    retrieval_sources: List[str]
    provenance: Dict[str, Any] = field(default_factory=dict)


class HybridRetrievalPipeline:
    """
    Production-grade hybrid retrieval pipeline:
    Query Expansion -> 5-Way Independent Retrieval (BM25, Dense, Symbol, AST, Graph)
    -> Reciprocal Rank Fusion (RRF) -> Candidate Filtering -> Cross-Encoder Reranking (Model B)
    -> Ranked Evidence Selection with Full Retrieval Tracing.
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        reranker_service: RerankerService,
        bm25_index: Optional[BM25Index] = None,
    ):
        self.embedding_service = embedding_service
        self.reranker_service = reranker_service
        self.bm25 = bm25_index or BM25Index()
        self.dense = DenseRetriever(embedding_service)
        self.symbol_search = SymbolSearchEngine()
        self.ast_retriever = ASTStructuralRetriever()
        self.graph_retriever = DependencyGraphRetriever()
        self.rrf = ReciprocalRankFusion(k=60)

    async def retrieve(
        self,
        session: AsyncSession,
        query: str,
        repository_id: Optional[uuid.UUID] = None,
        language: Optional[str] = None,
        top_k: int = 10,
        candidate_pool_size: int = 30,
        enable_reranker: bool = True,
    ) -> List[HybridSearchResult]:
        if not query.strip():
            return []

        expanded_q = expand_query(query)
        keywords = extract_keywords(query)

        # Build in-memory BM25 index if empty
        if not self.bm25.doc_ids:
            chunk_stmt = select(CodeChunk.id, CodeChunk.content)
            if repository_id:
                chunk_stmt = chunk_stmt.join(File, CodeChunk.file_id == File.id).where(
                    File.repository_id == repository_id
                )
            chunk_res = await session.execute(chunk_stmt)
            docs = chunk_res.all()
            self.bm25.index_documents(docs)

        # 1. Run all 5 retrieval subsystems independently
        ranked_lists: Dict[str, List[Tuple[uuid.UUID, float]]] = {}

        # Subsystem 1: BM25 Lexical Retrieval
        bm25_results = self.bm25.search(expanded_q, top_k=candidate_pool_size)
        ranked_lists["bm25"] = bm25_results

        # Subsystem 2: Dense Vector Retrieval (Model A)
        dense_results = await self.dense.search(
            session, query, repository_id=repository_id, top_k=candidate_pool_size
        )
        ranked_lists["dense"] = dense_results

        # Subsystem 3: Symbol Search
        symbol_results = await self.symbol_search.search(
            session, query, repository_id=repository_id, top_k=candidate_pool_size
        )
        ranked_lists["symbol"] = symbol_results

        # Subsystem 4: AST Structural Retrieval
        ast_results = await self.ast_retriever.search(
            session,
            name_pattern=keywords[0] if keywords else None,
            repository_id=repository_id,
            top_k=candidate_pool_size,
        )
        ranked_lists["ast"] = ast_results

        # Subsystem 5: Dependency Graph-Guided Retrieval
        # Find seed symbols from top symbol results to traverse graph
        seed_symbol_stmt = (
            select(CodeChunk.symbol_id)
            .where(
                CodeChunk.id.in_([r[0] for r in symbol_results[:3]]),
                CodeChunk.symbol_id.isnot(None),
            )
        )
        seed_res = await session.execute(seed_symbol_stmt)
        seed_symbol_ids = [s for s in seed_res.scalars().all() if s is not None]

        graph_results = await self.graph_retriever.expand(
            session, seed_symbol_ids, max_hops=1, top_k=candidate_pool_size
        )
        ranked_lists["graph"] = graph_results

        # 2. Reciprocal Rank Fusion (RRF)
        system_weights = {
            "bm25": 1.2,
            "dense": 1.5,
            "symbol": 1.3,
            "ast": 1.0,
            "graph": 0.9,
        }
        fused_traces = self.rrf.fuse(
            ranked_lists, weights=system_weights, top_k=candidate_pool_size
        )

        if not fused_traces:
            return []

        # 3. Fetch full chunk entities from database
        chunk_ids = [t.chunk_id for t in fused_traces]
        stmt = (
            select(CodeChunk)
            .where(CodeChunk.id.in_(chunk_ids))
            .options(selectinload(CodeChunk.file))
        )
        if language:
            stmt = stmt.where(CodeChunk.language == language)

        res = await session.execute(stmt)
        chunks_map = {c.id: c for c in res.scalars().all()}

        # Align valid chunks with traces
        valid_chunks: List[CodeChunk] = []
        valid_traces: List[RetrievalTrace] = []

        for trace in fused_traces:
            chunk = chunks_map.get(trace.chunk_id)
            if chunk:
                valid_chunks.append(chunk)
                valid_traces.append(trace)

        if not valid_chunks:
            return []

        # 4. Neural Cross-Encoder Reranking (Model B)
        final_results: List[HybridSearchResult] = []

        if enable_reranker:
            reranked_cands = self.reranker_service.rerank(
                query=query,
                candidates=valid_chunks,
                top_k=top_k,
            )
            # Map by chunk_id
            trace_map = {str(t.chunk_id): t for t in valid_traces}
            chunk_by_id = {str(c.id): c for c in valid_chunks}

            for rc in reranked_cands:
                t = trace_map.get(rc.chunk_id)
                ch = chunk_by_id.get(rc.chunk_id)
                meta = ch.extra_metadata or {} if ch else {}

                final_results.append(
                    HybridSearchResult(
                        chunk_id=rc.chunk_id,
                        file_path=rc.file_path,
                        symbol_name=rc.symbol_name,
                        chunk_type=ch.chunk_type.value if ch else "unknown",
                        start_line=rc.start_line,
                        end_line=rc.end_line,
                        language=ch.language if ch else "unknown",
                        content=rc.content,
                        rrf_score=t.rrf_score if t else 0.0,
                        reranker_score=rc.score,
                        final_rank=rc.rank,
                        retrieval_sources=list(t.ranks_by_system.keys()) if t else [],
                        provenance=t.scores_by_system if t else {},
                    )
                )
        else:
            for rank_idx, (ch, t) in enumerate(zip(valid_chunks[:top_k], valid_traces[:top_k]), start=1):
                meta = ch.extra_metadata or {}
                final_results.append(
                    HybridSearchResult(
                        chunk_id=str(ch.id),
                        file_path=meta.get("file_path", "unknown"),
                        symbol_name=meta.get("symbol_name"),
                        chunk_type=ch.chunk_type.value,
                        start_line=ch.start_line,
                        end_line=ch.end_line,
                        language=ch.language,
                        content=ch.content,
                        rrf_score=t.rrf_score,
                        reranker_score=0.0,
                        final_rank=rank_idx,
                        retrieval_sources=list(t.ranks_by_system.keys()),
                        provenance=t.scores_by_system,
                    )
                )

        return final_results
