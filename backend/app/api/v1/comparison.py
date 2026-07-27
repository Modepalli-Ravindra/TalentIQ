from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.services.comparison_service import ComparisonService

router = APIRouter()


class CompareRequest(BaseModel):
    candidate_ids: List[str]
    job_id: Optional[str] = None
    criteria: Optional[dict] = None


class UpdateNotes(BaseModel):
    notes: str


def _get_service():
    from app.services.ai_service import _get_client
    return ComparisonService(get_supabase_client(), _get_client())


@router.post("/compare")
async def compare_candidates(data: CompareRequest, current_user: dict = Depends(get_current_user)):
    if len(data.candidate_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 candidates required")
    if len(data.candidate_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 candidates per comparison")

    service = _get_service()
    comparison = service.compare_candidates(
        recruiter_id=current_user["user_id"],
        candidate_ids=data.candidate_ids,
        job_id=data.job_id,
        criteria=data.criteria,
    )
    if not comparison:
        raise HTTPException(status_code=404, detail="Could not find all candidates")
    return {"success": True, "data": comparison}


@router.get("/compare")
async def get_comparisons(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    service = _get_service()
    comparisons = service.get_comparisons(current_user["user_id"], limit=limit)
    return {"success": True, "data": comparisons, "count": len(comparisons)}


@router.put("/compare/{comparison_id}/notes")
async def update_comparison_notes(
    comparison_id: str, data: UpdateNotes, current_user: dict = Depends(get_current_user)
):
    service = _get_service()
    success = service.update_notes(comparison_id, current_user["user_id"], data.notes)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update notes")
    return {"success": True}


@router.delete("/compare/{comparison_id}")
async def delete_comparison(comparison_id: str, current_user: dict = Depends(get_current_user)):
    service = _get_service()
    success = service.delete_comparison(comparison_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete")
    return {"success": True}
