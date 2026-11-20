import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

from app.core.exceptions import ValidationError
from app.ml.tokenizer.special_tokens import (
    BOS_ID,
    BOS_TOKEN,
    EOS_ID,
    EOS_TOKEN,
    MASK_ID,
    MASK_TOKEN,
    PAD_ID,
    PAD_TOKEN,
    SEP_ID,
    SEP_TOKEN,
    SPECIAL_TOKENS,
    UNK_ID,
    UNK_TOKEN,
)


def get_byte_vocab() -> Dict[bytes, int]:
    """Base vocabulary of 256 individual bytes after 6 special tokens."""
    vocab: Dict[bytes, int] = {}
    for i in range(256):
        vocab[bytes([i])] = len(SPECIAL_TOKENS) + i
    return vocab


class ByteLevelBPETokenizer:
    """
    Byte-level Byte Pair Encoding (BPE) tokenizer for source code.
    Guarantees no out-of-vocabulary loss: any arbitrary UTF-8 string
    can be decomposed into base bytes.
    """

    def __init__(self, vocab_size: int = 16000):
        self.vocab_size = vocab_size
        self.special_tokens = list(SPECIAL_TOKENS)
        self.token_to_id: Dict[str, int] = {}
        self.id_to_token: Dict[int, str] = {}
        self.byte_to_id: Dict[bytes, int] = {}
        self.id_to_byte: Dict[int, bytes] = {}
        self.merges: List[Tuple[bytes, bytes]] = []

        self._init_vocab()

    def _init_vocab(self) -> None:
        self.token_to_id.clear()
        self.id_to_token.clear()
        self.byte_to_id.clear()
        self.id_to_byte.clear()
        self.merges.clear()

        # 1. Register special tokens
        for idx, token in enumerate(self.special_tokens):
            self.token_to_id[token] = idx
            self.id_to_token[idx] = token

        # 2. Register all 256 single byte values
        base_bytes = get_byte_vocab()
        for b, token_id in base_bytes.items():
            self.byte_to_id[b] = token_id
            self.id_to_byte[token_id] = b
            token_repr = b.hex()
            self.token_to_id[f"<0x{token_repr}>"] = token_id
            self.id_to_token[token_id] = f"<0x{token_repr}>"

    def train(self, texts: List[str], max_vocab_size: Optional[int] = None) -> None:
        """
        Learns BPE merges deterministically from a list of code/text samples.
        """
        target_vocab_size = max_vocab_size or self.vocab_size
        self._init_vocab()

        # Represent each text sample as a list of 1-byte byte sequences
        sequences: List[List[bytes]] = []
        for text in texts:
            if not text:
                continue
            b_list = [bytes([b]) for b in text.encode("utf-8")]
            sequences.append(b_list)

        while len(self.id_to_byte) + len(self.special_tokens) < target_vocab_size:
            # Count adjacent pair frequencies
            pair_counts: Dict[Tuple[bytes, bytes], int] = {}
            for seq in sequences:
                for i in range(len(seq) - 1):
                    pair = (seq[i], seq[i + 1])
                    pair_counts[pair] = pair_counts.get(pair, 0) + 1

            if not pair_counts:
                break

            # Find the most frequent pair (ties broken deterministically by pair bytes)
            best_pair = max(pair_counts.items(), key=lambda item: (item[1], item[0]))[0]
            if pair_counts[best_pair] < 2:
                # Stop if pair occurs fewer than 2 times
                break

            merged_bytes = best_pair[0] + best_pair[1]
            new_id = len(self.id_to_byte) + len(self.special_tokens)

            self.merges.append(best_pair)
            self.byte_to_id[merged_bytes] = new_id
            self.id_to_byte[new_id] = merged_bytes

            # Friendly string representation for display
            try:
                decoded = merged_bytes.decode("utf-8")
                token_str = repr(decoded)[1:-1]
            except UnicodeDecodeError:
                token_str = f"<0x{merged_bytes.hex()}>"

            self.token_to_id[token_str] = new_id
            self.id_to_token[new_id] = token_str

            # Apply merge to all sequences
            new_sequences: List[List[bytes]] = []
            for seq in sequences:
                new_seq: List[bytes] = []
                idx = 0
                while idx < len(seq):
                    if idx < len(seq) - 1 and seq[idx] == best_pair[0] and seq[idx + 1] == best_pair[1]:
                        new_seq.append(merged_bytes)
                        idx += 2
                    else:
                        new_seq.append(seq[idx])
                        idx += 1
                new_sequences.append(new_seq)
            sequences = new_sequences

    def encode(
        self,
        text: str,
        add_special_tokens: bool = False,
        max_length: Optional[int] = None,
        pad_to_max: bool = False,
    ) -> List[int]:
        """
        Encodes a string into token IDs.
        Guarantees zero text loss: bytes are preserved.
        """
        raw_bytes = text.encode("utf-8")
        tokens: List[bytes] = [bytes([b]) for b in raw_bytes]

        # Apply learned merges in order of learning
        for pair in self.merges:
            if len(tokens) < 2:
                break
            new_tokens: List[bytes] = []
            idx = 0
            while idx < len(tokens):
                if idx < len(tokens) - 1 and tokens[idx] == pair[0] and tokens[idx + 1] == pair[1]:
                    new_tokens.append(pair[0] + pair[1])
                    idx += 2
                else:
                    new_tokens.append(tokens[idx])
                    idx += 1
            tokens = new_tokens

        ids: List[int] = []
        if add_special_tokens:
            ids.append(BOS_ID)

        for t in tokens:
            token_id = self.byte_to_id.get(t)
            if token_id is None:
                # Fallback to individual bytes (which are guaranteed to exist)
                for b in t:
                    ids.append(self.byte_to_id[bytes([b])])
            else:
                ids.append(token_id)

        if add_special_tokens:
            ids.append(EOS_ID)

        # Truncation
        if max_length is not None and len(ids) > max_length:
            ids = ids[:max_length]

        # Padding
        if pad_to_max and max_length is not None and len(ids) < max_length:
            ids.extend([PAD_ID] * (max_length - len(ids)))

        return ids

    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        """
        Decodes token IDs back into string, replacing invalid UTF-8 sequences safely.
        """
        byte_chunks: List[bytes] = []
        for tid in token_ids:
            if tid < len(self.special_tokens):
                if not skip_special_tokens:
                    tok_name = self.id_to_token.get(tid, f"<token_{tid}>")
                    byte_chunks.append(tok_name.encode("utf-8"))
            else:
                b = self.id_to_byte.get(tid)
                if b is not None:
                    byte_chunks.append(b)

        full_bytes = b"".join(byte_chunks)
        return full_bytes.decode("utf-8", errors="replace")

    def save_vocab(self, file_path: Union[str, Path]) -> None:
        """Serializes tokenizer vocabulary and merge rules to JSON."""
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "vocab_size": self.vocab_size,
            "special_tokens": self.special_tokens,
            "merges": [
                [pair[0].hex(), pair[1].hex()]
                for pair in self.merges
            ],
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_vocab(self, file_path: Union[str, Path]) -> None:
        """Loads vocabulary and merge rules from JSON."""
        path = Path(file_path)
        if not path.is_file():
            raise ValidationError(f"Tokenizer vocab file not found: {file_path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.vocab_size = data.get("vocab_size", 16000)
        self.special_tokens = data.get("special_tokens", list(SPECIAL_TOKENS))
        self._init_vocab()

        for hex_pair in data.get("merges", []):
            b0 = bytes.fromhex(hex_pair[0])
            b1 = bytes.fromhex(hex_pair[1])
            pair = (b0, b1)
            merged = b0 + b1
            new_id = len(self.id_to_byte) + len(self.special_tokens)
            self.merges.append(pair)
            self.byte_to_id[merged] = new_id
            self.id_to_byte[new_id] = merged

            try:
                tok_str = repr(merged.decode("utf-8"))[1:-1]
            except UnicodeDecodeError:
                tok_str = f"<0x{merged.hex()}>"
            self.token_to_id[tok_str] = new_id
            self.id_to_token[new_id] = tok_str

    @property
    def total_vocab_size(self) -> int:
        return len(self.special_tokens) + len(self.id_to_byte)
