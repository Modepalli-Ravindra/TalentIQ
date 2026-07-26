import logging
import time
import hashlib
from datetime import datetime
from app.etl.arbeitnow_client import fetch_all_jobs
from app.etl.deduplicator import deduplicate_jobs
from app.etl.repository import JobRepository
from app.etl.ai_placeholder import (
    generate_job_summary,
    extract_skills,
    detect_seniority,
    estimate_salary,
    classify_department,
)
from app.etl.models import SyncReport, ExternalJobRecord

logger = logging.getLogger("talentiq.etl.sync_service")


def _compute_hash(record: dict) -> str:
    """Compute content hash for change detection."""
    key_fields = [
        record.get("title", ""),
        record.get("company_name", ""),
        record.get("description", ""),
        record.get("location", ""),
        str(record.get("tags", "")),
    ]
    content = "|".join(key_fields)
    return hashlib.sha256(content.encode()).hexdigest()


def enrich_with_ai(record: ExternalJobRecord) -> dict:
    enriched = record.model_dump()
    enriched["ai_summary"] = generate_job_summary(record.description)
    enriched["ai_skills"] = extract_skills(record.description, record.tags)
    enriched["ai_seniority"] = detect_seniority(record.title, record.description)
    enriched["ai_salary_estimate"] = estimate_salary(record.description, record.location)
    enriched["ai_department"] = classify_department(record.title, record.description)
    return enriched


class JobSyncService:
    def __init__(self, repo: JobRepository):
        self.repo = repo

    async def sync(self, max_pages: int = 10) -> SyncReport:
        start_time = time.time()
        report = SyncReport(source="arbeitnow")

        logger.info("=== Sync Started ===")

        try:
            raw_jobs = await fetch_all_jobs(max_pages=max_pages)
            report.total_fetched = len(raw_jobs)
            logger.info(f"Fetched {len(raw_jobs)} jobs from Arbeitnow")

            existing_ids = self.repo.get_all_external_ids(source="arbeitnow")
            existing_hashes = self.repo.get_content_hashes(source="arbeitnow")
            report.duplicates = 0

            to_insert, to_update, dup_count = deduplicate_jobs(raw_jobs, existing_ids)
            report.duplicates = dup_count

            if to_insert:
                enriched_insert = [enrich_with_ai(job) for job in to_insert]
                for record in enriched_insert:
                    record["content_hash"] = _compute_hash(record)
                    record["sync_status"] = "active"
                    record["last_synced_at"] = datetime.utcnow().isoformat()
                inserted = self.repo.bulk_insert(enriched_insert)
                report.imported = inserted
                logger.info(f"Imported {inserted} new jobs")

            if to_update:
                enriched_update = []
                for job in to_update:
                    enriched = enrich_with_ai(job)
                    existing_id = existing_ids.get(job.external_id)
                    if existing_id:
                        enriched["id"] = existing_id
                        new_hash = _compute_hash(enriched)
                        old_hash = existing_hashes.get(job.external_id, "")
                        if new_hash == old_hash:
                            continue
                        enriched["content_hash"] = new_hash
                        enriched["last_synced_at"] = datetime.utcnow().isoformat()
                    enriched_update.append(enriched)
                updated = self.repo.bulk_update(enriched_update)
                report.updated = updated
                logger.info(f"Updated {updated} existing jobs")

            active_ids = {job.external_id for job in to_insert + to_update}
            all_existing = set(existing_ids.keys())
            expired_ids = all_existing - active_ids - {d for d in set()}
            if expired_ids:
                expired_count = self.repo.mark_expired(list(expired_ids), source="arbeitnow")
                report.failed += expired_count
                logger.info(f"Marked {expired_count} jobs as expired")

            report.status = "success"

        except Exception as e:
            logger.error(f"Sync failed: {e}")
            report.status = "failed"
            report.failed = report.total_fetched - report.imported - report.updated - report.duplicates
            report.errors.append(str(e))

        report.execution_time_seconds = round(time.time() - start_time, 2)
        logger.info(
            f"=== Sync Complete: imported={report.imported}, "
            f"updated={report.updated}, dupes={report.duplicates}, "
            f"failed={report.failed}, time={report.execution_time_seconds}s ==="
        )
        return report
