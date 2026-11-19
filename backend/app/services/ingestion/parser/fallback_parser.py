import re
from typing import List
from app.models.symbol import DependencyType, SymbolType
from app.services.ingestion.parser.base import (
    BaseASTParser,
    ParsedDependency,
    ParsedFile,
    ParsedSymbol,
)

# Common heuristics for functions and classes across languages
FUNC_REGEX = re.compile(
    r"^(?:(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)|"  # JS/TS function
    r"(?:public|private|protected|static|\s)*func\s+(?:\([^\)]+\)\s+)?([A-Za-z0-9_]+)|"  # Go func
    r"(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)|"  # Rust fn
    r"(?:def|fun)\s+([A-Za-z0-9_]+))",  # Ruby / Kotlin
    re.MULTILINE,
)

CLASS_REGEX = re.compile(
    r"^(?:(?:export\s+)?class\s+([A-Za-z0-9_$]+)|"  # JS/TS class
    r"(?:type|struct)\s+([A-Za-z0-9_]+)\s+struct|"  # Go struct
    r"(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z0-9_]+))",  # Rust
    re.MULTILINE,
)

IMPORT_REGEX = re.compile(
    r"^(?:import\s+.*?from\s+['\"](.*?)['\"]|import\s+['\"](.*?)['\"]|"
    r"require\(['\"](.*?)['\"]\)|use\s+([A-Za-z0-9_:]+);)",
    re.MULTILINE,
)


class FallbackParser(BaseASTParser):
    def __init__(self, language: str = "generic"):
        self.language = language

    def parse(self, code: str, file_path: str = "") -> ParsedFile:
        parsed_file = ParsedFile(language=self.language)
        lines = code.splitlines()
        total_lines = len(lines)

        # Extract imports
        for match in IMPORT_REGEX.finditer(code):
            target = next((g for g in match.groups() if g is not None), "")
            if target and target not in parsed_file.imports:
                parsed_file.imports.append(target)

        # Scan line by line for function and class definitions
        for line_idx, line in enumerate(lines, start=1):
            stripped = line.strip()

            # Class match
            c_match = CLASS_REGEX.match(stripped)
            if c_match:
                name = next((g for g in c_match.groups() if g is not None), "")
                if name:
                    parsed_file.symbols.append(
                        ParsedSymbol(
                            name=name,
                            symbol_type=SymbolType.CLASS,
                            start_line=line_idx,
                            end_line=min(line_idx + 20, total_lines),
                            signature=stripped,
                        )
                    )
                continue

            # Function match
            f_match = FUNC_REGEX.match(stripped)
            if f_match:
                name = next((g for g in f_match.groups() if g is not None), "")
                if name:
                    parsed_file.symbols.append(
                        ParsedSymbol(
                            name=name,
                            symbol_type=SymbolType.FUNCTION,
                            start_line=line_idx,
                            end_line=min(line_idx + 15, total_lines),
                            signature=stripped,
                        )
                    )

        return parsed_file
