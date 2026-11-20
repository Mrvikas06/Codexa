import torch
from app.ml.reranker.objectives import PairwiseMarginRankingLoss, PointwiseBCERankingLoss


def test_pairwise_margin_ranking_loss():
    loss_fn = PairwiseMarginRankingLoss(margin=1.0)

    # Positive higher than negative -> low loss
    pos_scores = torch.tensor([[2.5], [3.0]], requires_grad=True)
    neg_scores = torch.tensor([[0.5], [1.0]], requires_grad=True)

    loss = loss_fn(pos_scores, neg_scores)
    assert loss.item() == 0.0

    # Negative higher than positive -> high loss
    pos_bad = torch.tensor([[0.5]], requires_grad=True)
    neg_bad = torch.tensor([[2.5]], requires_grad=True)
    bad_loss = loss_fn(pos_bad, neg_bad)
    assert bad_loss.item() > 0.0
    bad_loss.backward()
    assert pos_bad.grad is not None


def test_pointwise_bce_ranking_loss():
    loss_fn = PointwiseBCERankingLoss()
    logits = torch.tensor([2.0, -2.0], requires_grad=True)
    targets = torch.tensor([1.0, 0.0])

    loss = loss_fn(logits, targets)
    assert loss.item() > 0.0
    loss.backward()
    assert logits.grad is not None
