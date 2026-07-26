from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ExternalJobResponse(BaseModel):
    id: str
    external_id: str
    title: str
    company_name: str
    company_logo: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = False
    employment_type: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    job_url: Optional[str] = None
    source: str = "arbeitnow"
    published_at: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_skills: List[str] = []
    ai_seniority: Optional[str] = None
    ai_salary_estimate: Optional[str] = None
    ai_department: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class JobSearchRequest(BaseModel):
    keyword: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    tags: Optional[List[str]] = None
    employment_type: Optional[str] = None
    sort_by: str = "published_at"
    sort_order: str = "desc"
    page: int = 1
    per_page: int = 20


class SyncTriggerResponse(BaseModel):
    status: str
    imported: int
    updated: int
    duplicates: int
    failed: int
    execution_time_seconds: float
