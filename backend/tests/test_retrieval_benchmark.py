import tempfile
import json
from app.services.retrieval.benchmark import load_hybrid_benchmark, calculate_retrieval_coverage


def test_load_hybrid_benchmark():
    data = [{"query": "auth", "relevant_symbols": ["auth_func"], "relevant_files": ["a.py"]}]
    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".json") as tmp:
        json.dump(data, tmp)
        tmp.flush()
        loaded = load_hybrid_benchmark(tmp.name)
        assert len(loaded) == 1
        assert loaded[0]["query"] == "auth"


def test_calculate_retrieval_coverage():
    retrieved = ["src/auth.py", "src/user.py"]
    expected = ["src/auth.py", "src/admin.py"]
    cov = calculate_retrieval_coverage(retrieved, expected)
    assert cov == 0.5
