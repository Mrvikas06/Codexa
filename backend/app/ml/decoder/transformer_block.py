import torch
import torch.nn as nn

from app.ml.decoder.attention import CausalSelfAttention
from app.ml.decoder.config import DecoderConfig
from app.ml.decoder.rmsnorm import RMSNorm
from app.ml.decoder.swiglu import SwiGLU


class DecoderTransformerBlock(nn.Module):
    """
    Pre-RMSNorm Decoder Transformer block with SwiGLU and causal attention.
    """

    def __init__(self, config: DecoderConfig):
        super().__init__()
        self.input_layernorm = RMSNorm(config.hidden_size, eps=config.eps)
        self.self_attn = CausalSelfAttention(config)
        self.post_attention_layernorm = RMSNorm(config.hidden_size, eps=config.eps)
        self.mlp = SwiGLU(
            hidden_size=config.hidden_size,
            intermediate_size=config.intermediate_size,
            dropout=config.dropout,
        )

    def forward(
        self,
        x: torch.Tensor,
        rope_freqs: torch.Tensor,
        attention_mask: torch.Tensor = None,
    ) -> torch.Tensor:
        # Self-attention with pre-RMSNorm residual
        norm_x = self.input_layernorm(x)
        attn_out = self.self_attn(norm_x, rope_freqs, attention_mask)
        x = x + attn_out

        # SwiGLU MLP with pre-RMSNorm residual
        norm_x = self.post_attention_layernorm(x)
        mlp_out = self.mlp(norm_x)
        x = x + mlp_out
        return x
