import random
import re
from typing import Dict, List, Optional, Set, Tuple
import torch
from torch.utils.data import Dataset
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import BOS_ID, EOS_ID, PAD_ID, SEP_ID


def mine_hard_negatives(
    query: str,
    positive_code: str,
    corpus_chunks: List[str],
    top_k: int = 5,
) -> List[str]:
    """
    Mines hard negative candidates from a corpus of code chunks.
    A hard negative has high lexical overlap with the query or positive code
    (e.g. shares keywords, imports, or variable names) but is not identical
    to the positive code.
    """
    reference_text = f"{query} {positive_code}"
    ref_words = set(re.findall(r"[A-Za-z0-9]+", reference_text.lower()))
    candidates_with_scores: List[Tuple[float, str]] = []

    for chunk in corpus_chunks:
        if chunk.strip() == positive_code.strip():
            continue

        c_words = set(re.findall(r"[A-Za-z0-9]+", chunk.lower()))
        overlap = len(ref_words.intersection(c_words))
        if overlap > 0:
            jaccard = overlap / len(ref_words.union(c_words))
            candidates_with_scores.append((jaccard, chunk))

    candidates_with_scores.sort(key=lambda x: x[0], reverse=True)
    mined = [c for _, c in candidates_with_scores[:top_k]]

    # If not enough hard negatives, sample random negatives from corpus
    if len(mined) < top_k:
        remaining = [c for c in corpus_chunks if c.strip() != positive_code.strip() and c not in mined]
        if remaining:
            sample_count = min(top_k - len(mined), len(remaining))
            mined.extend(random.sample(remaining, sample_count))

    return mined


class RerankerPairwiseDataset(Dataset):
    """
    Dataset for pairwise ranking training: (query, pos_code, neg_code).
    """

    def __init__(self, triplets: List[Tuple[str, str, str]]):
        self.triplets = triplets

    def __len__(self) -> int:
        return len(self.triplets)

    def __getitem__(self, idx: int) -> Tuple[str, str, str]:
        return self.triplets[idx]


class RerankerCollateFn:
    """
    Collates pairwise triplets into paired tensors:
    - pos_input_ids: <BOS> query <SEP> pos_code <EOS>
    - neg_input_ids: <BOS> query <SEP> neg_code <EOS>
    Dynamic batch padding to longest sequence.
    """

    def __init__(self, tokenizer: ByteLevelBPETokenizer, max_seq_len: int = 512):
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len

    def _build_joint(self, query: str, code: str) -> List[int]:
        q_ids = self.tokenizer.encode(query, add_special_tokens=False)
        c_ids = self.tokenizer.encode(code, add_special_tokens=False)

        q_budget = self.max_seq_len // 3
        c_budget = (self.max_seq_len * 2) // 3

        joint = [BOS_ID] + q_ids[:q_budget] + [SEP_ID] + c_ids[:c_budget] + [EOS_ID]
        return joint[: self.max_seq_len]

    def __call__(self, batch: List[Tuple[str, str, str]]) -> Dict[str, torch.Tensor]:
        pos_ids_list = [self._build_joint(q, pos) for q, pos, _ in batch]
        neg_ids_list = [self._build_joint(q, neg) for q, _, neg in batch]

        max_len = max(
            max(len(ids) for ids in pos_ids_list),
            max(len(ids) for ids in neg_ids_list),
        )

        pos_padded = [ids + [PAD_ID] * (max_len - len(ids)) for ids in pos_ids_list]
        pos_mask = [[1] * len(ids) + [0] * (max_len - len(ids)) for ids in pos_ids_list]

        neg_padded = [ids + [PAD_ID] * (max_len - len(ids)) for ids in neg_ids_list]
        neg_mask = [[1] * len(ids) + [0] * (max_len - len(ids)) for ids in neg_ids_list]

        return {
            "pos_input_ids": torch.tensor(pos_padded, dtype=torch.long),
            "pos_attention_mask": torch.tensor(pos_mask, dtype=torch.long),
            "neg_input_ids": torch.tensor(neg_padded, dtype=torch.long),
            "neg_attention_mask": torch.tensor(neg_mask, dtype=torch.long),
        }
