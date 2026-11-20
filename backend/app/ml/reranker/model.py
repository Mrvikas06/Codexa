from typing import List, Optional, Tuple
import torch
import torch.nn as nn
from app.ml.encoder.embeddings import CodeEmbedding
from app.ml.encoder.transformer_block import TransformerEncoderBlock
from app.ml.reranker.config import RerankerConfig
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import BOS_ID, EOS_ID, PAD_ID, SEP_ID


class CrossEncoderReranker(nn.Module):
    """
    Cross-encoder Model B:
    Query + Candidate Code are concatenated into a single sequence:
    <BOS> query <SEP> candidate_code <EOS>
    This allows all-to-all cross-attention between every token in the query
    and every token in the candidate code chunk, followed by a linear scoring head.
    """

    def __init__(self, config: RerankerConfig):
        super().__init__()
        self.config = config

        # Modular transformer encoder components
        self.embedding = CodeEmbedding(config)  # Token embedding + RoPE freqs
        self.layers = nn.ModuleList(
            [TransformerEncoderBlock(config) for _ in range(config.num_layers)]
        )
        self.final_norm = nn.LayerNorm(config.hidden_size, eps=config.layer_norm_eps)

        # Linear scoring head: hidden_size -> 1
        self.scoring_head = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size // 2),
            nn.GELU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_size // 2, 1),
        )

        self._init_weights()

    def _init_weights(self) -> None:
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.normal_(module.weight, mean=0.0, std=0.02)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)
            elif isinstance(module, nn.Embedding):
                nn.init.normal_(module.weight, mean=0.0, std=0.02)
            elif isinstance(module, nn.LayerNorm):
                nn.init.zeros_(module.bias)
                nn.init.ones_(module.weight)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Args:
            input_ids: (batch_size, seq_len) of joint tokens: <BOS> q <SEP> c <EOS>
            attention_mask: (batch_size, seq_len) with 1 for valid, 0 for pad.
        Returns:
            scores: (batch_size, 1) raw logit relevance scores.
        """
        b, s = input_ids.shape

        additive_mask = None
        if attention_mask is not None:
            additive_mask = (1.0 - attention_mask.unsqueeze(1).unsqueeze(2).float()) * -10000.0

        x, rope_freqs = self.embedding(input_ids)

        for layer in self.layers:
            x = layer(x, rope_freqs, additive_mask)

        sequence_output = self.final_norm(x)

        # Mean pooling over valid non-pad tokens
        if attention_mask is not None:
            expanded_mask = attention_mask.unsqueeze(-1).float()
            sum_embeddings = torch.sum(sequence_output * expanded_mask, dim=1)
            sum_mask = torch.clamp(expanded_mask.sum(dim=1), min=1e-9)
            pooled = sum_embeddings / sum_mask
        else:
            pooled = torch.mean(sequence_output, dim=1)

        scores = self.scoring_head(pooled)
        return scores

    def score_pairs(
        self,
        tokenizer: ByteLevelBPETokenizer,
        pairs: List[Tuple[str, str]],
        device: torch.device,
        batch_size: int = 32,
    ) -> List[float]:
        """
        Scores a list of (query, candidate_code) pairs using the cross-encoder.
        """
        self.eval()
        self.to(device)

        if not pairs:
            return []

        all_scores: List[float] = []

        with torch.no_grad():
            for i in range(0, len(pairs), batch_size):
                batch_pairs = pairs[i : i + batch_size]
                batch_ids: List[List[int]] = []

                for query, code in batch_pairs:
                    q_ids = tokenizer.encode(query, add_special_tokens=False)
                    c_ids = tokenizer.encode(code, add_special_tokens=False)
                    # Joint sequence: <BOS> q <SEP> c <EOS>
                    joint = (
                        [BOS_ID]
                        + q_ids[: self.config.max_seq_len // 3]
                        + [SEP_ID]
                        + c_ids[: (self.config.max_seq_len * 2) // 3]
                        + [EOS_ID]
                    )
                    batch_ids.append(joint[: self.config.max_seq_len])

                max_len = max(len(ids) for ids in batch_ids)
                padded = [ids + [PAD_ID] * (max_len - len(ids)) for ids in batch_ids]
                mask = [[1] * len(ids) + [0] * (max_len - len(ids)) for ids in batch_ids]

                in_tensor = torch.tensor(padded, dtype=torch.long, device=device)
                mask_tensor = torch.tensor(mask, dtype=torch.long, device=device)

                logits = self.forward(in_tensor, mask_tensor).squeeze(-1)
                all_scores.extend(logits.cpu().tolist())

        return all_scores

    @property
    def total_params(self) -> int:
        return sum(p.numel() for p in self.parameters())
