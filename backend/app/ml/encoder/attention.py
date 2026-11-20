import math
from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.embeddings import apply_rotary_pos_emb


class MultiHeadSelfAttention(nn.Module):
    def __init__(self, config: CodeEncoderConfig):
        super().__init__()
        assert config.hidden_size % config.num_heads == 0, "hidden_size must be divisible by num_heads"
        self.num_heads = config.num_heads
        self.head_dim = config.hidden_size // config.num_heads
        self.hidden_size = config.hidden_size

        self.q_proj = nn.Linear(config.hidden_size, config.hidden_size, bias=False)
        self.k_proj = nn.Linear(config.hidden_size, config.hidden_size, bias=False)
        self.v_proj = nn.Linear(config.hidden_size, config.hidden_size, bias=False)
        self.out_proj = nn.Linear(config.hidden_size, config.hidden_size, bias=False)
        self.dropout = nn.Dropout(config.dropout)

    def forward(
        self,
        x: torch.Tensor,
        rope_freqs: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        b, s, _ = x.shape

        q = self.q_proj(x).view(b, s, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(b, s, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(b, s, self.num_heads, self.head_dim).transpose(1, 2)

        # Apply RoPE to query and key
        q = apply_rotary_pos_emb(q, rope_freqs)
        k = apply_rotary_pos_emb(k, rope_freqs)

        # Scaled dot-product attention
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)

        if attention_mask is not None:
            # Mask shape: (b, 1, 1, s) with 0 for valid, -inf for pad
            scores = scores + attention_mask

        weights = F.softmax(scores, dim=-1)
        weights = self.dropout(weights)

        context = torch.matmul(weights, v)
        context = context.transpose(1, 2).contiguous().view(b, s, self.hidden_size)
        return self.out_proj(context)
