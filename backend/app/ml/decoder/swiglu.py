import torch
import torch.nn as nn
import torch.nn.functional as F


class SwiGLU(nn.Module):
    """
    SwiGLU feed-forward network:
    SwiGLU(x) = (Linear_gate(x) * SiLU(Linear_up(x))) -> Linear_down
    """

    def __init__(self, hidden_size: int, intermediate_size: int, dropout: float = 0.1):
        super().__init__()
        self.gate_proj = nn.Linear(hidden_size, intermediate_size, bias=False)
        self.up_proj = nn.Linear(hidden_size, intermediate_size, bias=False)
        self.down_proj = nn.Linear(intermediate_size, hidden_size, bias=False)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Swish(gate) * up
        gate = F.silu(self.gate_proj(x))
        up = self.up_proj(x)
        activated = gate * up
        out = self.down_proj(activated)
        return self.dropout(out)
