from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List
from app.core.supabase import get_supabase_client
from app.core.deps import get_current_user, get_optional_user
from app.etl.repository import JobRepository
from app.etl.sync_service import JobSyncService
from app.etl.scheduler import run_scheduled_sync
from app.schemas.jobs import ExternalJobResponse, JobSearchRequest, SyncTriggerResponse

router = APIRouter()


def _get_repo() -> JobRepository:
    client = get_supabase_client()
    return JobRepository(client)


@router.post(
    "/etl/jobs/sync",
    response_model=SyncTriggerResponse,
    summary="Trigger ETL job sync",
    description="Manually trigger a sync from the Arbeitnow API. Requires authentication.",
    responses={
        200: {"description": "Sync completed"},
        401: {"description": "Authentication required"},
        403: {"description": "Insufficient permissions"},
    },
    tags=["ETL"],
)
async def trigger_sync(
    max_pages: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    repo = _get_repo()
    service = JobSyncService(repo)
    report = await service.sync(max_pages=max_pages)
    return SyncTriggerResponse(
        status=report.status,
        imported=report.imported,
        updated=report.updated,
        duplicates=report.duplicates,
        failed=report.failed,
        execution_time_seconds=report.execution_time_seconds,
    )


@router.get(
    "/jobs",
    summary="List external jobs",
    description="Returns a paginated list of external jobs from the database.",
    responses={
        200: {"description": "Jobs listed successfully"},
        422: {"description": "Validation error"},
    },
    tags=["Jobs"],
)
async def list_jobs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="published_at", pattern="^(published_at|created_at|company_name|title)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    repo = _get_repo()
    result = repo.search_jobs(page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order)
    return result


@router.get(
    "/jobs/search",
    summary="Search external jobs",
    description="Search external jobs with filters for keyword, location, remote status, tags, and employment type.",
    responses={
        200: {"description": "Search results returned"},
        422: {"description": "Validation error"},
    },
    tags=["Jobs"],
)
async def search_jobs(
    keyword: Optional[str] = Query(default=None, max_length=200),
    location: Optional[str] = Query(default=None, max_length=200),
    is_remote: Optional[bool] = Query(default=None),
    tags: Optional[List[str]] = Query(default=None),
    employment_type: Optional[str] = Query(default=None, max_length=50),
    sort_by: str = Query(default="published_at"),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    repo = _get_repo()
    result = repo.search_jobs(
        keyword=keyword,
        location=location,
        is_remote=is_remote,
        tags=tags,
        employment_type=employment_type,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
    )
    return result


@router.get(
    "/jobs/recommended",
    summary="Get recommended jobs",
    description="Returns job recommendations based on provided skills.",
    responses={
        200: {"description": "Recommended jobs returned"},
    },
    tags=["Jobs"],
)
async def recommended_jobs(
    skills: Optional[List[str]] = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    repo = _get_repo()
    result = repo.search_jobs(
        tags=skills,
        per_page=limit,
        sort_by="published_at",
        sort_order="desc",
    )
    return result


@router.get(
    "/jobs/{job_id}",
    summary="Get job by ID",
    description="Returns a single external job by its ID.",
    responses={
        200: {"description": "Job found"},
        404: {"description": "Job not found"},
    },
    tags=["Jobs"],
)
async def get_job(
    job_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    repo = _get_repo()
    job = repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
