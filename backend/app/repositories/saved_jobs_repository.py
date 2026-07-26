import logging
from typing import List, Optional, Dict
from supabase import Client

logger = logging.getLogger("talentiq.repositories.saved_jobs")


class SavedJobsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "saved_jobs"

    def list_by_user(self, user_id: str) -> List[Dict]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to list saved jobs: {e}")
            return []

    def save(self, user_id: str, job_id: str = None, external_job_id: str = None, job_type: str = "external", notes: str = None) -> Optional[Dict]:
        try:
            existing = (
                self.client.table(self.table)
                .select("*")
                .eq("user_id", user_id)
            )
            if job_id:
                existing = existing.eq("job_id", job_id)
            elif external_job_id:
                existing = existing.eq("external_job_id", external_job_id)
            existing_result = existing.limit(1).execute()

            if existing_result.data:
                return existing_result.data[0]

            record = {
                "user_id": user_id,
                "job_type": job_type,
            }
            if job_id:
                record["job_id"] = job_id
            if external_job_id:
                record["external_job_id"] = external_job_id
            if notes:
                record["notes"] = notes

            result = self.client.table(self.table).insert(record).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to save job: {e}")
            return None

    def remove(self, user_id: str, saved_job_id: str) -> bool:
        try:
            result = (
                self.client.table(self.table)
                .delete()
                .eq("id", saved_job_id)
                .eq("user_id", user_id)
                .execute()
            )
            return True
        except Exception as e:
            logger.error(f"Failed to remove saved job: {e}")
            return False

    def is_saved(self, user_id: str, job_id: str = None, external_job_id: str = None) -> bool:
        try:
            query = self.client.table(self.table).select("id").eq("user_id", user_id)
            if job_id:
                query = query.eq("job_id", job_id)
            elif external_job_id:
                query = query.eq("external_job_id", external_job_id)
            result = query.limit(1).execute()
            return bool(result.data)
        except Exception:
            return False
