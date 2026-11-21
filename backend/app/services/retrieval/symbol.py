from typing import List, Optional, Tuple
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.symbol import CodeChunk, Symbol, SymbolType


class SymbolSearchEngine:
    """
    Symbol search engine matching queries against function, class, and method names,
    signatures, and docstrings.
    Priority scoring:
    1. Exact symbol name match (1.0)
    2. Prefix symbol name match (0.8)
    3. Case-insensitive substring in name (0.6)
    4. Substring in signature or docstring (0.4)
    """

    async def search(
        self,
        session: AsyncSession,
        query: str,
        repository_id: Optional[uuid.UUID] = None,
        top_k: int = 20,
    ) -> List[Tuple[uuid.UUID, float]]:
        """
        Searches symbols and maps matches back to their associated CodeChunk IDs.
        Returns (chunk_id, relevance_score).
        """
        clean_q = query.strip().lower()
        if not clean_q:
            return []

        stmt = select(Symbol, CodeChunk.id).join(CodeChunk, Symbol.id == CodeChunk.symbol_id)
        if repository_id:
            stmt = stmt.join(File, Symbol.file_id == File.id).where(File.repository_id == repository_id)

        # Filter by name, signature, or docstring
        filter_clause = or_(
            Symbol.name.ilike(f"%{clean_q}%"),
            Symbol.signature.ilike(f"%{clean_q}%"),
            Symbol.docstring.ilike(f"%{clean_q}%"),
        )
        stmt = stmt.where(filter_clause).limit(top_k * 3)

        res = await session.execute(stmt)
        matches = res.all()

        scored_chunks: List[Tuple[uuid.UUID, float]] = []
        seen_chunks = set()

        for sym, chunk_id in matches:
            if chunk_id in seen_chunks:
                continue

            name_lower = sym.name.lower()
            score = 0.4

            if name_lower == clean_q:
                score = 1.0
            elif name_lower.startswith(clean_q):
                score = 0.8
            elif clean_q in name_lower:
                score = 0.6

            scored_chunks.append((chunk_id, score))
            seen_chunks.add(chunk_id)

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]
