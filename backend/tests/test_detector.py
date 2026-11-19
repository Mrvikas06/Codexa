from pathlib import Path
from app.services.ingestion.detector import detect_language, inspect_file, is_binary_content


def test_language_detection():
    assert detect_language(Path("app/main.py")) == "python"
    assert detect_language(Path("src/components/App.tsx")) == "typescript"
    assert detect_language(Path("src/index.js")) == "javascript"
    assert detect_language(Path("Dockerfile")) == "dockerfile"
    assert detect_language(Path("Makefile")) == "makefile"
    assert detect_language(Path("Cargo.toml")) == "toml"


def test_binary_detection():
    # Null byte in binary sample
    assert is_binary_content(b"Hello\x00World")
    # Clean UTF-8 text
    assert not is_binary_content(b"def hello():\n    return 'world'\n")


def test_inspect_file(tmp_path: Path):
    text_file = tmp_path / "service.py"
    text_file.write_text("def test():\n    pass\n", encoding="utf-8")

    is_bin, lang, size, content_hash, line_count = inspect_file(text_file)
    assert not is_bin
    assert lang == "python"
    assert size > 0
    assert line_count == 2
    assert len(content_hash) == 64
