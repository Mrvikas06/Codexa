from pathlib import Path
import torch
from torch.utils.data import DataLoader

from app.ml.datasets.code_dataset import CodeCollateFn, CodeDataset
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.training.trainer import CodeEncoderTrainer, get_cosine_schedule_with_warmup


def test_code_encoder_training_and_checkpointing(tmp_path: Path):
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    samples = [
        "def foo():\n    return 1\n",
        "def bar():\n    return 2\n",
        "def baz():\n    return 3\n",
        "def qux():\n    return 4\n",
    ]
    queries = ["one", "two", "three", "four"]
    tokenizer.train(samples)

    dataset = CodeDataset(samples, queries)
    collate = CodeCollateFn(tokenizer, max_seq_len=32, mlm_probability=0.15)
    dataloader = DataLoader(dataset, batch_size=2, shuffle=True, collate_fn=collate)

    config = CodeEncoderConfig(
        vocab_size=tokenizer.total_vocab_size,
        hidden_size=32,
        num_layers=2,
        num_heads=2,
        intermediate_size=64,
        max_seq_len=32,
        projection_dim=16,
    )
    model = CodeEncoder(config)

    trainer = CodeEncoderTrainer(
        model=model,
        train_dataloader=dataloader,
        val_dataloader=dataloader,
        learning_rate=1e-3,
        checkpoint_dir=str(tmp_path),
        device_str="cpu",
    )

    scheduler = get_cosine_schedule_with_warmup(trainer.optimizer, 2, 10)

    # 1. Train one epoch
    loss = trainer.train_epoch(scheduler)
    assert loss > 0.0
    assert trainer.global_step > 0

    # 2. Evaluate
    val_loss = trainer.evaluate()
    assert val_loss > 0.0

    # 3. Checkpointing and reload
    ckpt_path = trainer.save_checkpoint("test_ckpt.pt")
    assert ckpt_path.is_file()

    new_model = CodeEncoder(config)
    new_trainer = CodeEncoderTrainer(
        model=new_model,
        train_dataloader=dataloader,
        checkpoint_dir=str(tmp_path),
        device_str="cpu",
    )
    new_trainer.load_checkpoint(ckpt_path)
    assert new_trainer.global_step == trainer.global_step

