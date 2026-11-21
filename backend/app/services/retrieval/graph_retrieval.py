from typing import Dict, List, Optional, Set, Tuple
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.symbol import CodeChunk, Dependency, Symbol


class DependencyGraphRetriever:
    """
    Expands retrieval by exploring the code dependency graph:
    Traverses calls, imports, inherits, and decorator edges up to max_hops (default 1-2).
    Discovers related caller and callee chunks connected to an initial seed set of symbols.
    """

    async def expand(
        self,
        session: AsyncSession,
        seed_symbol_ids: List[uuid.UUID],
        max_hops: int = 1,
        top_k: int = 15,
    ) -> List[Tuple[uuid.UUID, float]]:
        """
        Traverses outgoing and incoming dependencies from seed symbols.
        Returns (chunk_id, score) where closer hops receive higher scores.
        """
        if not seed_symbol_ids:
            return []

        visited_symbol_ids: Set[uuid.UUID] = set(seed_symbol_ids)
        current_layer: Set[uuid.UUID] = set(seed_symbol_ids)
        symbol_scores: Dict[uuid.UUID, float] = {}

        for hop in range(1, max_hops + 1):
            hop_decay = 0.8 ** hop
            stmt = select(Dependency.source_symbol_id, Dependency.target_symbol_id).where(
                or_(
                    Dependency.source_symbol_id.in_(list(current_layer)),
                    Dependency.target_symbol_id.in_(list(current_layer)),
                )
            )
            res = await session.execute(stmt)
            edges = res.all()

            next_layer: Set[uuid.UUID] = set()
            for src, tgt in edges:
                for sym_id in (src, tgt):
                    if sym_id not in visited_symbol_ids:
                        next_layer.add(sym_id)
                        visited_symbol_ids.add(sym_id)
                        symbol_scores[sym_id] = hop_decay

            current_layer = next_layer
            if not current_layer:
                break

        if not symbol_scores:
            return []

        # Map discovered symbols to their CodeChunks
        chunk_stmt = (
            select(CodeChunk.id, CodeChunk.symbol_id)
            .where(CodeChunk.symbol_id.in_(list(symbol_scores.keys())))
            .limit(top_k * 2)
        )
        chunk_res = await session.execute(chunk_stmt)
        chunk_rows = chunk_res.all()

        scored_chunks: List[Tuple[uuid.UUID, float]] = []
        seen = set()

        for chunk_id, sym_id in chunk_rows:
            if chunk_id in seen:
                continue
            seen.add(chunk_id)
            score = symbol_scores.get(sym_id, 0.5)
            scored_chunks.append((chunk_id, score))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]
