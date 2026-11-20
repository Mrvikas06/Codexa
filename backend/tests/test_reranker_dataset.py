from app.ml.datasets.reranker_dataset import RerankerCollateFn, RerankerPairwiseDataset
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer


def test_reranker_dataset_and_collate():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    triplets = [
        ("auth query", "def auth(): pass", "def other(): pass"),
        ("db query", "def connect(): pass", "def close(): pass"),
    ]

    dataset = RerankerPairwiseDataset(triplets)
    assert len(dataset) == 2

    collate = RerankerCollateFn(tokenizer, max_seq_len=32)
    batch = collate([dataset[0], dataset[1]])

    assert "pos_input_ids" in batch
    assert "pos_attention_mask" in batch
    assert "neg_input_ids" in batch
    assert "neg_attention_mask" in batch

    b = len(triplets)
    assert batch["pos_input_ids"].shape[0] == b
    assert batch["neg_input_ids"].shape[0] == b
