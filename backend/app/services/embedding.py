import uuid
from typing import List, Optional
import torch
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ModelError
from app.core.logging import get_logger
from app.ml.device import get_device
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import PAD_ID
from app.models.ml import ModelStatus, ModelType, ModelVersion
from app.models.symbol import CodeChunk, Embedding

logger = get_logger("services.embedding")


class EmbeddingService:
    def __init__(
        self,
        model: Optional[CodeEncoder] = None,
        tokenizer: Optional[ByteLevelBPETokenizer] = None,
        device_str: str = "auto",
    ):
        self.device = get_device(device_str)
        self.tokenizer = tokenizer or ByteLevelBPETokenizer()
        self.model = model or CodeEncoder(CodeEncoderConfig())
        self.model.to(self.device)
        self.model.eval()

    def generate_embeddings(self, texts: List[str], max_seq_len: int = 512) -> List[List[float]]:
        if not texts:
            return []

        ids_list = [
            self.tokenizer.encode(t, add_special_tokens=True, max_length=max_seq_len)
            for t in texts
        ]
        max_len = max(len(ids) for ids in ids_list)
        padded = [ids + [PAD_ID] * (max_len - len(ids)) for ids in ids_list]
        mask = [[1] * len(ids) + [0] * (max_len - len(ids)) for ids in ids_list]

        in_tensor = torch.tensor(padded, dtype=torch.long, device=self.device)
        mask_tensor = torch.tensor(mask, dtype=torch.long, device=self.device)

        with torch.no_grad():
            embeddings = self.model.encode(in_tensor, mask_tensor)

        return embeddings.cpu().tolist()

    async def index_chunks(
        self,
        session: AsyncSession,
        chunks: List[CodeChunk],
        model_version_id: uuid.UUID,
    ) -> int:
        """
        Generates dense vector embeddings for code chunks and persists them in the database.
        """
        if not chunks:
            return 0

        texts = [ch.content for ch in chunks]
        vectors = self.generate_embeddings(texts)

        count = 0
        for chunk, vector in zip(chunks, vectors):
            emb = Embedding(
                id=uuid.uuid4(),
                chunk_id=chunk.id,
                model_version_id=model_version_id,
                vector=vector,
            )
            session.add(emb)
            count += 1

        await session.commit()
        return count
