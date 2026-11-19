import uuid
from typing import Dict, List
from app.models.symbol import Dependency, Symbol
from app.services.ingestion.parser.base import ParsedSymbol


def extract_relationships(
    parsed_symbols: List[ParsedSymbol],
    symbol_map: Dict[str, Symbol],
) -> List[Dependency]:
    """
    Extracts cross-symbol dependencies (calls, inherits, decorates) based on parsed references
    and maps them to database Dependency models between verified symbols.
    """
    dependencies: List[Dependency] = []
    seen_pairs = set()

    for ps in parsed_symbols:
        source_key = f"{ps.parent_name}.{ps.name}" if ps.parent_name else ps.name
        source_sym = symbol_map.get(source_key) or symbol_map.get(ps.name)

        if not source_sym:
            continue

        for dep in ps.outgoing_dependencies:
            target_sym = symbol_map.get(dep.target_name)
            if not target_sym or target_sym.id == source_sym.id:
                continue

            pair_key = (source_sym.id, target_sym.id, dep.dependency_type.value)
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            dependencies.append(
                Dependency(
                    id=uuid.uuid4(),
                    source_symbol_id=source_sym.id,
                    target_symbol_id=target_sym.id,
                    dependency_type=dep.dependency_type,
                )
            )

    return dependencies
