import torch
from app.ml.encoder.objectives import ContrastiveLoss, MaskedLanguageModelingLoss


def test_mlm_loss_calculation():
    loss_fn = MaskedLanguageModelingLoss(ignore_index=-100)
    batch_size = 2
    seq_len = 4
    vocab_size = 10

    logits = torch.randn(batch_size, seq_len, vocab_size, requires_grad=True)
    targets = torch.tensor([
        [1, -100, 3, -100],
        [-100, 5, -100, -100],
    ])

    loss = loss_fn(logits, targets)
    assert loss.item() > 0.0
    loss.backward()
    assert logits.grad is not None


def test_contrastive_loss_calculation():
    loss_fn = ContrastiveLoss(temperature=0.1)
    batch_size = 4
    dim = 16

    queries = torch.randn(batch_size, dim, requires_grad=True)
    codes = torch.randn(batch_size, dim, requires_grad=True)

    # Normalize
    q_norm = queries / torch.norm(queries, dim=-1, keepdim=True)
    c_norm = codes / torch.norm(codes, dim=-1, keepdim=True)

    loss = loss_fn(q_norm, c_norm)
    assert loss.item() > 0.0
    loss.backward()
    assert queries.grad is not None
    assert codes.grad is not None
