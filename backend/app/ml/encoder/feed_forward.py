import torch
import torch.nn as nn
import torch.nn.functional as F
from app.ml.encoder.config import CodeEncoderConfig


class FeedForward(nn.Module):
    def __init__(self, config: CodeEncoderConfig):
        super().__init__()
        self.linear1 = nn.Linear(config.hidden_size, config.intermediate_size, bias=False)
        self.linear2 = nn.Linear(config.intermediate_size, config.hidden_size, bias=False)
        self.dropout = nn.Dropout(config.dropout)
        self.activation = config.activation.lower()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.activation == "gelu":
            h = F.gelu(self.linear1(x))
        else:
            h = F.relu(self.linear1(x))
        h = self.dropout(h)
        return self.linear2(h)
