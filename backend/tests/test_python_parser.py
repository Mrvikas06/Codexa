from app.models.symbol import DependencyType, SymbolType
from app.services.ingestion.parser.python_parser import PythonASTParser

SAMPLE_CODE = '''
import os
from datetime import datetime

class AuthService:
    """Authentication management service."""
    def __init__(self, secret: str):
        self.secret = secret

    def validate_token(self, token: str) -> bool:
        """Validates incoming token."""
        return self._check(token)

    def _check(self, token: str) -> bool:
        return len(token) > 10

def generate_salt() -> str:
    return os.urandom(16).hex()
'''


def test_python_ast_parser_symbols():
    parser = PythonASTParser()
    parsed = parser.parse(SAMPLE_CODE, "auth.py")

    assert not parsed.has_syntax_errors
    assert "os" in parsed.imports
    assert "datetime.datetime" in parsed.imports

    sym_names = [s.name for s in parsed.symbols]
    assert "AuthService" in sym_names
    assert "validate_token" in sym_names
    assert "_check" in sym_names
    assert "generate_salt" in sym_names

    # Check class docstring and methods
    cls_sym = next(s for s in parsed.symbols if s.name == "AuthService")
    assert cls_sym.symbol_type == SymbolType.CLASS
    assert cls_sym.docstring == "Authentication management service."

    method_sym = next(s for s in parsed.symbols if s.name == "validate_token")
    assert method_sym.symbol_type == SymbolType.METHOD
    assert method_sym.parent_name == "AuthService"
    assert method_sym.docstring == "Validates incoming token."

    # Check function call extraction
    call_deps = [d for d in method_sym.outgoing_dependencies if d.dependency_type == DependencyType.CALLS]
    assert any(d.target_name == "_check" for d in call_deps)


def test_python_ast_parser_syntax_error_resilience():
    parser = PythonASTParser()
    bad_code = "def broken_syntax(:\n    pass"
    parsed = parser.parse(bad_code, "broken.py")

    assert parsed.has_syntax_errors
    assert parsed.error_message is not None
    assert "SyntaxError" in parsed.error_message
