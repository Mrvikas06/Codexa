import torch
from app.ml.decoder.config import DecoderConfig
from app.ml.decoder.model import CausalDecoderLM


def test_causal_decoder_lm_architecture():
    config = DecoderConfig(
        vocab_size=200,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
        tie_word_embeddings=True,
    )
    model = CausalDecoderLM(config)

    # Verify weight tying
    assert torch.equal(model.lm_head.weight, model.tok_embeddings.weight)

    # Forward pass
    input_ids = torch.randint(0, 200, (2, 8))
    logits = model(input_ids)

    assert logits.shape == (2, 8, 200)
