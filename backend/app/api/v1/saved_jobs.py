from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.core.audit_logger import audit_logger
from app.repositories.saved_jobs_repository import SavedJobsRepository

router = APIRouter()


class SaveJobRequest(BaseModel):
    job_id: Optional[str] = None
    external_job_id: Optional[str] = None
    job_type: str = "external"
    notes: Optional[str] = None


def _get_repo() -> SavedJobsRepository:
    client = get_supabase_client()
    return SavedJobsRepository(client)


@router.get(
    "/saved-jobs",
    summary="List saved jobs",
    description="Returns all jobs saved by the current user.",
    tags=["Saved Jobs"],
)
async def list_saved_jobs(current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    saved = repo.list_by_user(current_user["user_id"])
    return {"success": True, "data": saved, "count": len(saved)}


@router.post(
    "/saved-jobs",
    summary="Save a job",
    description="Save a job for later reference.",
    tags=["Saved Jobs"],
)
async def save_job(
    req: SaveJobRequest,
    current_user: dict = Depends(get_current_user),
):
    if not req.job_id and not req.external_job_id:
        raise HTTPException(status_code=400, detail="Either job_id or external_job_id is required")

    repo = _get_repo()
    saved = repo.save(
        user_id=current_user["user_id"],
        job_id=req.job_id,
        external_job_id=req.external_job_id,
        job_type=req.job_type,
        notes=req.notes,
    )

    if saved:
        audit_logger.log_job("save_job", current_user["user_id"], req.job_id or req.external_job_id)

    return {"success": bool(saved), "data": saved}


@router.delete(
    "/saved-jobs/{saved_job_id}",
    summary="Remove saved job",
    description="Remove a job from saved list.",
    tags=["Saved Jobs"],
)
async def remove_saved_job(
    saved_job_id: str,
    current_user: dict = Depends(get_current_user),
):
    repo = _get_repo()
    removed = repo.remove(current_user["user_id"], saved_job_id)
    return {"success": removed}
