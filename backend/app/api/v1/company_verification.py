from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client

router = APIRouter()


class VerificationRequest(BaseModel):
    company_name: str
    company_domain: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    verification_documents: Optional[dict] = None


class VerificationReview(BaseModel):
    status: str
    review_notes: Optional[str] = None


def _get_client():
    return get_supabase_client()


@router.get("/company/verification")
async def get_verification_status(current_user: dict = Depends(get_current_user)):
    client = _get_client()
    result = (
        client.table("company_verification_requests")
        .select("*")
        .eq("recruiter_id", current_user["user_id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    data = result.data[0] if result.data else None
    return {"success": True, "data": data}


@router.post("/company/verification")
async def request_verification(data: VerificationRequest, current_user: dict = Depends(get_current_user)):
    client = _get_client()

    existing = (
        client.table("company_verification_requests")
        .select("id, status")
        .eq("recruiter_id", current_user["user_id"])
        .in_("status", ["pending", "under_review"])
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="You already have a pending verification request")

    record = {
        "company_name": data.company_name,
        "company_domain": data.company_domain,
        "recruiter_id": current_user["user_id"],
        "business_registration_number": data.business_registration_number,
        "tax_id": data.tax_id,
        "verification_documents": data.verification_documents,
        "status": "pending",
    }

    result = client.table("company_verification_requests").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit request")
    return {"success": True, "data": result.data[0]}


@router.get("/company/verification/history")
async def get_verification_history(current_user: dict = Depends(get_current_user)):
    client = _get_client()
    result = (
        client.table("company_verification_requests")
        .select("*")
        .eq("recruiter_id", current_user["user_id"])
        .order("created_at", desc=True)
        .execute()
    )
    data = result.data or []
    return {"success": True, "data": data, "count": len(data)}


@router.get("/admin/verifications")
async def admin_list_verifications(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    client = _get_client()
    query = client.table("company_verification_requests").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).limit(limit).execute()
    data = result.data or []
    return {"success": True, "data": data, "count": len(data)}


@router.put("/admin/verifications/{verification_id}")
async def admin_review_verification(
    verification_id: str, data: VerificationReview, current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if data.status not in ("approved", "rejected", "under_review"):
        raise HTTPException(status_code=400, detail="Invalid status")

    client = _get_client()
    update = {"status": data.status, "reviewer_id": current_user["user_id"], "review_notes": data.review_notes}
    if data.status == "approved":
        from datetime import datetime, timedelta
        update["verified_at"] = datetime.utcnow().isoformat()
        update["expires_at"] = (datetime.utcnow() + timedelta(days=365)).isoformat()

    result = client.table("company_verification_requests").update(update).eq("id", verification_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Verification not found")
    return {"success": True, "data": result.data[0]}
