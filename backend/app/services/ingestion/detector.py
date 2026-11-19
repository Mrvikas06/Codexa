import hashlib
import os
from pathlib import Path
from typing import Optional, Tuple

# Mapping of file extensions to canonical language identifiers
EXTENSION_LANGUAGE_MAP = {
    ".py": "python",
    ".pyw": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".hpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".cs": "csharp",
    ".rb": "ruby",
    ".php": "php",
    ".scala": "scala",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".swift": "swift",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".sql": "sql",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "scss",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".md": "markdown",
    ".rst": "restructuredtext",
    ".txt": "text",
}

# Exact filename matches
FILENAME_LANGUAGE_MAP = {
    "dockerfile": "dockerfile",
    "containerfile": "dockerfile",
    "makefile": "makefile",
    "gnumakefile": "makefile",
    "cmakelists.txt": "cmake",
    "cargo.toml": "toml",
    "pyproject.toml": "toml",
    "package.json": "json",
}

MAX_INDEXABLE_FILE_SIZE = 2 * 1024 * 1024  # 2 Megabytes


def detect_language(path: Path) -> str:
    filename = path.name.lower()
    if filename in FILENAME_LANGUAGE_MAP:
        return FILENAME_LANGUAGE_MAP[filename]

    ext = path.suffix.lower()
    return EXTENSION_LANGUAGE_MAP.get(ext, "unknown")


def is_binary_content(sample_bytes: bytes) -> bool:
    """
    Determines if content is binary by inspecting the first block for null bytes
    or high concentration of control characters.
    """
    if not sample_bytes:
        return False

    if b"\x00" in sample_bytes:
        return True

    # Check for excessive non-printable characters
    text_chars = bytearray({7, 8, 9, 10, 12, 13, 27} | set(range(0x20, 0x100)) - {0x7F})
    non_text = sample_bytes.translate(None, text_chars)
    if len(non_text) / len(sample_bytes) > 0.30:
        return True

    return False


def inspect_file(
    file_path: Path,
    max_size: int = MAX_INDEXABLE_FILE_SIZE,
) -> Tuple[bool, str, int, str, int]:
    """
    Inspects a file on disk.
    Returns:
    (is_binary, language, size_bytes, content_hash_sha256, line_count)
    """
    size_bytes = file_path.stat().st_size
    language = detect_language(file_path)

    if size_bytes == 0:
        empty_hash = hashlib.sha256(b"").hexdigest()
        return False, language, 0, empty_hash, 0

    # Read first 8KB to test for binary
    with open(file_path, "rb") as f:
        sample = f.read(8192)
        if is_binary_content(sample):
            f.seek(0)
            hasher = hashlib.sha256()
            while chunk := f.read(65536):
                hasher.update(chunk)
            return True, language, size_bytes, hasher.hexdigest(), 0

        # It is text: compute full hash and line count
        f.seek(0)
        hasher = hashlib.sha256()
        line_count = 0
        while chunk := f.read(65536):
            hasher.update(chunk)
            line_count += chunk.count(b"\n")

    return False, language, size_bytes, hasher.hexdigest(), line_count
