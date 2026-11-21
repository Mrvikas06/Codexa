import time
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional


@dataclass
class LatencyProfile:
    operation_name: str
    sample_count: int
    p50_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float


class PerformanceProfiler:
    """
    Performance profiling utility to measure p50, p95, and p99 execution latencies.
    """

    def __init__(self):
        self._samples: Dict[str, List[float]] = {}

    def record(self, operation: str, duration_sec: float):
        if operation not in self._samples:
            self._samples[operation] = []
        self._samples[operation].append(duration_sec * 1000.0)

    def measure(self, operation: str, fn: Callable, *args, **kwargs):
        start = time.perf_counter()
        res = fn(*args, **kwargs)
        duration = time.perf_counter() - start
        self.record(operation, duration)
        return res

    def get_profile(self, operation: str) -> Optional[LatencyProfile]:
        samples = self._samples.get(operation, [])
        if not samples:
            return None

        sorted_s = sorted(samples)
        n = len(sorted_s)
        p50 = sorted_s[int(0.50 * n)]
        p95 = sorted_s[int(0.95 * n)] if n > 1 else sorted_s[-1]
        p99 = sorted_s[int(0.99 * n)] if n > 1 else sorted_s[-1]

        return LatencyProfile(
            operation_name=operation,
            sample_count=n,
            p50_ms=round(p50, 3),
            p95_ms=round(p95, 3),
            p99_ms=round(p99, 3),
            min_ms=round(sorted_s[0], 3),
            max_ms=round(sorted_s[-1], 3),
        )

    def summary(self) -> Dict[str, Dict[str, float]]:
        res = {}
        for op in self._samples:
            prof = self.get_profile(op)
            if prof:
                res[op] = {
                    "samples": prof.sample_count,
                    "p50_ms": prof.p50_ms,
                    "p95_ms": prof.p95_ms,
                    "p99_ms": prof.p99_ms,
                }
        return res
