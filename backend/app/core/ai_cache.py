import hashlib
import json
import time
import threading
from typing import Optional, Any
import logging

logger = logging.getLogger("talentiq.cache")


class AICache:
    def __init__(self, ttl_seconds: int = 3600, max_size: int = 1000):
        self._cache: dict[str, dict] = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def _make_key(self, prompt: str, model: str, **kwargs) -> str:
        raw = json.dumps({"prompt": prompt, "model": model, **kwargs}, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._misses += 1
                return None
            if time.time() - entry["created_at"] > self._ttl:
                del self._cache[key]
                self._misses += 1
                return None
            self._hits += 1
            logger.debug(f"Cache hit for key {key[:12]}...")
            return entry["value"]

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            if len(self._cache) >= self._max_size:
                self._evict_oldest()
            self._cache[key] = {
                "value": value,
                "created_at": time.time(),
            }
            logger.debug(f"Cache set for key {key[:12]}...")

    def invalidate(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def invalidate_all(self) -> int:
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count

    def cleanup_expired(self) -> int:
        with self._lock:
            now = time.time()
            expired = [k for k, v in self._cache.items() if now - v["created_at"] > self._ttl]
            for k in expired:
                del self._cache[k]
            return len(expired)

    def _evict_oldest(self) -> None:
        if not self._cache:
            return
        oldest_key = min(self._cache, key=lambda k: self._cache[k]["created_at"])
        del self._cache[oldest_key]

    @property
    def stats(self) -> dict:
        with self._lock:
            total = self._hits + self._misses
            return {
                "size": len(self._cache),
                "max_size": self._max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": f"{(self._hits / total * 100):.1f}%" if total > 0 else "0%",
                "ttl_seconds": self._ttl,
            }


ai_cache = AICache(ttl_seconds=3600, max_size=1000)


def cached_ai_call(prompt: str, model: str, **kwargs) -> Optional[Any]:
    key = ai_cache._make_key(prompt, model, **kwargs)
    return ai_cache.get(key)


def store_ai_response(prompt: str, model: str, response: Any, **kwargs) -> None:
    key = ai_cache._make_key(prompt, model, **kwargs)
    ai_cache.set(key, response)
