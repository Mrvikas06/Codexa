import torch
from app.ml.decoder.config import DecoderConfig
from app.ml.decoder.model import CausalDecoderLM


def test_decoder_generation():
    config = DecoderConfig(
        vocab_size=100,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
    )
    model = CausalDecoderLM(config)

    prompt = torch.tensor([[10, 20, 30]])
    # Greedy generation
    generated = model.generate(prompt, max_new_tokens=5, temperature=0.0)
    assert generated.shape == (1, 8)
    assert generated[0, :3].tolist() == [10, 20, 30]

    # Nucleus generation
    sampled = model.generate(prompt, max_new_tokens=4, temperature=0.8, top_p=0.9)
    assert sampled.shape == (1, 7)
