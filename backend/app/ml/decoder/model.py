from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F

from app.ml.decoder.config import DecoderConfig
from app.ml.decoder.rmsnorm import RMSNorm
from app.ml.decoder.transformer_block import DecoderTransformerBlock
from app.ml.encoder.embeddings import precompute_rope_freqs


class CausalDecoderLM(nn.Module):
    """
    Model C: Causal Decoder-only Transformer trained from random initialization.
    Features:
    - 6 Transformer blocks
    - Hidden size 256, 4 heads, intermediate 1024
    - Rotary Position Embeddings (RoPE)
    - RMSNorm & SwiGLU activations
    - Optional Weight Tying between token embeddings and LM head projection
    - Autoregressive generation support
    """

    def __init__(self, config: Optional[DecoderConfig] = None):
        super().__init__()
        self.config = config or DecoderConfig()

        self.tok_embeddings = nn.Embedding(self.config.vocab_size, self.config.hidden_size)
        self.dropout = nn.Dropout(self.config.dropout)

        self.layers = nn.ModuleList([
            DecoderTransformerBlock(self.config) for _ in range(self.config.num_layers)
        ])
        self.norm = RMSNorm(self.config.hidden_size, eps=self.config.eps)
        self.lm_head = nn.Linear(self.config.hidden_size, self.config.vocab_size, bias=False)

        if self.config.tie_word_embeddings:
            self.lm_head.weight = self.tok_embeddings.weight

        # Precompute RoPE frequencies for maximum sequence length
        rope_freqs = precompute_rope_freqs(
            dim=self.config.head_dim,
            max_seq_len=self.config.max_seq_len,
            theta=self.config.rope_base,
        )
        self.register_buffer("rope_freqs", rope_freqs, persistent=False)

        self._init_weights()

    def _init_weights(self):
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.normal_(p, mean=0.0, std=0.02)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        input_ids: (batch, seq_len)
        attention_mask: optional (batch, seq_len) with 1 for tokens, 0 for pad
        returns: logits (batch, seq_len, vocab_size)
        """
        batch_size, seq_len = input_ids.shape
        if seq_len > self.config.max_seq_len:
            raise ValueError(f"Sequence length {seq_len} exceeds max {self.config.max_seq_len}")

        additive_mask = None
        if attention_mask is not None:
            # (batch, 1, 1, seq_len) with -1e9 for padded tokens
            additive_mask = (1.0 - attention_mask.unsqueeze(1).unsqueeze(2).float()) * -1e9

        x = self.tok_embeddings(input_ids)
        x = self.dropout(x)

        current_rope = self.rope_freqs[:seq_len]

        for layer in self.layers:
            x = layer(x, current_rope, additive_mask)

        x = self.norm(x)
        logits = self.lm_head(x)
        return logits

    @torch.no_grad()
    def generate(
        self,
        input_ids: torch.Tensor,
        max_new_tokens: int = 50,
        temperature: float = 1.0,
        top_p: float = 0.9,
        eos_token_id: Optional[int] = None,
    ) -> torch.Tensor:
        """
        Autoregressive generation with temperature and top-p (nucleus) sampling.
        """
        self.eval()
        curr_ids = input_ids.clone()

        for _ in range(max_new_tokens):
            if curr_ids.shape[1] >= self.config.max_seq_len:
                break

            logits = self.forward(curr_ids)
            next_token_logits = logits[:, -1, :]

            if temperature <= 0.0 or temperature < 1e-4:
                # Greedy
                next_token = torch.argmax(next_token_logits, dim=-1, keepdim=True)
            else:
                next_token_logits = next_token_logits / temperature
                # Top-p filtering
                sorted_logits, sorted_indices = torch.sort(next_token_logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)

                # Remove tokens with cumulative probability above top_p
                sorted_indices_to_remove = cumulative_probs > top_p
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = False

                indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                next_token_logits[indices_to_remove] = float("-inf")

                probs = F.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)

            curr_ids = torch.cat([curr_ids, next_token], dim=1)

            if eos_token_id is not None and (next_token == eos_token_id).all():
                break

        return curr_ids
