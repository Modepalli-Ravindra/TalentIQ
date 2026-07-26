from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.repositories.recent_jobs_repository import RecentJobsRepository

router = APIRouter()


class RecordViewRequest(BaseModel):
    job_id: Optional[str] = None
    external_job_id: Optional[str] = None
    job_type: str = "external"


def _get_repo() -> RecentJobsRepository:
    client = get_supabase_client()
    return RecentJobsRepository(client)


@router.get(
    "/recent-jobs",
    summary="Get recently viewed jobs",
    description="Returns the user's recently viewed jobs.",
    tags=["Recent Jobs"],
)
async def get_recent_jobs(
    limit: int = Query(default=20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    repo = _get_repo()
    recent = repo.get_recent(current_user["user_id"], limit=limit)
    return {"success": True, "data": recent, "count": len(recent)}


@router.post(
    "/recent-jobs",
    summary="Record job view",
    description="Record that the user viewed a job for recommendation tracking.",
    tags=["Recent Jobs"],
)
async def record_job_view(
    req: RecordViewRequest,
    current_user: dict = Depends(get_current_user),
):
    if not req.job_id and not req.external_job_id:
        return {"success": False, "message": "job_id or external_job_id required"}

    repo = _get_repo()
    recorded = repo.record_view(
        user_id=current_user["user_id"],
        job_id=req.job_id,
        external_job_id=req.external_job_id,
        job_type=req.job_type,
    )
    return {"success": recorded}
