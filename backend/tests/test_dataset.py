import torch
from app.ml.datasets.code_dataset import CodeCollateFn, CodeDataset
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import MASK_ID, PAD_ID


def test_code_dataset_and_collate():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    samples = ["def add(a, b):\n    return a + b\n", "x = 42\n"]
    descriptions = ["add function", "variable assign"]

    dataset = CodeDataset(samples, descriptions)
    assert len(dataset) == 2

    collate_fn = CodeCollateFn(tokenizer, max_seq_len=64, mlm_probability=0.2)
    batch = collate_fn([dataset[0], dataset[1]])

    assert "input_ids" in batch
    assert "attention_mask" in batch
    assert "mlm_labels" in batch
    assert "query_input_ids" in batch
    assert "query_attention_mask" in batch

    # Check that shapes match
    b, s = batch["input_ids"].shape
    assert b == 2
    assert batch["attention_mask"].shape == (b, s)
    assert batch["mlm_labels"].shape == (b, s)
