import torch
import torch.nn as nn
import torch.nn.functional as F


class MaskedLanguageModelingLoss(nn.Module):
    """
    Computes CrossEntropy loss strictly over masked token indices.
    Ignores targets with label == -100.
    """

    def __init__(self, ignore_index: int = -100):
        super().__init__()
        self.ignore_index = ignore_index
        self.criterion = nn.CrossEntropyLoss(ignore_index=ignore_index)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # If no tokens are masked in the batch, avoid 0/0 NaN
        valid_mask = targets != self.ignore_index
        if not valid_mask.any():
            return torch.tensor(0.0, device=logits.device, requires_grad=True)

        vocab_size = logits.size(-1)
        loss = self.criterion(logits.view(-1, vocab_size), targets.view(-1))
        return loss


class ContrastiveLoss(nn.Module):
    """
    InfoNCE / NT-Xent loss for paired code-query or positive chunk alignments.
    Takes normalized query embeddings and positive code embeddings, computes
    symmetric cross-entropy across the batch.
    """

    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.temperature = temperature
        self.criterion = nn.CrossEntropyLoss()

    def forward(self, query_embeddings: torch.Tensor, code_embeddings: torch.Tensor) -> torch.Tensor:
        # query_embeddings: (batch_size, projection_dim)
        # code_embeddings: (batch_size, projection_dim)
        batch_size = query_embeddings.size(0)
        if batch_size < 2:
            return torch.tensor(0.0, device=query_embeddings.device, requires_grad=True)

        # Similarity matrix: (batch_size, batch_size)
        similarity = torch.matmul(query_embeddings, code_embeddings.T) / self.temperature

        # Ground truth labels: diagonal elements are positive pairs
        labels = torch.arange(batch_size, device=query_embeddings.device)

        loss_a = self.criterion(similarity, labels)
        loss_b = self.criterion(similarity.T, labels)
        return (loss_a + loss_b) / 2.0

