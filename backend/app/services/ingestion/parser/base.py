from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from app.models.symbol import DependencyType, SymbolType


@dataclass
class ParsedDependency:
    target_name: str
    dependency_type: DependencyType
    line_number: int


@dataclass
class ParsedSymbol:
    name: str
    symbol_type: SymbolType
    start_line: int
    end_line: int
    signature: Optional[str] = None
    docstring: Optional[str] = None
    parent_name: Optional[str] = None
    outgoing_dependencies: List[ParsedDependency] = field(default_factory=list)


@dataclass
class ParsedFile:
    language: str
    symbols: List[ParsedSymbol] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    has_syntax_errors: bool = False
    error_message: Optional[str] = None


class BaseASTParser(ABC):
    @abstractmethod
    def parse(self, code: str, file_path: str = "") -> ParsedFile:
        """Parses source code into structured symbols and dependencies."""
        pass
