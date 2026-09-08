from app.core.ratelimit import SlidingWindowRateLimiter


def test_sliding_window_allows_up_to_limit_then_rejects():
    limiter = SlidingWindowRateLimiter(max_attempts=3, window_seconds=60)
    assert all(limiter.allow("station-1", t) for t in (0, 1, 2))
    assert limiter.allow("station-1", 3) is False


def test_sliding_window_recovers_after_window_elapses():
    limiter = SlidingWindowRateLimiter(max_attempts=2, window_seconds=10)
    assert limiter.allow("station-1", 0) and limiter.allow("station-1", 1)
    assert limiter.allow("station-1", 2) is False
    assert limiter.allow("station-1", 15) is True, "expired entries must leave the window"


def test_limiter_keys_are_isolated():
    limiter = SlidingWindowRateLimiter(max_attempts=1, window_seconds=60)
    assert limiter.allow("client-a", 0) is True
    assert limiter.allow("client-a", 1) is False
    assert limiter.allow("client-b", 2) is True, "one client's throttling must not leak to another"


def test_limiter_bounds_memory_when_full():
    limiter = SlidingWindowRateLimiter(max_attempts=1, window_seconds=60, max_keys=5)
    for index in range(20):
        limiter.allow(f"client-{index}", index)
    assert len(limiter._events) <= 5