from app.core.profiler import PerformanceProfiler


def test_performance_profiler():
    profiler = PerformanceProfiler()
    for d in [0.010, 0.015, 0.020, 0.025, 0.030]:
        profiler.record("search_query", d)

    prof = profiler.get_profile("search_query")
    assert prof is not None
    assert prof.sample_count == 5
    assert prof.p50_ms == 20.0
    assert prof.min_ms == 10.0
    assert prof.max_ms == 30.0

    summary = profiler.summary()
    assert "search_query" in summary
    assert summary["search_query"]["samples"] == 5
