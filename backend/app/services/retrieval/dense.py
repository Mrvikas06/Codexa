from typing import Dict, List, Optional, Tuple
import uuid
import torch
import torch.nn.functional as F
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.models.symbol import CodeChunk, Embedding
from app.services.embedding import EmbeddingService

logger = get_logger("services.retrieval.dense")


class DenseRetriever:
    """
    Dense vector retrieval engine using Model A embeddings.
    Computes cosine similarity between query vector and chunk vectors.
    """

    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service

    async def search(
        self,
        session: AsyncSession,
        query: str,
        repository_id: Optional[uuid.UUID] = None,
        top_k: int = 20,
    ) -> List[Tuple[uuid.UUID, float]]:
        """
        Generates query embedding and calculates cosine similarity against stored chunk embeddings.
        Returns sorted list of (chunk_id, similarity_score).
        """
        if not query.strip():
            return []

        # Generate dense query embedding: (1, hidden_dim)
        query_vectors = self.embedding_service.generate_embeddings([query])
        if not query_vectors or not query_vectors[0]:
            return []

        query_tensor = torch.tensor(query_vectors[0], dtype=torch.float32)
        query_norm = F.normalize(query_tensor.unsqueeze(0), p=2, dim=-1)

        # Retrieve stored embeddings from database
        query_stmt = select(Embedding.chunk_id, Embedding.vector)
        if repository_id:
            query_stmt = (
                select(Embedding.chunk_id, Embedding.vector)
                .join(CodeChunk, Embedding.chunk_id == CodeChunk.id)
                .join(CodeChunk.file)
                .where(CodeChunk.file.has(repository_id=repository_id))
            )

        res = await session.execute(query_stmt)
        rows = res.all()

        if not rows:
            return []

        chunk_ids = [r[0] for r in rows]
        matrix = torch.tensor([r[1] for r in rows], dtype=torch.float32)
        matrix_norm = F.normalize(matrix, p=2, dim=-1)

        # Cosine similarities: (1, num_chunks)
        sims = torch.matmul(query_norm, matrix_norm.T).squeeze(0)

        # Sort top-k
        k = min(top_k, len(chunk_ids))
        top_scores, top_indices = torch.topk(sims, k=k)

        results: List[Tuple[uuid.UUID, float]] = []
        for idx, score in zip(top_indices.tolist(), top_scores.tolist()):
            results.append((chunk_ids[idx], float(score)))

        return results
