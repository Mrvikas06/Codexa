# Codexa REST API Reference

## Health
- `GET /api/v1/health`: Checks database, Redis, workers, and GPU status.

## Repositories
- `POST /api/v1/repositories/import`: Import GitHub repository.
- `POST /api/v1/repositories/upload`: Upload repository ZIP.
- `GET /api/v1/repositories`: List repositories.
- `GET /api/v1/repositories/{id}`: Get repository metadata.
- `GET /api/v1/repositories/{id}/files`: List indexed files.
- `GET /api/v1/repositories/{id}/files/{file_id}`: Get file detail with symbols and code content.
- `GET /api/v1/repositories/{id}/jobs`: Monitor background indexing jobs.

## Hybrid Search
- `POST /api/v1/search/hybrid`: 5-way hybrid search (BM25 + dense + symbol + AST + graph + neural rerank).

## Ranking
- `POST /api/v1/ranking/rerank`: Cross-encoder neural reranker scoring.

## Conversations & Grounded Generation
- `POST /api/v1/conversations`: Create new investigation conversation.
- `GET /api/v1/conversations`: List conversations.
- `GET /api/v1/conversations/{id}`: Get conversation message history and evidence citations.
- `POST /api/v1/conversations/{id}/messages`: Submit query, run hybrid retrieval, generate grounded answer, validate citations, and persist evidence references.

## Graph Intelligence
- `GET /api/v1/graph/{repository_id}`: Topology nodes and edges.
- `GET /api/v1/graph/{repository_id}/cycles`: Circular dependency paths.
- `GET /api/v1/graph/{repository_id}/impact/{target_id}`: Blast radius impact analysis.
- `GET /api/v1/graph/{repository_id}/architecture`: Architectural coupling hotspots and dead code candidates.
