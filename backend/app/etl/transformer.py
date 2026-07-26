import logging
import re
from datetime import datetime
from typing import Optional, List
from app.etl.models import ExternalJobRecord

logger = logging.getLogger("talentiq.etl.transformer")


def clean_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def normalize_employment_type(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    lower = raw.lower().strip()
    mapping = {
        "full_time": "Full-time",
        "full-time": "Full-time",
        "fulltime": "Full-time",
        "part_time": "Part-time",
        "part-time": "Part-time",
        "parttime": "Part-time",
        "contract": "Contract",
        "freelance": "Contract",
        "internship": "Internship",
        "intern": "Internship",
        "temporary": "Temporary",
        "temp": "Temporary",
    }
    return mapping.get(lower, raw.title())


def detect_remote(title: str, description: str, tags: List[str], location: Optional[str]) -> bool:
    combined = f"{title} {description} {' '.join(tags)} {location or ''}".lower()
    remote_signals = ["remote", "work from home", "wfh", "distributed", "anywhere", "worldwide"]
    return any(signal in combined for signal in remote_signals)


def parse_published_date(raw: Optional[str]) -> Optional[datetime]:
    if not raw:
        return None
    try:
        if isinstance(raw, (int, float)):
            return datetime.utcfromtimestamp(raw)
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ"):
            try:
                return datetime.strptime(raw, fmt)
            except ValueError:
                continue
        return None
    except Exception:
        return None


def transform_arbeitnow_job(raw_job: dict, index: int) -> Optional[ExternalJobRecord]:
    try:
        title = (raw_job.get("title") or "").strip()
        company_name = (raw_job.get("company_name") or raw_job.get("company") or "").strip()
        job_url = (raw_job.get("url") or raw_job.get("job_url") or "").strip()
        description = clean_html(raw_job.get("description") or raw_job.get("content") or "")
        company_logo = raw_job.get("company_logo") or raw_job.get("logo")
        location = raw_job.get("location") or raw_job.get("candidate_required_location") or None

        if not title:
            logger.warning(f"Job #{index}: Missing title — skipping")
            return None
        if not company_name:
            logger.warning(f"Job #{index}: Missing company — skipping")
            return None
        if not job_url:
            logger.warning(f"Job #{index}: Missing URL — skipping")
            return None

        tags = raw_job.get("tags") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        employment_type = normalize_employment_type(raw_job.get("employment_type") or raw_job.get("type"))
        is_remote = detect_remote(title, description, tags, location)
        published_at = parse_published_date(raw_job.get("created_at") or raw_job.get("publication_date"))

        external_id = str(raw_job.get("id") or raw_job.get("slug") or f"arbeitnow-{index}")

        return ExternalJobRecord(
            external_id=external_id,
            title=title,
            company_name=company_name,
            company_logo=company_logo,
            location=location,
            is_remote=is_remote,
            employment_type=employment_type,
            description=description[:5000] if description else None,
            tags=tags[:20],
            job_url=job_url,
            source="arbeitnow",
            published_at=published_at,
        )
    except Exception as e:
        logger.error(f"Job #{index}: Transform error — {e}")
        return None
