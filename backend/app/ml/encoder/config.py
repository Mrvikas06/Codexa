from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CodeEncoderConfig:
    vocab_size: int = 16000
    hidden_size: int = 256
    num_layers: int = 6
    num_heads: int = 4
    intermediate_size: int = 1024
    max_seq_len: int = 512
    dropout: float = 0.1
    projection_dim: int = 128
    pooling: str = "mean"  # "mean", "cls", or "max"
    layer_norm_eps: float = 1e-5
    activation: str = "gelu"  # "gelu" or "swiglu"
    pad_token_id: int = 0
