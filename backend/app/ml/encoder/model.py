from typing import Dict, Optional, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.embeddings import CodeEmbedding
from app.ml.encoder.transformer_block import TransformerEncoderBlock


class CodeEncoder(nn.Module):
    def __init__(self, config: CodeEncoderConfig):
        super().__init__()
        self.config = config

        self.embedding = CodeEmbedding(config)
        self.layers = nn.ModuleList(
            [TransformerEncoderBlock(config) for _ in range(config.num_layers)]
        )
        self.final_norm = nn.LayerNorm(config.hidden_size, eps=config.layer_norm_eps)

        # Contrastive projection head (e.g. 256 -> 128)
        self.projection_head = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size, bias=False),
            nn.GELU(),
            nn.Linear(config.hidden_size, config.projection_dim, bias=False),
        )

        # MLM prediction head (256 -> vocab_size)
        self.mlm_head = nn.Linear(config.hidden_size, config.vocab_size, bias=False)

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
    ) -> Dict[str, torch.Tensor]:
        """
        Args:
            input_ids: (batch_size, seq_len)
            attention_mask: (batch_size, seq_len) with 1 for valid tokens and 0 for pad.
        Returns:
            {
                "sequence_output": (batch_size, seq_len, hidden_size),
                "pooled_output": (batch_size, hidden_size),
                "projected_output": (batch_size, projection_dim),
                "mlm_logits": (batch_size, seq_len, vocab_size)
            }
        """
        b, s = input_ids.shape

        # Generate attention mask tensor for scaled dot product
        additive_mask = None
        if attention_mask is not None:
            # Shape: (b, 1, 1, s) with 0 for valid, -10000.0 for pad
            additive_mask = (1.0 - attention_mask.unsqueeze(1).unsqueeze(2).float()) * -10000.0

        x, rope_freqs = self.embedding(input_ids)

        for layer in self.layers:
            x = layer(x, rope_freqs, additive_mask)

        sequence_output = self.final_norm(x)

        # Mean pooling over valid tokens
        if attention_mask is not None:
            expanded_mask = attention_mask.unsqueeze(-1).float()  # (b, s, 1)
            sum_embeddings = torch.sum(sequence_output * expanded_mask, dim=1)
            sum_mask = torch.clamp(expanded_mask.sum(dim=1), min=1e-9)
            pooled_output = sum_embeddings / sum_mask
        else:
            pooled_output = torch.mean(sequence_output, dim=1)

        # Projected normalized embedding for contrastive learning
        projected = self.projection_head(pooled_output)
        normalized_projected = F.normalize(projected, p=2, dim=-1)

        # MLM logits
        mlm_logits = self.mlm_head(sequence_output)

        return {
            "sequence_output": sequence_output,
            "pooled_output": pooled_output,
            "projected_output": normalized_projected,
            "mlm_logits": mlm_logits,
        }

    def encode(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """Convenience method returning normalized pooled embedding."""
        outputs = self.forward(input_ids, attention_mask)
        return F.normalize(outputs["pooled_output"], p=2, dim=-1)

    @property
    def total_params(self) -> int:
        return sum(p.numel() for p in self.parameters())
