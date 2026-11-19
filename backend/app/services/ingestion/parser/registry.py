from typing import Dict
from app.services.ingestion.parser.base import BaseASTParser
from app.services.ingestion.parser.fallback_parser import FallbackParser
from app.services.ingestion.parser.python_parser import PythonASTParser

_PARSER_CACHE: Dict[str, BaseASTParser] = {}


def get_parser(language: str) -> BaseASTParser:
    lang = language.lower()
    if lang in _PARSER_CACHE:
        return _PARSER_CACHE[lang]

    parser: BaseASTParser
    if lang == "python":
        parser = PythonASTParser()
    else:
        parser = FallbackParser(language=lang)

    _PARSER_CACHE[lang] = parser
    return parser
