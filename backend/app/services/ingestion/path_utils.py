import os
from pathlib import Path
from typing import Optional
from app.core.exceptions import ValidationError


def sanitize_relative_path(user_path: str) -> str:
    """
    Normalizes and validates a relative path to prevent directory traversal attacks (e.g. ../../etc/passwd).
    Returns normalized forward-slash relative path.
    Raises ValidationError if traversal is detected or path is absolute.
    """
    # Disallow null bytes
    if "\0" in user_path:
        raise ValidationError("Path contains invalid null byte")

    # Replace backslashes with forward slashes
    clean_path = user_path.replace("\\", "/").strip()

    # Disallow leading slash or drive letter
    if clean_path.startswith("/") or (len(clean_path) > 1 and clean_path[1] == ":"):
        raise ValidationError(f"Absolute paths not permitted: {user_path}")

    # Resolve parts without accessing filesystem
    parts = []
    for part in clean_path.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if not parts:
                raise ValidationError(f"Path traversal detected in path: {user_path}")
            parts.pop()
        else:
            parts.append(part)

    if not parts:
        raise ValidationError(f"Path resolves to empty root: {user_path}")

    return "/".join(parts)


def safe_join(base_dir: Path, relative_path: str) -> Path:
    """
    Safely joins a base directory with an untrusted relative path,
    guaranteeing that the target is strictly inside base_dir.
    """
    clean_rel = sanitize_relative_path(relative_path)
    base_resolved = base_dir.resolve()
    target_path = (base_dir / clean_rel).resolve()

    try:
        target_path.relative_to(base_resolved)
    except ValueError:
        raise ValidationError(f"Path escapes root directory: {relative_path}")

    return target_path
