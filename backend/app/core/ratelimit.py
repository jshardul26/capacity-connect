import threading
import time


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window limiter that counts events per key over a
    fixed window, evicting stale entries to keep memory bounded on the field
    appliances where credentials are validated under poor connectivity."""

    def __init__(self, max_attempts: int = 20, window_seconds: float = 60.0, max_keys: int = 10_000):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.max_keys = max_keys
        self._events: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        with self._lock:
            events = [entry for entry in self._events.get(key, []) if now - entry < self.window_seconds]
            if len(events) >= self.max_attempts:
                self._events[key] = events
                return False
            events.append(now)
            if len(self._events) >= self.max_keys:
                self._evict_oldest(now)
            self._events[key] = events
            return True

    def _evict_oldest(self, now: float) -> None:
        stale_keys = [key for key, entries in self._events.items() if not entries or now - max(entries) >= self.window_seconds]
        if stale_keys:
            for key in stale_keys:
                del self._events[key]
            return
        oldest = min(self._events, key=lambda key: self._events[key][-1])
        del self._events[oldest]


auth_login_limiter = SlidingWindowRateLimiter(max_attempts=20, window_seconds=60)