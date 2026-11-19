import hashlib
import uuid
from typing import Any, Dict, List, Optional
from app.models.symbol import ChunkType, CodeChunk, Symbol
from app.services.ingestion.parser.base import ParsedSymbol


def estimate_token_count(text: str) -> int:
    """Estimates token count using character heuristics (~3.8 chars per subword token)."""
    if not text:
        return 0
    return max(1, int(len(text) / 3.8))


def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()


class SemanticChunker:
    """
    Chunks code files along semantic AST boundaries (functions, classes, methods),
    falling back to line-based sliding windows with overlap when AST symbols are not present.
    """

    def __init__(self, target_chunk_lines: int = 60, overlap_lines: int = 15):
        self.target_chunk_lines = target_chunk_lines
        self.overlap_lines = overlap_lines

    def chunk_file(
        self,
        file_id: uuid.UUID,
        repository_id: uuid.UUID,
        file_path: str,
        content: str,
        language: str,
        symbols: List[Symbol],
        parsed_symbols: List[ParsedSymbol],
    ) -> List[CodeChunk]:
        chunks: List[CodeChunk] = []
        lines = content.splitlines()
        total_lines = len(lines)

        if total_lines == 0:
            return chunks

        # Create symbol map by (start_line, name)
        symbol_by_start = {s.start_line: s for s in symbols}

        covered_lines = set()

        # 1. Semantic chunks from extracted symbols
        for ps in parsed_symbols:
            s_line = max(1, ps.start_line)
            e_line = min(total_lines, max(s_line, ps.end_line))

            chunk_lines = lines[s_line - 1 : e_line]
            chunk_content = "\n".join(chunk_lines)

            chunk_type_map = {
                "function": ChunkType.FUNCTION,
                "method": ChunkType.METHOD,
                "class": ChunkType.CLASS,
            }
            c_type = chunk_type_map.get(ps.symbol_type.value, ChunkType.FUNCTION)

            db_symbol = symbol_by_start.get(ps.start_line)
            symbol_id = db_symbol.id if db_symbol else None

            extra_meta: Dict[str, Any] = {
                "repository_id": str(repository_id),
                "file_path": file_path,
                "symbol_name": ps.name,
                "symbol_type": ps.symbol_type.value,
                "start_line": s_line,
                "end_line": e_line,
                "language": language,
                "chunk_type": c_type.value,
                "content_hash": compute_content_hash(chunk_content),
            }

            chunks.append(
                CodeChunk(
                    id=uuid.uuid4(),
                    file_id=file_id,
                    symbol_id=symbol_id,
                    chunk_type=c_type,
                    content=chunk_content,
                    content_hash=extra_meta["content_hash"],
                    start_line=s_line,
                    end_line=e_line,
                    language=language,
                    token_count=estimate_token_count(chunk_content),
                    extra_metadata=extra_meta,
                )
            )

            for i in range(s_line, e_line + 1):
                covered_lines.add(i)

        # 2. Module-level or uncovered code fallback (sliding window)
        uncovered_start = 1
        while uncovered_start <= total_lines:
            # Check if region is covered
            if uncovered_start in covered_lines:
                uncovered_start += 1
                continue

            # Find range of uncovered block
            uncovered_end = uncovered_start
            while (
                uncovered_end + 1 <= total_lines
                and (uncovered_end + 1) not in covered_lines
                and (uncovered_end - uncovered_start < self.target_chunk_lines)
            ):
                uncovered_end += 1

            block_lines = lines[uncovered_start - 1 : uncovered_end]
            block_content = "\n".join(block_lines).strip()

            if block_content:
                c_hash = compute_content_hash(block_content)
                extra_meta = {
                    "repository_id": str(repository_id),
                    "file_path": file_path,
                    "symbol_name": None,
                    "symbol_type": None,
                    "start_line": uncovered_start,
                    "end_line": uncovered_end,
                    "language": language,
                    "chunk_type": ChunkType.MODULE.value if uncovered_start == 1 else ChunkType.UNKNOWN.value,
                    "content_hash": c_hash,
                }

                chunks.append(
                    CodeChunk(
                        id=uuid.uuid4(),
                        file_id=file_id,
                        symbol_id=None,
                        chunk_type=ChunkType.MODULE if uncovered_start == 1 else ChunkType.UNKNOWN,
                        content=block_content,
                        content_hash=c_hash,
                        start_line=uncovered_start,
                        end_line=uncovered_end,
                        language=language,
                        token_count=estimate_token_count(block_content),
                        extra_metadata=extra_meta,
                    )
                )

            uncovered_start = uncovered_end + 1

        return chunks
