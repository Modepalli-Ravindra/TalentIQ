from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.repositories.interview_repository import InterviewRepository

router = APIRouter()


class InterviewCreate(BaseModel):
    job_id: str
    candidate_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: str
    duration_minutes: int = 30
    interview_type: str = "video"
    meeting_url: Optional[str] = None
    notes: Optional[str] = None


class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    duration_minutes: Optional[int] = None
    interview_type: Optional[str] = None
    status: Optional[str] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None


class InterviewFeedback(BaseModel):
    feedback: str
    rating: int


def _get_repo():
    return InterviewRepository(get_supabase_client())


@router.get("/interviews")
async def list_interviews(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    repo = _get_repo()
    role = current_user.get("role", "candidate")
    interviews = repo.list_by_user(current_user["id"], role=role, status=status)
    return {"success": True, "data": interviews, "count": len(interviews)}


@router.get("/interviews/upcoming")
async def get_upcoming_interviews(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    repo = _get_repo()
    role = current_user.get("role", "candidate")
    interviews = repo.get_upcoming(current_user["id"], role=role, limit=limit)
    return {"success": True, "data": interviews, "count": len(interviews)}


@router.get("/interviews/{interview_id}")
async def get_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    interview = repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    uid = current_user["id"]
    if interview.get("candidate_id") != uid and interview.get("recruiter_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"success": True, "data": interview}


@router.post("/interviews")
async def create_interview(data: InterviewCreate, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()

    if repo.check_conflict(data.candidate_id, data.scheduled_at, data.duration_minutes):
        raise HTTPException(status_code=409, detail="Candidate has a scheduling conflict")
    if repo.check_conflict(current_user["id"], data.scheduled_at, data.duration_minutes):
        raise HTTPException(status_code=409, detail="You have a scheduling conflict")

    interview_data = {
        "job_id": data.job_id,
        "candidate_id": data.candidate_id,
        "recruiter_id": current_user["id"],
        "title": data.title,
        "description": data.description,
        "scheduled_at": data.scheduled_at,
        "duration_minutes": data.duration_minutes,
        "interview_type": data.interview_type,
        "meeting_url": data.meeting_url,
        "notes": data.notes,
        "status": "scheduled",
    }

    interview = repo.create(interview_data)
    if not interview:
        raise HTTPException(status_code=500, detail="Failed to create interview")
    return {"success": True, "data": interview}


@router.put("/interviews/{interview_id}")
async def update_interview(
    interview_id: str, data: InterviewUpdate, current_user: dict = Depends(get_current_user)
):
    repo = _get_repo()
    interview = repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.get("recruiter_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the recruiter can update")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if "scheduled_at" in update_data and "duration_minutes" not in update_data:
        update_data["duration_minutes"] = interview.get("duration_minutes", 30)
    if "duration_minutes" in update_data and "scheduled_at" not in update_data:
        update_data["scheduled_at"] = interview["scheduled_at"]

    if "scheduled_at" in update_data and "duration_minutes" in update_data:
        candidate_id = interview.get("candidate_id")
        if repo.check_conflict(candidate_id, update_data["scheduled_at"], update_data["duration_minutes"], exclude_id=interview_id):
            raise HTTPException(status_code=409, detail="Scheduling conflict")

    if update_data.get("status") == "rescheduled":
        update_data["status"] = "scheduled"

    updated = repo.update(interview_id, update_data)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update")
    return {"success": True, "data": updated}


@router.post("/interviews/{interview_id}/feedback")
async def submit_feedback(
    interview_id: str, data: InterviewFeedback, current_user: dict = Depends(get_current_user)
):
    repo = _get_repo()
    interview = repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.get("recruiter_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the recruiter can submit feedback")

    updated = repo.update(interview_id, {
        "feedback": data.feedback,
        "rating": data.rating,
        "status": "completed",
    })
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to submit feedback")
    return {"success": True, "data": updated}


@router.delete("/interviews/{interview_id}")
async def cancel_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    interview = repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    uid = current_user["id"]
    if interview.get("candidate_id") != uid and interview.get("recruiter_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized")

    updated = repo.update(interview_id, {"status": "cancelled"})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to cancel")
    return {"success": True, "data": updated}
