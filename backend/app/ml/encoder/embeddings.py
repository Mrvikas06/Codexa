import math
from typing import Tuple
import torch
import torch.nn as nn
from app.ml.encoder.config import CodeEncoderConfig


def precompute_rope_freqs(dim: int, max_seq_len: int, theta: float = 10000.0) -> torch.Tensor:
    """Precomputes complex frequencies for Rotary Position Embeddings (RoPE)."""
    assert dim % 2 == 0, "Dimension for RoPE must be even"
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2)[: (dim // 2)].float() / dim))
    t = torch.arange(max_seq_len, dtype=torch.float32)
    freqs = torch.outer(t, freqs)
    # Shape: (max_seq_len, dim // 2, 2) representing cos and sin
    freqs_cos = torch.cos(freqs)
    freqs_sin = torch.sin(freqs)
    return torch.stack([freqs_cos, freqs_sin], dim=-1)


def apply_rotary_pos_emb(x: torch.Tensor, freqs: torch.Tensor) -> torch.Tensor:
    """
    Applies RoPE to query or key tensor of shape (batch, heads, seq_len, head_dim).
    freqs shape: (seq_len, head_dim // 2, 2).
    """
    # Reshape x to pairs of coordinates
    b, h, s, d = x.shape
    x_pairs = x.reshape(b, h, s, d // 2, 2)
    cos = freqs[:s, :, 0].unsqueeze(0).unsqueeze(0)  # (1, 1, s, d // 2)
    sin = freqs[:s, :, 1].unsqueeze(0).unsqueeze(0)  # (1, 1, s, d // 2)

    x0 = x_pairs[..., 0]
    x1 = x_pairs[..., 1]

    out0 = x0 * cos - x1 * sin
    out1 = x0 * sin + x1 * cos

    out = torch.stack([out0, out1], dim=-1).reshape(b, h, s, d)
    return out


class CodeEmbedding(nn.Module):
    def __init__(self, config: CodeEncoderConfig):
        super().__init__()
        self.token_embeddings = nn.Embedding(
            config.vocab_size,
            config.hidden_size,
            padding_idx=config.pad_token_id,
        )
        self.dropout = nn.Dropout(config.dropout)
        self.register_buffer(
            "rope_freqs",
            precompute_rope_freqs(config.hidden_size // config.num_heads, config.max_seq_len),
            persistent=False,
        )

    def forward(self, input_ids: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        x = self.token_embeddings(input_ids)
        x = self.dropout(x)
        return x, self.rope_freqs
