from pathlib import Path
import torch
from torch.utils.data import DataLoader

from app.ml.datasets.reranker_dataset import RerankerCollateFn, RerankerPairwiseDataset
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.training.reranker_trainer import RerankerTrainer


def test_reranker_training_and_eval(tmp_path: Path):
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    triplets = [
        ("auth query", "def auth(): return True", "def fib(n): return n"),
        ("db query", "def db(): return conn", "def math(): return 42"),
        ("hash query", "def hash_pw(): return h", "def print_hi(): print()"),
    ]

    dataset = RerankerPairwiseDataset(triplets)
    collate = RerankerCollateFn(tokenizer, max_seq_len=32)
    loader = DataLoader(dataset, batch_size=2, shuffle=True, collate_fn=collate)

    config = RerankerConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
    )
    model = CrossEncoderReranker(config)

    trainer = RerankerTrainer(
        model=model,
        train_dataloader=loader,
        val_dataloader=loader,
        learning_rate=1e-3,
        checkpoint_dir=str(tmp_path),
        device_str="cpu",
    )

    loss = trainer.train_epoch()
    assert loss >= 0.0

    eval_res = trainer.evaluate()
    assert "val_loss" in eval_res
    assert "pairwise_acc" in eval_res

    ckpt = trainer.save_checkpoint("reranker_test.pt")
    assert ckpt.is_file()

    new_model = CrossEncoderReranker(config)
    new_trainer = RerankerTrainer(
        model=new_model,
        train_dataloader=loader,
        checkpoint_dir=str(tmp_path),
        device_str="cpu",
    )
    new_trainer.load_checkpoint(ckpt)
    assert new_trainer.global_step == trainer.global_step
