import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger("talentiq.repositories.interviews")


class InterviewRepository:
    def __init__(self, client):
        self.client = client
        self.table = "interview_schedules"

    def list_by_user(self, user_id: str, role: str = "candidate", status: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            col = "candidate_id" if role == "candidate" else "recruiter_id"
            query = self.client.table(self.table).select("*").eq(col, user_id)
            if status:
                query = query.eq("status", status)
            result = query.order("scheduled_at", desc=False).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing interviews: {e}")
            return []

    def get_by_id(self, interview_id: str) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table(self.table).select("*").eq("id", interview_id).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Error getting interview {interview_id}: {e}")
            return None

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table(self.table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating interview: {e}")
            return None

    def update(self, interview_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            data["updated_at"] = datetime.utcnow().isoformat()
            result = self.client.table(self.table).update(data).eq("id", interview_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating interview {interview_id}: {e}")
            return None

    def delete(self, interview_id: str) -> bool:
        try:
            self.client.table(self.table).delete().eq("id", interview_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting interview {interview_id}: {e}")
            return False

    def get_upcoming(self, user_id: str, role: str = "candidate", limit: int = 10) -> List[Dict[str, Any]]:
        try:
            col = "candidate_id" if role == "candidate" else "recruiter_id"
            now = datetime.utcnow().isoformat()
            result = (
                self.client.table(self.table)
                .select("*")
                .eq(col, user_id)
                .gte("scheduled_at", now)
                .in_("status", ["scheduled", "confirmed"])
                .order("scheduled_at", desc=False)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting upcoming interviews: {e}")
            return []

    def get_by_job(self, job_id: str) -> List[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("job_id", job_id)
                .order("scheduled_at", desc=False)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting interviews for job {job_id}: {e}")
            return []

    def check_conflict(self, user_id: str, scheduled_at: str, duration_minutes: int, exclude_id: Optional[str] = None) -> bool:
        try:
            from datetime import timedelta
            start = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
            end = start + timedelta(minutes=duration_minutes)

            for col in ["candidate_id", "recruiter_id"]:
                query = (
                    self.client.table(self.table)
                    .select("id")
                    .eq(col, user_id)
                    .in_("status", ["scheduled", "confirmed"])
                )
                result = query.execute()
                for interview in (result.data or []):
                    if exclude_id and interview["id"] == exclude_id:
                        continue
                    existing = self.get_by_id(interview["id"])
                    if existing:
                        ex_start = datetime.fromisoformat(existing["scheduled_at"].replace("Z", "+00:00"))
                        ex_end = ex_start + timedelta(minutes=existing["duration_minutes"])
                        if start < ex_end and end > ex_start:
                            return True
            return False
        except Exception as e:
            logger.error(f"Error checking conflict: {e}")
            return False
