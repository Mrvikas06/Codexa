# CodeAtlas AI Architecture

## 1. System Overview

CodeAtlas AI is a production-grade codebase intelligence engine. It combines:
- Custom-trained Transformer neural models (Code Encoder, Cross-Encoder Reranker, Causal Decoder LM).
- Structural AST parsing and hierarchy extraction (Python AST + generic fallback).
- 5-Way Hybrid Retrieval (Okapi BM25, Dense Vector, Symbol match, AST Structural search, Dependency Graph expansion) combined via Reciprocal Rank Fusion (RRF).
- Graph Intelligence (Tarjan cycle detection, blast radius impact analysis, architectural coupling hotspots).
- Evidence Grounding and Strict Citation Validation ensuring zero fabricated citations or lines.

```
                    ┌─────────────────────────┐
                    │    Import / Webhook     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Ingestion Pipeline    │
                    │ (AST, Symbols, Chunks)  │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼───────┐        ┌───────▼───────┐        ┌───────▼───────┐
│ Code Encoder  │        │  Code Graph   │        │   BM25 Index  │
│  (Model A)    │        │  (Adjacency)  │        │  (Okapi BM25) │
└───────┬───────┘        └───────┬───────┘        └───────┬───────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Hybrid Retrieval (RRF) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Cross-Encoder Reranker  │
                    │       (Model B)         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Causal Decoder LM &     │
                    │ Citation Validation     │
                    │       (Model C)         │
                    └─────────────────────────┘
```

## 2. Ingestion & AST Analysis
- Language detection with magic bytes binary inspection.
- Python AST extractor extracts classes, methods, functions, decorators, docstrings, and parent-child hierarchies.
- Semantic code chunking ensures clean logical boundaries without truncation.

## 3. Retrieval Pipeline
- Okapi BM25 with camelCase and snake_case sub-tokenization.
- Dense retrieval using Model A 256-dimensional embeddings with cosine similarity.
- Symbol search supporting exact, prefix, and docstring matches.
- Dependency graph expansion for multi-hop relationship resolution.
- Reciprocal Rank Fusion (RRF, k=60) with provenance tracing.
