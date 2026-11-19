# Codexa

Codexa is a codebase intelligence platform that lets developers interrogate any GitHub repository or uploaded codebase using natural language. It combines custom-trained neural models, AST-based repository analysis, hybrid retrieval, neural reranking, and a dependency graph to produce answers grounded entirely in repository evidence.

This is not an LLM API wrapper. Every answer is sourced, cited, and verifiable against the actual indexed codebase.

---

## What it does

Import a repository. Ask questions about it in plain English.

```
Where is authentication implemented?
How does a request flow from the API to the database?
Find all locations where JWT expiration is checked.
Which functions are never called?
What happens if I modify this service?
Explain the architecture of this repository.
Identify potential circular dependencies.
```

Every response includes file paths, line numbers, and exact code evidence. If Codexa cannot verify a claim from the indexed repository, it says so.

---

## Architecture

```
Repository
    │
    ├── Ingestion Pipeline
    │       ├── File discovery and language detection
    │       ├── AST parsing and symbol extraction
    │       ├── Semantic code chunking
    │       └── Metadata persistence
    │
    ├── Intelligence Layer
    │       ├── Code Encoder (custom Transformer, trained from scratch)
    │       ├── Hybrid Retrieval (BM25 + dense + symbol + AST + graph)
    │       ├── Neural Reranker (cross-encoder, trained from scratch)
    │       └── Dependency Graph
    │
    └── Generation Pipeline
            ├── Evidence assembly
            ├── Mini decoder LLM (trained from scratch)
            ├── Citation validation
            └── Grounded response
```

Codexa trains three models from random initialization:

| Model | Type | Purpose |
|-------|------|---------|
| Code Encoder | Transformer encoder | Code and text embeddings via contrastive learning |
| Reranker | Cross-encoder | Neural reranking of retrieval candidates |
| Decoder | Causal Transformer | Evidence-grounded answer generation |

---

## Technology stack

### Frontend
- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui
- TanStack Query, React Router
- CodeMirror (code viewer)
- Zustand (global state only)

### Backend
- Python 3.11+, FastAPI
- SQLAlchemy 2.0 async, PostgreSQL, pgvector
- Alembic (migrations), Redis (queue and cache)
- Background workers for indexing and training

### Machine learning
- PyTorch
- Custom BPE tokenizer (16k vocabulary)
- Transformer encoder: 6 layers, 4 heads, hidden size 256
- Cross-encoder reranker with hard-negative training
- Decoder: causal Transformer with RoPE, RMSNorm, SwiGLU
- Hybrid retrieval: BM25 + dense vector + symbol + AST + graph
- Reciprocal Rank Fusion for result combination

---

## Installation

### Requirements

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ with pgvector extension
- Redis 7+
- CUDA-capable GPU (recommended; CPU fallback supported)

### Backend

```bash
git clone https://github.com/Mrvikas06/codexa
cd codexa

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your database, Redis, and API credentials

alembic upgrade head
uvicorn api.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Environment variables

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/codexa
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
GITHUB_TOKEN=your-github-token          # optional, increases rate limit
DEVICE=cuda                             # cuda | cpu
```

See `.env.example` for the full reference.

---

## Usage

### Import a repository

**Via UI:** Navigate to Repositories → Import → paste a GitHub URL or upload a ZIP.

**Via API:**

```bash
curl -X POST http://localhost:8000/api/repositories \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/owner/repo"}'
```

Indexing runs asynchronously. Monitor progress at `/api/repositories/{id}/status`.

### Ask a question

```bash
curl -X POST http://localhost:8000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "repository_id": "uuid-here",
    "question": "Where is authentication implemented?"
  }'
```

### Search code

```bash
curl "http://localhost:8000/api/search?q=validate_token&repository_id=uuid"
```

---

## Model training

Codexa trains all models from scratch. Training runs on the indexed repository data.

### Train the code encoder

```bash
python -m ml.training.train_encoder \
  --config configs/encoder.yaml \
  --output checkpoints/encoder
```

### Train the reranker

```bash
python -m ml.training.train_reranker \
  --config configs/reranker.yaml \
  --encoder-checkpoint checkpoints/encoder/best.pt \
  --output checkpoints/reranker
```

### Train the decoder

```bash
python -m ml.training.train_decoder \
  --config configs/decoder.yaml \
  --output checkpoints/decoder
```

Training configuration (`configs/encoder.yaml`):

```yaml
vocab_size: 16000
hidden_size: 256
num_layers: 6
num_heads: 4
intermediate_size: 1024
max_sequence_length: 512
dropout: 0.1
batch_size: 32
gradient_accumulation_steps: 4
learning_rate: 3e-4
warmup_steps: 500
max_steps: 50000
mixed_precision: true
gradient_checkpointing: true
```

Hardware detection runs at startup. CUDA failures are reported explicitly — the system never silently falls back to CPU during a running training job.

---

## Evaluation

```bash
# Evaluate encoder retrieval
python -m ml.evaluation.eval_encoder \
  --checkpoint checkpoints/encoder/best.pt \
  --benchmark benchmarks/retrieval_v1.json

# Evaluate reranker
python -m ml.evaluation.eval_reranker \
  --checkpoint checkpoints/reranker/best.pt \
  --benchmark benchmarks/ranking_v1.json

# Evaluate full generation pipeline
python -m ml.evaluation.eval_generation \
  --benchmark benchmarks/generation_v1.json
```

Benchmark metrics:

| Component | Metrics |
|-----------|---------|
| Encoder | Recall@5, Recall@10, MRR, NDCG |
| Reranker | Pairwise accuracy, MRR, NDCG, Precision@k |
| Generation | Citation correctness, evidence faithfulness, unsupported claim rate |
| System | Retrieval latency, indexing latency, GPU memory, throughput |

Benchmarks are versioned. Models are never evaluated on data present in training sets.

---

## Testing

```bash
# Unit tests
pytest tests/unit

# Integration tests
pytest tests/integration

# Full end-to-end
pytest tests/e2e

# Specific module
pytest tests/unit/test_tokenizer.py -v
```

The test suite covers: tokenizer, chunking, AST parsing, retrieval, reranking, model tensor shapes, database repositories, citation validation, ingestion pipeline, and API behavior.

---

## Project structure

```
codexa/
├── api/                    # FastAPI routes, schemas, dependencies
├── core/                   # Config, logging, security, exceptions
├── repositories/           # Database access layer
├── services/               # Business logic (ingestion, retrieval, generation)
├── ml/                     # Models, tokenizer, training, inference, evaluation
│   ├── tokenizer/
│   ├── encoder/
│   ├── reranker/
│   ├── decoder/
│   ├── datasets/
│   ├── training/
│   └── evaluation/
├── workers/                # Background jobs (indexing, training)
├── frontend/               # React application
├── configs/                # Training and model configurations
├── benchmarks/             # Versioned evaluation datasets
├── migrations/             # Alembic database migrations
└── tests/                  # Unit, integration, and e2e tests
```

---

## Limitations

- Models are trained from scratch on indexed repository data. They are not equivalent to commercial LLMs in general reasoning capability.
- Retrieval quality depends on indexing completeness. Partial ingestion produces partial results.
- The decoder is a small experimental model (256 hidden size, 6 layers). It is designed for evidence-grounded code question answering, not general conversation.
- Languages with limited AST parser support receive fallback chunking, which reduces retrieval precision.
- GPU training is recommended. CPU training is functional but significantly slower.
- Maximum indexed file size is configurable. Very large monorepos may require tuning worker concurrency and chunk size.

---

## Roadmap

- [ ] Multi-repository cross-search
- [ ] Incremental re-indexing on repository changes
- [ ] Streaming answer generation
- [ ] CLI client
- [ ] VS Code extension
- [ ] Larger encoder and decoder variants
- [ ] Support for additional languages (Go, Rust, Java, C++)
- [ ] Self-hosted embedding service
- [ ] Webhook-triggered re-indexing on push

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Run the full test suite before opening a pull request.
4. Every pull request must include tests for new functionality.
5. Do not merge failing tests or introduce dead code.

See `CONTRIBUTING.md` for the full development workflow.

---

## License

MIT License. See `LICENSE` for details.