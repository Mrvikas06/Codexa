from app.core.benchmarks import run_full_evaluation_suite


def test_full_evaluation_suite():
    res = run_full_evaluation_suite()
    assert res["status"] == "PASSED"
    assert res["overall_passed"] is True
    assert "ranking" in res
    assert "citations" in res
    assert "graph" in res
    assert res["citations"]["precision"] == 1.0
