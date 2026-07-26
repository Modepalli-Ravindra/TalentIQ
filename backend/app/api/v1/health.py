from fastapi import APIRouter, Depends
from datetime import datetime
import httpx
import asyncio
import logging

from app.core.config import settings
from app.core.ai_cache import ai_cache

logger = logging.getLogger("talentiq.health")

router = APIRouter()


async def _check_database() -> dict:
    try:
        from app.core.supabase import get_supabase_client
        client = get_supabase_client
        result = client.table("external_jobs").select("id", count="exact").limit(1).execute()
        return {"status": "healthy", "message": "Connected"}
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
        client = get_supabase_client
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


@router.get(
    "/health",
    summary="Health check endpoint",
    description="Returns the health status of all application services including database, AI, Supabase, scheduler, and cache.",
    responses={
        200: {"description": "Health check completed"},
    },
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

    components = {
        "database": db_check,
        "groq_ai": groq_check,
        "supabase": supabase_check,
        "scheduler": scheduler_check,
        "cache": cache_check,
    }

    all_healthy = all(
        c.get("status") == "healthy" for c in components.values()
    )

    return {
        "status": "healthy" if all_healthy else "degraded",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "components": components,
    }
