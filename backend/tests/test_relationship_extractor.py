import uuid
from app.models.symbol import DependencyType, Symbol, SymbolType
from app.services.ingestion.parser.base import ParsedDependency, ParsedSymbol
from app.services.ingestion.relationship_extractor import extract_relationships


def test_extract_relationships():
    file_id = uuid.uuid4()
    caller = Symbol(
        id=uuid.uuid4(),
        file_id=file_id,
        name="authenticate",
        symbol_type=SymbolType.FUNCTION,
        start_line=1,
        end_line=10,
    )
    callee = Symbol(
        id=uuid.uuid4(),
        file_id=file_id,
        name="verify_jwt",
        symbol_type=SymbolType.FUNCTION,
        start_line=11,
        end_line=20,
    )

    symbol_map = {
        "authenticate": caller,
        "verify_jwt": callee,
    }

    parsed_symbols = [
        ParsedSymbol(
            name="authenticate",
            symbol_type=SymbolType.FUNCTION,
            start_line=1,
            end_line=10,
            outgoing_dependencies=[
                ParsedDependency(
                    target_name="verify_jwt",
                    dependency_type=DependencyType.CALLS,
                    line_number=5,
                )
            ],
        )
    ]

    dependencies = extract_relationships(parsed_symbols, symbol_map)
    assert len(dependencies) == 1
    dep = dependencies[0]
    assert dep.source_symbol_id == caller.id
    assert dep.target_symbol_id == callee.id
    assert dep.dependency_type == DependencyType.CALLS
