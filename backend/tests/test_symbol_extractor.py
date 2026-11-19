import uuid
from app.models.symbol import SymbolType
from app.services.ingestion.parser.base import ParsedSymbol
from app.services.ingestion.symbol_extractor import extract_symbols


def test_extract_symbols_parent_child_hierarchy():
    file_id = uuid.uuid4()
    parsed_symbols = [
        ParsedSymbol(
            name="UserManager",
            symbol_type=SymbolType.CLASS,
            start_line=1,
            end_line=50,
            signature="class UserManager",
            docstring="Manages users",
        ),
        ParsedSymbol(
            name="create_user",
            symbol_type=SymbolType.METHOD,
            start_line=10,
            end_line=25,
            signature="def create_user(self, email)",
            parent_name="UserManager",
        ),
    ]

    symbols, symbol_map = extract_symbols(file_id, parsed_symbols)
    assert len(symbols) == 2

    cls_sym = symbol_map["UserManager"]
    method_sym = symbol_map["UserManager.create_user"]

    assert cls_sym.parent_symbol_id is None
    assert method_sym.parent_symbol_id == cls_sym.id
    assert method_sym.file_id == file_id
