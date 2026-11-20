import torch
import torch.nn as nn
import torch.nn.functional as F


class PairwiseMarginRankingLoss(nn.Module):
    """
    Pairwise ranking loss:
    loss = max(0, margin - (score_pos - score_neg))
    Encourages positive candidate scores to be higher than negative candidate scores
    by at least the margin.
    """

    def __init__(self, margin: float = 1.0):
        super().__init__()
        self.margin = margin

    def forward(self, pos_scores: torch.Tensor, neg_scores: torch.Tensor) -> torch.Tensor:
        # pos_scores: (batch_size, 1) or (batch_size,)
        # neg_scores: (batch_size, 1) or (batch_size,)
        target = torch.ones_like(pos_scores)
        loss = F.margin_ranking_loss(
            pos_scores.view(-1),
            neg_scores.view(-1),
            target.view(-1),
            margin=self.margin,
        )
        return loss


class PointwiseBCERankingLoss(nn.Module):
    """
    Binary Cross-Entropy loss with logits for point-wise relevance calibration:
    targets: 1.0 for relevant candidate, 0.0 for non-relevant candidate.
    """

    def __init__(self):
        super().__init__()
        self.criterion = nn.BCEWithLogitsLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        return self.criterion(logits.view(-1), targets.view(-1).float())
