from app.services.graph.benchmark import evaluate_cycle_benchmarks


def test_evaluate_cycle_benchmarks():
    res = evaluate_cycle_benchmarks("benchmarks/graph_cycles_v1.json")
    assert res["total"] == 2
    assert res["passed_count"] == 2
    assert res["all_passed"] is True
