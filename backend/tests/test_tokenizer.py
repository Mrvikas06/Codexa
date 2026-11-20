from pathlib import Path
import pytest
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.tokenizer.special_tokens import BOS_ID, EOS_ID, PAD_ID, SPECIAL_TOKENS

SAMPLE_CODE = """
def authenticate(token: str) -> bool:
    if not token:
        return False
    return len(token) > 10
"""


def test_tokenizer_initialization():
    tokenizer = ByteLevelBPETokenizer(vocab_size=1000)
    # Check 6 special tokens + 256 byte tokens = 262 minimum
    assert tokenizer.total_vocab_size >= 262


def test_tokenizer_train_and_encode_decode():
    tokenizer = ByteLevelBPETokenizer(vocab_size=350)
    samples = [
        "def foo():\n    return 42\n",
        "def bar():\n    return 'hello'\n",
        "class TestService:\n    pass\n",
        SAMPLE_CODE,
    ]
    tokenizer.train(samples)

    # Encode with special tokens
    encoded = tokenizer.encode(SAMPLE_CODE, add_special_tokens=True)
    assert encoded[0] == BOS_ID
    assert encoded[-1] == EOS_ID

    # Roundtrip without special tokens
    encoded_raw = tokenizer.encode(SAMPLE_CODE, add_special_tokens=False)
    decoded = tokenizer.decode(encoded_raw)
    assert decoded == SAMPLE_CODE


def test_tokenizer_zero_loss_arbitrary_unicode():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    # Emoji, non-ASCII, code with unusual characters
    complex_text = "def 🚀_function(ñ: str) -> 日本語: return '🎉_123'"
    encoded = tokenizer.encode(complex_text)
    decoded = tokenizer.decode(encoded)
    assert decoded == complex_text


def test_tokenizer_padding_and_truncation():
    tokenizer = ByteLevelBPETokenizer(vocab_size=300)
    text = "x = 1"
    padded = tokenizer.encode(text, max_length=10, pad_to_max=True)
    assert len(padded) == 10
    assert padded[-1] == PAD_ID

    truncated = tokenizer.encode("a very long string that should be truncated", max_length=5)
    assert len(truncated) == 5


def test_tokenizer_serialization(tmp_path: Path):
    vocab_file = tmp_path / "vocab.json"
    tokenizer = ByteLevelBPETokenizer(vocab_size=320)
    tokenizer.train([SAMPLE_CODE, "x = x + 1"])
    tokenizer.save_vocab(vocab_file)

    loaded_tokenizer = ByteLevelBPETokenizer()
    loaded_tokenizer.load_vocab(vocab_file)

    assert loaded_tokenizer.total_vocab_size == tokenizer.total_vocab_size
    enc1 = tokenizer.encode(SAMPLE_CODE)
    enc2 = loaded_tokenizer.encode(SAMPLE_CODE)
    assert enc1 == enc2
