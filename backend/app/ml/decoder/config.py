from dataclasses import dataclass
from typing import Optional


@dataclass
class DecoderConfig:
    vocab_size: int = 16000
    hidden_size: int = 256
    num_layers: int = 6
    num_heads: int = 4
    intermediate_size: int = 1024
    max_seq_len: int = 512
    dropout: float = 0.1
    tie_word_embeddings: bool = True
    eps: float = 1e-6
    rope_base: float = 10000.0

    @property
    def head_dim(self) -> int:
        return self.hidden_size // self.num_heads
