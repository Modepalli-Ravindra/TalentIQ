import pytest
from app.core.ai_cache import AICache


class TestAICache:
    def test_set_and_get(self):
        cache = AICache(ttl_seconds=3600, max_size=100)
        cache.set("key1", {"summary": "test"})
        result = cache.get("key1")
        assert result == {"summary": "test"}

    def test_get_missing_key(self):
        cache = AICache(ttl_seconds=3600, max_size=100)
        result = cache.get("nonexistent")
        assert result is None

    def test_expired_entry(self):
        cache = AICache(ttl_seconds=0, max_size=100)
        cache.set("key1", "value1")
        result = cache.get("key1")
        assert result is None

    def test_max_size_eviction(self):
        cache = AICache(ttl_seconds=3600, max_size=2)
        cache.set("key1", "val1")
        cache.set("key2", "val2")
        cache.set("key3", "val3")
        assert cache.get("key1") is None
        assert cache.get("key2") is not None
        assert cache.get("key3") is not None

    def test_invalidate(self):
        cache = AICache(ttl_seconds=3600, max_size=100)
        cache.set("key1", "value1")
        removed = cache.invalidate("key1")
        assert removed is True
        assert cache.get("key1") is None

    def test_invalidate_nonexistent(self):
        cache = AICache(ttl_seconds=3600, max_size=100)
        removed = cache.invalidate("nonexistent")
        assert removed is False

    def test_invalidate_all(self):
        cache = AICache(ttl_seconds=3600, max_size=100)
        cache.set("key1", "val1")
        cache.set("key2", "val2")
        count = cache.invalidate_all()
        assert count == 2
        assert cache.get("key1") is None

    def test_cleanup_expired(self):
        cache = AICache(ttl_seconds=0, max_size=100)
        cache.set("key1", "val1")
        cache.set("key2", "val2")
        removed = cache.cleanup_expired()
        assert removed == 2

    def test_stats(self):
        cache = AICache(ttl_seconds=3600, max_size=100)
        cache.set("key1", "val1")
        cache.get("key1")
        cache.get("missing")
        stats = cache.stats
        assert stats["size"] == 1
        assert stats["hits"] == 1
        assert stats["misses"] == 1

    def test_thread_safety(self):
        import threading
        cache = AICache(ttl_seconds=3600, max_size=1000)
        errors = []

        def write_and_read():
            try:
                for i in range(100):
                    cache.set(f"key-{i}", f"val-{i}")
                    cache.get(f"key-{i}")
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=write_and_read) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert len(errors) == 0
