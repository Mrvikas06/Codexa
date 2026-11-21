import json
from pathlib import Path
from typing import Any, Dict, List


def load_hybrid_benchmark(file_path: str) -> List[Dict[str, Any]]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Benchmark file not found: {file_path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_retrieval_coverage(
    retrieved_items: List[str], expected_items: List[str]
) -> float:
    if not expected_items:
        return 1.0
    matches = sum(1 for item in expected_items if item in retrieved_items)
    return matches / len(expected_items)
