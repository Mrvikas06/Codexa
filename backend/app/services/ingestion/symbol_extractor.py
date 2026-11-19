import uuid
from typing import Dict, List, Tuple
from app.models.symbol import Symbol
from app.services.ingestion.parser.base import ParsedSymbol


def extract_symbols(
    file_id: uuid.UUID,
    parsed_symbols: List[ParsedSymbol],
) -> Tuple[List[Symbol], Dict[str, Symbol]]:
    """
    Constructs persistent Symbol models from ParsedSymbols, resolving parent-child linkages
    (such as class methods pointing to their parent class).
    Returns (symbols_list, symbols_by_name_map).
    """
    symbols_by_name: Dict[str, Symbol] = {}
    created_symbols: List[Symbol] = []

    # First pass: Create parent symbols (classes, top-level functions)
    for ps in parsed_symbols:
        if not ps.parent_name:
            sym = Symbol(
                id=uuid.uuid4(),
                file_id=file_id,
                name=ps.name,
                symbol_type=ps.symbol_type,
                start_line=ps.start_line,
                end_line=ps.end_line,
                signature=ps.signature,
                docstring=ps.docstring,
                parent_symbol_id=None,
            )
            symbols_by_name[ps.name] = sym
            created_symbols.append(sym)

    # Second pass: Create child symbols (methods with parent_name)
    for ps in parsed_symbols:
        if ps.parent_name:
            parent_sym = symbols_by_name.get(ps.parent_name)
            parent_id = parent_sym.id if parent_sym else None
            sym = Symbol(
                id=uuid.uuid4(),
                file_id=file_id,
                name=ps.name,
                symbol_type=ps.symbol_type,
                start_line=ps.start_line,
                end_line=ps.end_line,
                signature=ps.signature,
                docstring=ps.docstring,
                parent_symbol_id=parent_id,
            )
            composite_key = f"{ps.parent_name}.{ps.name}"
            symbols_by_name[composite_key] = sym
            created_symbols.append(sym)

    return created_symbols, symbols_by_name
