from typing import Optional
import torch
import torch.nn as nn
from app.ml.encoder.attention import MultiHeadSelfAttention
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.feed_forward import FeedForward


class TransformerEncoderBlock(nn.Module):
    def __init__(self, config: CodeEncoderConfig):
        super().__init__()
        self.norm1 = nn.LayerNorm(config.hidden_size, eps=config.layer_norm_eps)
        self.attn = MultiHeadSelfAttention(config)
        self.norm2 = nn.LayerNorm(config.hidden_size, eps=config.layer_norm_eps)
        self.ffn = FeedForward(config)
        self.dropout = nn.Dropout(config.dropout)

    def forward(
        self,
        x: torch.Tensor,
        rope_freqs: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        # Pre-norm architecture with residual connections
        norm_x = self.norm1(x)
        attn_out = self.attn(norm_x, rope_freqs, attention_mask)
        x = x + self.dropout(attn_out)

        norm_x = self.norm2(x)
        ffn_out = self.ffn(norm_x)
        x = x + self.dropout(ffn_out)
        return x
