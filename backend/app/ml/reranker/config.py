from dataclasses import dataclass


@dataclass
class RerankerConfig:
    vocab_size: int = 16000
    hidden_size: int = 256
    num_layers: int = 6
    num_heads: int = 4
    intermediate_size: int = 1024
    max_seq_len: int = 512
    dropout: float = 0.1
    layer_norm_eps: float = 1e-5
    activation: str = "gelu"
    pad_token_id: int = 0
