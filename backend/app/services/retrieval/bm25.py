import math
import re
from typing import Dict, List, Optional, Set, Tuple
import uuid


def tokenize_code(text: str) -> List[str]:
    """
    Tokenizes code into lowercased alphanumeric terms, splitting camelCase and snake_case.
    e.g. 'validateJwtToken' -> ['validate', 'jwt', 'token']
    """
    if not text:
        return []

    # Insert spaces between camelCase words
    s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    # Split on non-alphanumeric characters
    tokens = re.findall(r"[A-Za-z0-9]+", s1.lower())
    return [t for t in tokens if len(t) > 1]


class BM25Index:
    """
    Okapi BM25 index over code chunks.
    Computes exact TF-IDF with document length normalization:
    score(D, Q) = sum_q IDF(q) * (TF(q, D) * (k1 + 1)) / (TF(q, D) + k1 * (1 - b + b * (|D| / avgdl)))
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_ids: List[uuid.UUID] = []
        self.doc_lengths: List[int] = []
        self.doc_token_counts: List[Dict[str, int]] = []
        self.inverted_index: Dict[str, List[int]] = {}  # term -> list of doc indices
        self.idf: Dict[str, float] = {}
        self.avg_doc_len: float = 0.0

    def index_documents(self, documents: List[Tuple[uuid.UUID, str]]) -> None:
        """
        Indexes a list of (doc_id, text_content) pairs.
        """
        self.doc_ids = []
        self.doc_lengths = []
        self.doc_token_counts = []
        self.inverted_index = {}
        self.idf = {}

        if not documents:
            self.avg_doc_len = 0.0
            return

        total_length = 0

        for doc_idx, (doc_id, content) in enumerate(documents):
            tokens = tokenize_code(content)
            doc_len = len(tokens)
            total_length += doc_len

            counts: Dict[str, int] = {}
            for t in tokens:
                counts[t] = counts.get(t, 0) + 1

            self.doc_ids.append(doc_id)
            self.doc_lengths.append(doc_len)
            self.doc_token_counts.append(counts)

            for term in counts.keys():
                if term not in self.inverted_index:
                    self.inverted_index[term] = []
                self.inverted_index[term].append(doc_idx)

        num_docs = len(documents)
        self.avg_doc_len = total_length / max(1, num_docs)

        # Compute IDF for all terms
        for term, posting_list in self.inverted_index.items():
            df = len(posting_list)
            # Standard BM25 IDF formulation with floor at 0
            idf_score = math.log((num_docs - df + 0.5) / (df + 0.5) + 1.0)
            self.idf[term] = max(0.01, idf_score)

    def search(self, query: str, top_k: int = 20) -> List[Tuple[uuid.UUID, float]]:
        """
        Searches the index and returns (doc_id, bm25_score) sorted descending.
        """
        if not self.doc_ids or not query.strip():
            return []

        q_tokens = tokenize_code(query)
        scores: Dict[int, float] = {}

        for term in q_tokens:
            if term not in self.inverted_index:
                continue

            term_idf = self.idf[term]
            posting_list = self.inverted_index[term]

            for doc_idx in posting_list:
                tf = self.doc_token_counts[doc_idx][term]
                doc_len = self.doc_lengths[doc_idx]

                norm = 1.0 - self.b + self.b * (doc_len / max(1.0, self.avg_doc_len))
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * norm
                term_score = term_idf * (numerator / denominator)

                scores[doc_idx] = scores.get(doc_idx, 0.0) + term_score

        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        return [
            (self.doc_ids[doc_idx], score)
            for doc_idx, score in sorted_results[:top_k]
        ]
