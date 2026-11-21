import torch
from app.ml.decoder.attention import CausalSelfAttention
from app.ml.decoder.config import DecoderConfig
from app.ml.encoder.embeddings import precompute_rope_freqs


def test_causal_self_attention_shapes_and_mask():
    config = DecoderConfig(hidden_size=32, num_heads=2, max_seq_len=16)
    attn = CausalSelfAttention(config)
    rope_freqs = precompute_rope_freqs(dim=config.head_dim, max_seq_len=16)

    # (batch=1, seq=4, hidden=32)
    x = torch.randn(1, 4, 32, requires_grad=True)
    out = attn(x, rope_freqs[:4])
    assert out.shape == (1, 4, 32)

    # Verify causal masking: perturb token at index 3, token 0 output must not change
    loss = out[0, 0].sum()
    loss.backward()
    # Gradient on future token x[0, 3] should be 0 because token 0 cannot attend to token 3
    assert torch.all(x.grad[0, 3] == 0.0)
