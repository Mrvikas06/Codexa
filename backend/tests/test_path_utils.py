from pathlib import Path
import pytest
from app.core.exceptions import ValidationError
from app.services.ingestion.path_utils import safe_join, sanitize_relative_path


def test_sanitize_valid_relative_path():
    assert sanitize_relative_path("src/auth/service.py") == "src/auth/service.py"
    assert sanitize_relative_path("src\\utils\\helpers.py") == "src/utils/helpers.py"
    assert sanitize_relative_path("./src/./main.py") == "src/main.py"


def test_sanitize_path_traversal_detection():
    with pytest.raises(ValidationError):
        sanitize_relative_path("../../etc/passwd")

    with pytest.raises(ValidationError):
        sanitize_relative_path("src/../../secret.key")


def test_sanitize_absolute_path_rejection():
    with pytest.raises(ValidationError):
        sanitize_relative_path("/etc/passwd")

    with pytest.raises(ValidationError):
        sanitize_relative_path("C:\\Windows\\System32")


def test_safe_join(tmp_path: Path):
    root = tmp_path / "repo"
    root.mkdir()
    target = safe_join(root, "subdir/file.txt")
    assert target.is_relative_to(root)
    assert target.name == "file.txt"

    with pytest.raises(ValidationError):
        safe_join(root, "../outside.txt")
