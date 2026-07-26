import time
import logging
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException

logger = logging.getLogger("talentiq.ratelimit")

_buckets: Dict[str, list] = defaultdict(list)


class RateLimitConfig:
    def __init__(
        self,
        per_minute: int = 10,
        per_hour: int = 60,
        burst: int = 5,
    ):
        self.per_minute = per_minute
        self.per_hour = per_hour
        self.burst = burst


AI_RATE_LIMITS = {
    "summarize":        RateLimitConfig(per_minute=10, per_hour=60, burst=5),
    "parse-resume":     RateLimitConfig(per_minute=5, per_hour=30, burst=3),
    "extract-skills":   RateLimitConfig(per_minute=10, per_hour=60, burst=5),
    "fit-analysis":     RateLimitConfig(per_minute=5, per_hour=30, burst=3),
    "bias-analysis":    RateLimitConfig(per_minute=5, per_hour=30, burst=3),
    "generate-email":   RateLimitConfig(per_minute=8, per_hour=50, burst=4),
    "task-suggestions": RateLimitConfig(per_minute=10, per_hour=60, burst=5),
    "chat":             RateLimitConfig(per_minute=10, per_hour=60, burst=5),
}

DEFAULT_LIMIT = RateLimitConfig(per_minute=10, per_hour=60, burst=5)


def _cleanup(key: str, window: int):
    now = time.time()
    _buckets[key] = [t for t in _buckets[key] if now - t < window]


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(request: Request, endpoint: str) -> Tuple[int, int, int]:
    ip = _get_client_ip(request)
    config = AI_RATE_LIMITS.get(endpoint, DEFAULT_LIMIT)
    key = f"ai:{endpoint}:{ip}"

    _cleanup(f"{key}:min", 60)
    _cleanup(f"{key}:hr", 3600)

    minute_count = len(_buckets[f"{key}:min"])
    hour_count = len(_buckets[f"{key}:hr"])

    if minute_count >= config.per_minute:
        retry_after = 60 - (time.time() - _buckets[f"{key}:min"][0])
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "limit": config.per_minute,
                "window": "minute",
                "retry_after_seconds": max(1, int(retry_after)),
            },
            headers={"Retry-After": str(max(1, int(retry_after)))},
        )

    if hour_count >= config.per_hour:
        retry_after = 3600 - (time.time() - _buckets[f"{key}:hr"][0])
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Hourly rate limit exceeded",
                "limit": config.per_hour,
                "window": "hour",
                "retry_after_seconds": max(1, int(retry_after)),
            },
            headers={"Retry-After": str(max(1, int(retry_after)))},
        )

    now = time.time()
    _buckets[f"{key}:min"].append(now)
    _buckets[f"{key}:hr"].append(now)

    remaining_min = config.per_minute - minute_count - 1
    remaining_hr = config.per_hour - hour_count - 1

    return remaining_min, remaining_hr, config.per_minute


def get_rate_limit_headers(endpoint: str, remaining_min: int, remaining_hr: int, limit: int) -> dict:
    return {
        "X-RateLimit-Limit-Minute": str(limit),
        "X-RateLimit-Remaining-Minute": str(max(0, remaining_min)),
        "X-RateLimit-Remaining-Hour": str(max(0, remaining_hr)),
        "X-RateLimit-Policy": f"{limit};w=60",
    }
