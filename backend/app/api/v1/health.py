from fastapi import APIRouter, Depends
from datetime import datetime
import httpx
import asyncio
import logging
import time

from app.core.config import settings
from app.core.ai_cache import ai_cache

logger = logging.getLogger("talentiq.health")

router = APIRouter()

# Simple in-memory metrics
_metrics = {
    "requests_total": 0,
    "requests_by_status": {},
    "requests_by_endpoint": {},
    "errors_total": 0,
    "start_time": time.time(),
    "ai_calls_total": 0,
    "ai_cache_hits": 0,
}


def record_request(status_code: int, endpoint: str):
    _metrics["requests_total"] += 1
    _metrics["requests_by_status"][str(status_code)] = _metrics["requests_by_status"].get(str(status_code), 0) + 1
    _metrics["requests_by_endpoint"][endpoint] = _metrics["requests_by_endpoint"].get(endpoint, 0) + 1
    if status_code >= 500:
        _metrics["errors_total"] += 1


async def _check_database() -> dict:
    try:
        from app.core.supabase import get_supabase_client
        client = get_supabase_client()
        result = client.table("external_jobs").select("id", count="exact").limit(1).execute()
        return {"status": "healthy", "message": "Connected", "job_count": result.count or 0}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


async def _check_groq() -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            )
            if response.status_code == 200:
                return {"status": "healthy", "message": "Connected", "model": settings.GROQ_MODEL}
            return {"status": "degraded", "message": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


async def _check_supabase() -> dict:
    try:
        from app.core.supabase import get_supabase_client
        client = get_supabase_client()
        result = client.table("profiles").select("id").limit(1).execute()
        return {"status": "healthy", "message": "Connected"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


def _check_scheduler() -> dict:
    return {
        "status": "healthy",
        "interval_hours": settings.SYNC_INTERVAL_HOURS,
        "message": f"Sync interval: {settings.SYNC_INTERVAL_HOURS}h",
    }


def _check_cache() -> dict:
    stats = ai_cache.stats
    return {
        "status": "healthy",
        "size": stats["size"],
        "hit_rate": stats["hit_rate"],
        "message": f"{stats['size']} entries cached",
    }


def _check_email() -> dict:
    provider = settings.EMAIL_PROVIDER
    has_key = bool(settings.RESEND_API_KEY or settings.SENDGRID_API_KEY)
    return {
        "status": "healthy" if has_key else "degraded",
        "provider": provider,
        "configured": has_key,
        "message": f"Provider: {provider}" + ("" if has_key else " (no API key)"),
    }


@router.get(
    "/health",
    summary="Health check endpoint",
    description="Returns the health status of all application services.",
    responses={200: {"description": "Health check completed"}},
    tags=["Health"],
)
async def health_check():
    db_check, groq_check, supabase_check = await asyncio.gather(
        _check_database(),
        _check_groq(),
        _check_supabase(),
    )
    scheduler_check = _check_scheduler()
    cache_check = _check_cache()
    email_check = _check_email()

    components = {
        "database": db_check,
        "groq_ai": groq_check,
        "supabase": supabase_check,
        "scheduler": scheduler_check,
        "cache": cache_check,
        "email": email_check,
    }

    all_healthy = all(c.get("status") == "healthy" for c in components.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "components": components,
    }


@router.get(
    "/metrics",
    summary="Application metrics",
    description="Returns request counts, error rates, and AI usage metrics.",
    tags=["Health"],
)
async def metrics():
    uptime = time.time() - _metrics["start_time"]
    cache_stats = ai_cache.stats

    return {
        "uptime_seconds": round(uptime, 2),
        "uptime_human": _format_uptime(uptime),
        "requests": {
            "total": _metrics["requests_total"],
            "by_status": _metrics["requests_by_status"],
            "by_endpoint": dict(sorted(_metrics["requests_by_endpoint"].items(), key=lambda x: -x[1])[:20]),
        },
        "errors": {
            "total": _metrics["errors_total"],
            "rate": f"{(_metrics['errors_total'] / max(_metrics['requests_total'], 1) * 100):.2f}%",
        },
        "ai": {
            "calls_total": _metrics["ai_calls_total"],
            "cache_hits": cache_stats["hits"],
            "cache_misses": cache_stats["misses"],
            "cache_hit_rate": cache_stats["hit_rate"],
            "cache_size": cache_stats["size"],
        },
    }


@router.get(
    "/status",
    summary="Application status",
    description="Returns feature flags, version, and capabilities.",
    tags=["Health"],
)
async def status():
    return {
        "name": "TalentIQ AI",
        "version": settings.VERSION,
        "environment": "production" if settings.JWT_SECRET else "development",
        "features": {
            "semantic_search": True,
            "recommendations": True,
            "saved_jobs": True,
            "recently_viewed": True,
            "email_notifications": bool(settings.RESEND_API_KEY or settings.SENDGRID_API_KEY),
            "ai_chat": bool(settings.GROQ_API_KEY),
            "incremental_etl": True,
            "audit_logging": True,
        },
        "ai_model": settings.GROQ_MODEL,
        "email_provider": settings.EMAIL_PROVIDER,
        "embedding_dimension": settings.EMBEDDING_DIMENSION,
    }


def _format_uptime(seconds: float) -> str:
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"
