from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.services.resume_improvement_service import ResumeImprovementService

router = APIRouter()


class ResumeImproveRequest(BaseModel):
    original_text: str
    improvement_type: str = "full"
    target_job_description: Optional[str] = None
    resume_id: Optional[str] = None


class MarkApplied(BaseModel):
    improvement_id: str


def _get_service():
    from app.services.ai_service import _get_client
    return ResumeImprovementService(get_supabase_client(), _get_client())


@router.post("/resume/improve")
async def improve_resume(data: ResumeImproveRequest, current_user: dict = Depends(get_current_user)):
    if len(data.original_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text must be at least 50 characters")

    service = _get_service()
    result = service.improve_resume(
        user_id=current_user["id"],
        original_text=data.original_text,
        improvement_type=data.improvement_type,
        target_job_description=data.target_job_description,
        resume_id=data.resume_id,
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to improve resume")
    return {"success": True, "data": result}


@router.get("/resume/improvements")
async def get_improvement_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    service = _get_service()
    improvements = service.get_history(current_user["id"], limit=limit)
    return {"success": True, "data": improvements, "count": len(improvements)}


@router.post("/resume/improvements/apply")
async def mark_improvement_applied(data: MarkApplied, current_user: dict = Depends(get_current_user)):
    service = _get_service()
    success = service.mark_applied(data.improvement_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to mark as applied")
    return {"success": True}


@router.get("/resume/score")
async def score_resume(
    text: str = Query(..., min_length=50),
    current_user: dict = Depends(get_current_user),
):
    from app.services.ai_service import _get_client
    groq = _get_client()
    if not groq:
        return {"success": True, "data": {"score": 50, "feedback": "AI service unavailable"}}

    try:
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": (
                    "Score this resume from 0-100 for ATS compatibility, clarity, impact, and keyword relevance. "
                    "Return JSON: {\"score\": number, \"breakdown\": {\"ats\": number, \"clarity\": number, \"impact\": number, \"keywords\": number}, \"feedback\": [string]}"
                    f"\n\nResume:\n{text}"
                ),
            }],
            temperature=0.3,
            max_tokens=512,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
        import json
        return {"success": True, "data": json.loads(raw)}
    except Exception as e:
        return {"success": True, "data": {"score": 50, "feedback": [f"Scoring error: {str(e)}"]}}
