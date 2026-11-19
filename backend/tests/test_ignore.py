from pathlib import Path
from app.services.ingestion.ignore import IgnoreEngine


def test_default_ignores(tmp_path: Path):
    engine = IgnoreEngine(tmp_path)
    assert engine.is_ignored(".git/config")
    assert engine.is_ignored("node_modules/react/index.js")
    assert engine.is_ignored("__pycache__/main.cpython-312.pyc")
    assert engine.is_ignored(".venv/bin/python")
    assert engine.is_ignored("dist/bundle.js")
    assert engine.is_ignored("model.pt")
    assert engine.is_ignored("binary.exe")

    # Allowed files
    assert not engine.is_ignored("src/index.ts")
    assert not engine.is_ignored("app/main.py")
    assert not engine.is_ignored("README.md")


def test_custom_gitignore_loading(tmp_path: Path):
    gitignore = tmp_path / ".gitignore"
    gitignore.write_text("*.tmp\nsecret_dir/\n!important.tmp\n", encoding="utf-8")

    engine = IgnoreEngine(tmp_path)
    assert engine.is_ignored("cache.tmp")
    assert engine.is_ignored("secret_dir/data.json")
    assert not engine.is_ignored("important.tmp")
