from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ExternalJobRecord(BaseModel):
    external_id: str
    title: str
    company_name: str
    company_logo: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = False
    employment_type: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    job_url: Optional[str] = None
    source: str = "arbeitnow"
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ETLResult(BaseModel):
    imported: int = 0
    updated: int = 0
    duplicates: int = 0
    failed: int = 0
    errors: List[str] = Field(default_factory=list)
    execution_time_seconds: float = 0.0


class SyncReport(BaseModel):
    status: str = "success"
    source: str = "arbeitnow"
    imported: int = 0
    updated: int = 0
    duplicates: int = 0
    failed: int = 0
    total_fetched: int = 0
    execution_time_seconds: float = 0.0
    errors: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
