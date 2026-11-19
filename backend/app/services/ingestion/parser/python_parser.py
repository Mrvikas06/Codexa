import ast
from typing import List, Optional
from app.models.symbol import DependencyType, SymbolType
from app.services.ingestion.parser.base import (
    BaseASTParser,
    ParsedDependency,
    ParsedFile,
    ParsedSymbol,
)


class CallVisitor(ast.NodeVisitor):
    def __init__(self):
        self.calls: List[tuple[str, int]] = []

    def visit_Call(self, node: ast.Call):
        name = ""
        if isinstance(node.func, ast.Name):
            name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            name = node.func.attr
        if name:
            self.calls.append((name, getattr(node, "lineno", 0)))
        self.generic_visit(node)


class PythonASTParser(BaseASTParser):
    def parse(self, code: str, file_path: str = "") -> ParsedFile:
        parsed_file = ParsedFile(language="python")

        try:
            tree = ast.parse(code, filename=file_path)
        except SyntaxError as e:
            parsed_file.has_syntax_errors = True
            parsed_file.error_message = f"SyntaxError at line {e.lineno}: {e.msg}"
            return parsed_file
        except Exception as e:
            parsed_file.has_syntax_errors = True
            parsed_file.error_message = f"Parse failed: {type(e).__name__} {str(e)}"
            return parsed_file

        # Process top-level imports and body
        for node in tree.body:
            if isinstance(node, ast.Import):
                for alias in node.names:
                    parsed_file.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    full_name = f"{module}.{alias.name}" if module else alias.name
                    parsed_file.imports.append(full_name)
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self._extract_function(node, parsed_file, parent_name=None)
            elif isinstance(node, ast.ClassDef):
                self._extract_class(node, parsed_file)

        return parsed_file

    def _extract_function(
        self,
        node: ast.FunctionDef | ast.AsyncFunctionDef,
        parsed_file: ParsedFile,
        parent_name: Optional[str] = None,
    ) -> ParsedSymbol:
        start_line = node.lineno
        end_line = getattr(node, "end_lineno", node.lineno)
        docstring = ast.get_docstring(node)

        # Build signature
        params = [arg.arg for arg in node.args.args]
        sig_prefix = "async def" if isinstance(node, ast.AsyncFunctionDef) else "def"
        signature = f"{sig_prefix} {node.name}({', '.join(params)})"

        sym_type = SymbolType.METHOD if parent_name else SymbolType.FUNCTION

        symbol = ParsedSymbol(
            name=node.name,
            symbol_type=sym_type,
            start_line=start_line,
            end_line=end_line,
            signature=signature,
            docstring=docstring,
            parent_name=parent_name,
        )

        # Decorators
        for dec in node.decorator_list:
            dec_name = ""
            if isinstance(dec, ast.Name):
                dec_name = dec.id
            elif isinstance(dec, ast.Attribute):
                dec_name = dec.attr
            elif isinstance(dec, ast.Call):
                if isinstance(dec.func, ast.Name):
                    dec_name = dec.func.id
                elif isinstance(dec.func, ast.Attribute):
                    dec_name = dec.func.attr
            if dec_name:
                symbol.outgoing_dependencies.append(
                    ParsedDependency(
                        target_name=dec_name,
                        dependency_type=DependencyType.DECORATES,
                        line_number=getattr(dec, "lineno", start_line),
                    )
                )

        # Function calls inside body
        call_visitor = CallVisitor()
        for stmt in node.body:
            call_visitor.visit(stmt)

        for target_name, line_no in call_visitor.calls:
            symbol.outgoing_dependencies.append(
                ParsedDependency(
                    target_name=target_name,
                    dependency_type=DependencyType.CALLS,
                    line_number=line_no,
                )
            )

        parsed_file.symbols.append(symbol)
        return symbol

    def _extract_class(self, node: ast.ClassDef, parsed_file: ParsedFile) -> ParsedSymbol:
        start_line = node.lineno
        end_line = getattr(node, "end_lineno", node.lineno)
        docstring = ast.get_docstring(node)

        # Bases for inheritance
        bases = []
        for b in node.bases:
            if isinstance(b, ast.Name):
                bases.append(b.id)
            elif isinstance(b, ast.Attribute):
                bases.append(b.attr)

        sig = f"class {node.name}" + (f"({', '.join(bases)})" if bases else "")

        cls_symbol = ParsedSymbol(
            name=node.name,
            symbol_type=SymbolType.CLASS,
            start_line=start_line,
            end_line=end_line,
            signature=sig,
            docstring=docstring,
            parent_name=None,
        )

        for base_name in bases:
            cls_symbol.outgoing_dependencies.append(
                ParsedDependency(
                    target_name=base_name,
                    dependency_type=DependencyType.INHERITS,
                    line_number=start_line,
                )
            )

        parsed_file.symbols.append(cls_symbol)

        # Process class methods and nested items
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self._extract_function(item, parsed_file, parent_name=node.name)

        return cls_symbol
