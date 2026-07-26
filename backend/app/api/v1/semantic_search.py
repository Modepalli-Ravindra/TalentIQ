from fastapi import APIRouter, Query, Depends, Request
from typing import Optional, List
from app.core.deps import get_current_user, get_optional_user
from app.core.supabase import get_supabase_client
from app.core.audit_logger import audit_logger
from app.repositories.semantic_search_repository import SemanticSearchRepository

router = APIRouter()


def _get_repo() -> SemanticSearchRepository:
    client = get_supabase_client()
    return SemanticSearchRepository(client)


@router.get(
    "/search/semantic",
    summary="Semantic search for jobs",
    description="Natural language search using vector similarity. Understands intent, synonyms, and context.",
    responses={200: {"description": "Search results returned"}},
    tags=["Search"],
)
async def semantic_search(
    q: str = Query(..., min_length=1, max_length=500, description="Natural language search query"),
    limit: int = Query(default=20, ge=1, le=100),
    location: Optional[str] = Query(default=None, max_length=200),
    is_remote: Optional[bool] = Query(default=None),
    tags: Optional[List[str]] = Query(default=None),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    repo = _get_repo()
    results = repo.semantic_search_jobs(
        query=q,
        limit=limit,
        location=location,
        is_remote=is_remote,
        tags=tags,
    )
    return {
        "success": True,
        "data": results,
        "count": len(results),
        "query": q,
    }


@router.post(
    "/jobs/embed",
    summary="Generate and store job embedding",
    description="Generates a vector embedding for a job and stores it for semantic search.",
    responses={200: {"description": "Embedding generated"}},
    tags=["Search"],
)
async def embed_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    client = get_supabase_client()
    repo = SemanticSearchRepository(client)

    job_result = client.table("external_jobs").select("*").eq("id", job_id).limit(1).execute()
    if not job_result.data:
        return {"success": False, "message": "Job not found"}

    job = job_result.data[0]
    success = repo.upsert_job_embedding(
        job_id=job_id,
        title=job.get("title", ""),
        description=job.get("description", ""),
        tags=job.get("tags", []),
    )

    audit_logger.log_ai("embed_job", current_user["user_id"], details={"job_id": job_id})

    return {"success": success, "message": "Embedding generated" if success else "Failed to generate embedding"}


@router.post(
    "/profile/embed",
    summary="Generate and store profile embedding",
    description="Generates a vector embedding for a user profile for semantic matching.",
    responses={200: {"description": "Embedding generated"}},
    tags=["Search"],
)
async def embed_profile(
    current_user: dict = Depends(get_current_user),
):
    client = get_supabase_client()
    repo = SemanticSearchRepository(client)

    profile_result = client.table("profiles").select("*").eq("id", current_user["user_id"]).limit(1).execute()
    if not profile_result.data:
        return {"success": False, "message": "Profile not found"}

    profile = profile_result.data[0]
    success = repo.upsert_profile_embedding(
        user_id=current_user["user_id"],
        name=profile.get("name", ""),
        skills=profile.get("skills", []),
        summary=profile.get("bio", ""),
    )

    return {"success": success, "message": "Embedding generated" if success else "Failed to generate embedding"}


@router.post(
    "/embeddings/batch",
    summary="Batch generate embeddings",
    description="Generate embeddings for all jobs/profiles without one. Admin only.",
    responses={200: {"description": "Batch generation completed"}},
    tags=["Search"],
)
async def batch_embed(
    table: str = Query(default="external_jobs", pattern="^(external_jobs|profiles)$"),
    batch_size: int = Query(default=50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    client = get_supabase_client()
    repo = SemanticSearchRepository(client)
    updated = repo.batch_generate_embeddings(table=table, batch_size=batch_size)

    audit_logger.log_admin(
        "batch_embed", current_user["user_id"], resource_type=table,
        details={"updated": updated, "batch_size": batch_size},
    )

    return {"success": True, "updated": updated, "table": table}
