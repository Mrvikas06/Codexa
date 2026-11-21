import time
import pytest
from app.core.rate_limiter import RateLimiter


def test_rate_limiter_allows_under_limit():
    limiter = RateLimiter(requests_per_minute=60, burst_limit=5)
    allowed, retry_after = limiter.is_allowed("client_1", cost=1.0)
    assert allowed is True
    assert retry_after == 0.0


def test_rate_limiter_blocks_burst_exhaustion():
    limiter = RateLimiter(requests_per_minute=60, burst_limit=2)
    # Drain capacity
    for _ in range(60):
        limiter.is_allowed("client_burst", cost=1.0)

    # Next immediate request should be throttled
    allowed, retry_after = limiter.is_allowed("client_burst", cost=1.0)
    assert allowed is False
    assert retry_after > 0.0


def test_rate_limiter_reset():
    limiter = RateLimiter(requests_per_minute=60, burst_limit=5)
    for _ in range(60):
        limiter.is_allowed("client_reset", cost=1.0)
    allowed, _ = limiter.is_allowed("client_reset", cost=1.0)
    assert allowed is False

    limiter.reset("client_reset")
    allowed_again, _ = limiter.is_allowed("client_reset", cost=1.0)
    assert allowed_again is True
