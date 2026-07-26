import logging
from typing import List, Dict
from supabase import Client

logger = logging.getLogger("talentiq.repositories.recent_jobs")


class RecentJobsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "recently_viewed_jobs"
        self.max_per_user = 50

    def record_view(self, user_id: str, job_id: str = None, external_job_id: str = None, job_type: str = "external") -> bool:
        try:
            existing = (
                self.client.table(self.table)
                .select("id")
                .eq("user_id", user_id)
            )
            if job_id:
                existing = existing.eq("job_id", job_id)
            elif external_job_id:
                existing = existing.eq("external_job_id", external_job_id)
            existing_result = existing.limit(1).execute()

            if existing_result.data:
                self.client.table(self.table).update({"viewed_at": "now()"}).eq("id", existing_result.data[0]["id"]).execute()
                return True

            record = {"user_id": user_id, "job_type": job_type}
            if job_id:
                record["job_id"] = job_id
            if external_job_id:
                record["external_job_id"] = external_job_id

            self.client.table(self.table).insert(record).execute()

            self._cleanup_old(user_id)
            return True
        except Exception as e:
            logger.error(f"Failed to record view: {e}")
            return False

    def get_recent(self, user_id: str, limit: int = 20) -> List[Dict]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("user_id", user_id)
                .order("viewed_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get recent jobs: {e}")
            return []

    def _cleanup_old(self, user_id: str) -> None:
        try:
            result = (
                self.client.table(self.table)
                .select("id")
                .eq("user_id", user_id)
                .order("viewed_at", desc=True)
                .offset(self.max_per_user)
                .execute()
            )
            if result.data:
                ids_to_delete = [r["id"] for r in result.data]
                self.client.table(self.table).delete().in_("id", ids_to_delete).execute()
        except Exception as e:
            logger.warning(f"Cleanup failed: {e}")
