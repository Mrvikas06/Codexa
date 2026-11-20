import torch
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder


def test_code_encoder_forward_tensor_shapes():
    config = CodeEncoderConfig(
        vocab_size=500,
        hidden_size=64,
        num_layers=2,
        num_heads=2,
        intermediate_size=128,
        max_seq_len=64,
        projection_dim=32,
    )
    model = CodeEncoder(config)

    batch_size = 3
    seq_len = 16
    input_ids = torch.randint(0, config.vocab_size, (batch_size, seq_len))
    attention_mask = torch.ones((batch_size, seq_len), dtype=torch.long)
    attention_mask[:, -4:] = 0  # 4 padded tokens

    outputs = model(input_ids, attention_mask)

    assert "sequence_output" in outputs
    assert outputs["sequence_output"].shape == (batch_size, seq_len, config.hidden_size)

    assert "pooled_output" in outputs
    assert outputs["pooled_output"].shape == (batch_size, config.hidden_size)

    assert "projected_output" in outputs
    assert outputs["projected_output"].shape == (batch_size, config.projection_dim)

    assert "mlm_logits" in outputs
    assert outputs["mlm_logits"].shape == (batch_size, seq_len, config.vocab_size)


def test_code_encoder_encode_convenience():
    config = CodeEncoderConfig(
        vocab_size=300,
        hidden_size=64,
        num_layers=2,
        num_heads=2,
        intermediate_size=128,
        max_seq_len=32,
    )
    model = CodeEncoder(config)
    input_ids = torch.randint(0, config.vocab_size, (2, 8))
    embeddings = model.encode(input_ids)
    assert embeddings.shape == (2, config.hidden_size)

    # Embeddings must be unit-normalized
    norms = torch.norm(embeddings, p=2, dim=-1)
    assert torch.allclose(norms, torch.ones_like(norms), atol=1e-5)
