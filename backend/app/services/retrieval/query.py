import re
from typing import Dict, List, Set

# Known domain-specific developer abbreviation mappings
ABBREVIATION_MAP: Dict[str, List[str]] = {
    "auth": ["authentication", "authorize"],
    "jwt": ["token", "json", "web", "token"],
    "db": ["database", "sql", "repository"],
    "repo": ["repository", "store"],
    "req": ["request"],
    "res": ["response"],
    "param": ["parameter", "argument"],
    "config": ["configuration", "settings"],
    "fn": ["function", "method"],
    "cls": ["class"],
    "pwd": ["password"],
    "err": ["error", "exception"],
    "idx": ["index"],
    "msg": ["message"],
}

# Stop words to filter out of pure keyword queries while preserving code tokens
STOP_WORDS: Set[str] = {
    "a", "an", "the", "in", "on", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after",
    "above", "below", "to", "from", "up", "down", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "how",
    "where", "what", "which", "who", "whom", "this", "that", "these", "those",
}


def expand_query(query: str) -> str:
    """
    Expands common programming abbreviations and prepares normalized keyword variants.
    e.g. 'auth db config' -> 'auth authentication authorize db database sql config configuration'
    """
    raw_tokens = re.findall(r"[A-Za-z0-9_]+", query.lower())
    expanded_terms: List[str] = []

    for t in raw_tokens:
        expanded_terms.append(t)
        if t in ABBREVIATION_MAP:
            for syn in ABBREVIATION_MAP[t]:
                if syn not in expanded_terms:
                    expanded_terms.append(syn)

    return " ".join(expanded_terms)


def extract_keywords(query: str) -> List[str]:
    """
    Extracts informative keywords by filtering out general English stop words,
    keeping technical identifiers and terms.
    """
    tokens = re.findall(r"[A-Za-z0-9_]+", query.lower())
    keywords = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return keywords if keywords else tokens
