from typing import List, Optional, Tuple
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.symbol import CodeChunk, Symbol, SymbolType


class ASTStructuralRetriever:
    """
    Retrieves code chunks based on structural AST properties:
    - Symbol type matching (classes, functions, decorators, methods)
    - Parent class / enclosure hierarchy
    - Signature patterns
    """

    async def search(
        self,
        session: AsyncSession,
        symbol_type: Optional[SymbolType] = None,
        parent_name: Optional[str] = None,
        name_pattern: Optional[str] = None,
        repository_id: Optional[uuid.UUID] = None,
        top_k: int = 20,
    ) -> List[Tuple[uuid.UUID, float]]:
        """
        Executes AST structural query and returns associated (chunk_id, score).
        """
        stmt = (
            select(Symbol, CodeChunk.id)
            .join(CodeChunk, Symbol.id == CodeChunk.symbol_id)
            .join(File, Symbol.file_id == File.id)
        )

        if repository_id:
            stmt = stmt.where(File.repository_id == repository_id)

        if symbol_type:
            stmt = stmt.where(Symbol.symbol_type == symbol_type)

        if name_pattern:
            stmt = stmt.where(Symbol.name.ilike(f"%{name_pattern}%"))

        if parent_name:
            # Join with parent symbol to match parent's name
            parent_alias = Symbol
            stmt = stmt.join(
                parent_alias, Symbol.parent_symbol_id == parent_alias.id
            ).where(parent_alias.name.ilike(f"%{parent_name}%"))

        stmt = stmt.limit(top_k)
        res = await session.execute(stmt)
        rows = res.all()

        results: List[Tuple[uuid.UUID, float]] = []
        for sym, chunk_id in rows:
            # Structural match score
            score = 0.8
            if symbol_type and sym.symbol_type == symbol_type:
                score += 0.1
            results.append((chunk_id, min(1.0, score)))

        return results
