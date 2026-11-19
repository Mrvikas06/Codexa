import fnmatch
from pathlib import Path
from typing import List, Set

DEFAULT_IGNORE_PATTERNS = [
    # VCS
    ".git",
    ".git/*",
    ".svn",
    ".hg",
    # Dependencies
    "node_modules",
    "node_modules/*",
    "vendor",
    "vendor/*",
    "__pycache__",
    "__pycache__/*",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".venv",
    ".venv/*",
    "venv",
    "venv/*",
    "env",
    "env/*",
    # Build artifacts
    "dist",
    "dist/*",
    "build",
    "build/*",
    "target",
    "target/*",
    "out",
    "out/*",
    "*.egg-info",
    "*.egg-info/*",
    "*.egg",
    "*.tsbuildinfo",
    # Cache and test artifacts
    ".pytest_cache",
    ".pytest_cache/*",
    ".ruff_cache",
    ".ruff_cache/*",
    ".mypy_cache",
    ".mypy_cache/*",
    ".coverage",
    "htmlcov",
    "htmlcov/*",
    # IDEs
    ".idea",
    ".idea/*",
    ".vscode/*",
    # OS files
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    # Secrets & env
    ".env",
    ".env.*",
    # Binaries & large archives
    "*.exe",
    "*.dll",
    "*.so",
    "*.dylib",
    "*.bin",
    "*.iso",
    "*.tar",
    "*.gz",
    "*.zip",
    "*.7z",
    "*.jar",
    "*.war",
    "*.wasm",
    "*.pt",
    "*.pth",
    "*.safetensors",
    "*.onnx",
]


class IgnoreEngine:
    """
    Evaluates file paths against default and repository-provided ignore rules (e.g. .gitignore).
    Supports glob patterns, directory matching, and negation (!).
    """

    def __init__(self, root_dir: Path, custom_patterns: List[str] | None = None):
        self.root_dir = root_dir.resolve()
        self.patterns: List[tuple[str, bool]] = []  # (pattern, is_negated)

        # Load default patterns
        for pat in DEFAULT_IGNORE_PATTERNS:
            self._add_pattern(pat)

        # Load custom patterns if provided
        if custom_patterns:
            for pat in custom_patterns:
                self._add_pattern(pat)

        # Automatically load root .gitignore if present
        root_gitignore = self.root_dir / ".gitignore"
        if root_gitignore.is_file():
            self.load_gitignore(root_gitignore)

    def _add_pattern(self, raw_line: str) -> None:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            return

        is_negated = False
        if line.startswith("!"):
            is_negated = True
            line = line[1:].strip()

        # Normalize slashes
        line = line.replace("\\", "/")

        # Strip trailing slash but record it as directory-only pattern
        if line.endswith("/"):
            line = line[:-1]

        self.patterns.append((line, is_negated))

    def load_gitignore(self, gitignore_path: Path) -> None:
        try:
            with open(gitignore_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    self._add_pattern(line)
        except Exception:
            pass

    def is_ignored(self, relative_path: str, is_dir: bool = False) -> bool:
        """
        Tests if relative_path should be ignored.
        relative_path must be a normalized forward-slash path relative to root_dir.
        """
        norm_path = relative_path.replace("\\", "/").strip("/")
        parts = norm_path.split("/")
        filename = parts[-1] if parts else ""

        ignored = False

        for pattern, is_negated in self.patterns:
            matched = False

            # Check exact match or wildcards
            if fnmatch.fnmatch(norm_path, pattern):
                matched = True
            elif fnmatch.fnmatch(filename, pattern):
                matched = True
            elif any(fnmatch.fnmatch(part, pattern) for part in parts):
                matched = True
            elif pattern.endswith("/*"):
                prefix = pattern[:-2]
                if norm_path.startswith(prefix + "/") or norm_path == prefix:
                    matched = True

            if matched:
                ignored = not is_negated

        return ignored
