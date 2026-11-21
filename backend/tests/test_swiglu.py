import torch
from app.ml.decoder.swiglu import SwiGLU


def test_swiglu_forward():
    hidden = 32
    intermediate = 64
    swiglu = SwiGLU(hidden_size=hidden, intermediate_size=intermediate, dropout=0.0)
    x = torch.randn(2, 5, hidden)
    out = swiglu(x)

    assert out.shape == (2, 5, hidden)
