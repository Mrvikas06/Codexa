import uuid
from app.models.symbol import ChunkType, Symbol, SymbolType
from app.services.ingestion.chunker import SemanticChunker
from app.services.ingestion.parser.base import ParsedSymbol

CODE = """def func_one():
    return 1

def func_two():
    return 2
"""


def test_semantic_chunker():
    chunker = SemanticChunker()
    file_id = uuid.uuid4()
    repo_id = uuid.uuid4()

    parsed_symbols = [
        ParsedSymbol("func_one", SymbolType.FUNCTION, start_line=1, end_line=2),
        ParsedSymbol("func_two", SymbolType.FUNCTION, start_line=4, end_line=5),
    ]

    symbols = [
        Symbol(
            id=uuid.uuid4(),
            file_id=file_id,
            name="func_one",
            symbol_type=SymbolType.FUNCTION,
            start_line=1,
            end_line=2,
        ),
        Symbol(
            id=uuid.uuid4(),
            file_id=file_id,
            name="func_two",
            symbol_type=SymbolType.FUNCTION,
            start_line=4,
            end_line=5,
        ),
    ]

    chunks = chunker.chunk_file(
        file_id=file_id,
        repository_id=repo_id,
        file_path="src/math.py",
        content=CODE,
        language="python",
        symbols=symbols,
        parsed_symbols=parsed_symbols,
    )

    assert len(chunks) >= 2
    f1_chunk = next(c for c in chunks if c.start_line == 1)
    assert f1_chunk.chunk_type == ChunkType.FUNCTION
    assert "func_one" in f1_chunk.content
    assert f1_chunk.extra_metadata["symbol_name"] == "func_one"
    assert f1_chunk.extra_metadata["file_path"] == "src/math.py"
    assert f1_chunk.content_hash is not None
