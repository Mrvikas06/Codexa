import torch
from app.ml.decoder.rmsnorm import RMSNorm


def test_rmsnorm_forward():
    dim = 64
    norm = RMSNorm(dim, eps=1e-6)
    x = torch.randn(2, 10, dim)
    out = norm(x)

    assert out.shape == (2, 10, dim)
    # Variance should be approximately 1
    rms = torch.sqrt(out.pow(2).mean(dim=-1))
    assert torch.allclose(rms, torch.ones_like(rms), atol=1e-2)
