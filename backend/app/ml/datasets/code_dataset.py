import random
from typing import Dict, List, Optional, Tuple
import torch
from torch.utils.data import Dataset
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import BOS_ID, EOS_ID, MASK_ID, PAD_ID


class CodeDataset(Dataset):
    """
    Dataset holding source code samples with optional paired natural language descriptions.
    """

    def __init__(self, code_samples: List[str], descriptions: Optional[List[str]] = None):
        self.code_samples = code_samples
        self.descriptions = descriptions or ["" for _ in code_samples]
        assert len(self.code_samples) == len(self.descriptions), "Samples and descriptions must match"

    def __len__(self) -> int:
        return len(self.code_samples)

    def __getitem__(self, idx: int) -> Tuple[str, str]:
        return self.code_samples[idx], self.descriptions[idx]


class CodeCollateFn:
    """
    Collate function supporting:
    - Dynamic padding to the longest sequence in the batch (saving VRAM)
    - MLM masking (15% selection: 80% MASK_ID, 10% random token, 10% preserved)
    - Contrastive paired batching for query-code pairs
    """

    def __init__(
        self,
        tokenizer: ByteLevelBPETokenizer,
        max_seq_len: int = 512,
        mlm_probability: float = 0.15,
    ):
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.mlm_probability = mlm_probability

    def __call__(self, batch: List[Tuple[str, str]]) -> Dict[str, torch.Tensor]:
        code_texts = [item[0] for item in batch]
        desc_texts = [item[1] for item in batch]

        # Tokenize code texts
        code_ids_list = [
            self.tokenizer.encode(t, add_special_tokens=True, max_length=self.max_seq_len)
            for t in code_texts
        ]

        # Dynamic max length for this specific batch
        batch_max_len = max(len(ids) for ids in code_ids_list)

        batch_input_ids: List[List[int]] = []
        batch_attention_mask: List[List[int]] = []
        batch_mlm_labels: List[List[int]] = []

        vocab_size = self.tokenizer.total_vocab_size

        for ids in code_ids_list:
            pad_len = batch_max_len - len(ids)
            padded_ids = ids + [PAD_ID] * pad_len
            attn_mask = [1] * len(ids) + [0] * pad_len

            # Build MLM targets
            labels = [-100] * batch_max_len
            masked_input_ids = list(padded_ids)

            for i in range(len(ids)):
                # Skip special tokens BOS and EOS
                if ids[i] in (BOS_ID, EOS_ID, PAD_ID):
                    continue

                if random.random() < self.mlm_probability:
                    labels[i] = ids[i]
                    rand = random.random()
                    if rand < 0.8:
                        masked_input_ids[i] = MASK_ID
                    elif rand < 0.9:
                        masked_input_ids[i] = random.randint(6, vocab_size - 1)
                    # Remaining 10%: keep original token

            batch_input_ids.append(masked_input_ids)
            batch_attention_mask.append(attn_mask)
            batch_mlm_labels.append(labels)

        result: Dict[str, torch.Tensor] = {
            "input_ids": torch.tensor(batch_input_ids, dtype=torch.long),
            "attention_mask": torch.tensor(batch_attention_mask, dtype=torch.long),
            "mlm_labels": torch.tensor(batch_mlm_labels, dtype=torch.long),
        }

        # If descriptions provided, tokenize queries for contrastive loss
        has_descriptions = any(bool(d.strip()) for d in desc_texts)
        if has_descriptions:
            desc_ids_list = [
                self.tokenizer.encode(d, add_special_tokens=True, max_length=self.max_seq_len)
                for d in desc_texts
            ]
            desc_max_len = max(len(ids) for ids in desc_ids_list)
            desc_padded = [ids + [PAD_ID] * (desc_max_len - len(ids)) for ids in desc_ids_list]
            desc_mask = [[1] * len(ids) + [0] * (desc_max_len - len(ids)) for ids in desc_ids_list]

            result["query_input_ids"] = torch.tensor(desc_padded, dtype=torch.long)
            result["query_attention_mask"] = torch.tensor(desc_mask, dtype=torch.long)

        return result
