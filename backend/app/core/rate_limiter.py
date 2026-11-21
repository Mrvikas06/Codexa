import time
from collections import defaultdict
from typing import Dict, Tuple


class RateLimiter:
    """In-memory sliding-window token bucket rate limiter for API endpoints."""

    def __init__(self, requests_per_minute: int = 120, burst_limit: int = 20) -> None:
        self.rate = requests_per_minute / 60.0  # tokens added per second
        self.capacity = max(requests_per_minute, burst_limit)
        self.tokens: Dict[str, float] = defaultdict(lambda: float(self.capacity))
        self.last_update: Dict[str, float] = defaultdict(time.time)

    def is_allowed(self, client_id: str, cost: float = 1.0) -> Tuple[bool, float]:
        """Check if client request is within rate limit.
        Returns: (is_allowed: bool, retry_after_seconds: float)
        """
        now = time.time()
        time_passed = now - self.last_update[client_id]
        self.last_update[client_id] = now

        # Refill tokens
        refilled = self.tokens[client_id] + time_passed * self.rate
        self.tokens[client_id] = min(float(self.capacity), refilled)

        if self.tokens[client_id] >= cost:
            self.tokens[client_id] -= cost
            return True, 0.0
        else:
            deficit = cost - self.tokens[client_id]
            retry_after = deficit / self.rate if self.rate > 0 else 60.0
            return False, round(retry_after, 2)

    def reset(self, client_id: str) -> None:
        """Reset rate limiter state for a client."""
        if client_id in self.tokens:
            del self.tokens[client_id]
        if client_id in self.last_update:
            del self.last_update[client_id]
