import logging
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.supabase import safe_uuid

logger = logging.getLogger("talentiq.services.comparison")


class ComparisonService:
    def __init__(self, client, groq_client=None):
        self.client = client
        self.groq = groq_client
        self.table = "candidate_comparisons"
        self.profiles_table = "profiles"

    def compare_candidates(
        self,
        recruiter_id: str,
        candidate_ids: List[str],
        job_id: Optional[str] = None,
        criteria: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        try:
            candidates = []
            for cid in candidate_ids:
                result = self.client.table(self.profiles_table).select("*").eq("id", cid).single().execute()
                if result.data:
                    candidates.append(result.data)

            if len(candidates) < 2:
                return None

            db_job_id = safe_uuid(job_id)
            comparison = self._build_comparison(candidates, db_job_id, criteria)

            record = {
                "recruiter_id": recruiter_id,
                "job_id": db_job_id,
                "candidate_ids": candidate_ids,
                "comparison_data": json.dumps(comparison),
                "notes": None,
            }
            db_result = self.client.table(self.table).insert(record).execute()
            return db_result.data[0] if db_result.data else None
        except Exception as e:
            logger.error(f"Error comparing candidates: {e}")
            return None

    def get_comparisons(self, recruiter_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("recruiter_id", recruiter_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting comparisons: {e}")
            return []

    def update_notes(self, comparison_id: str, recruiter_id: str, notes: str) -> bool:
        try:
            self.client.table(self.table).update({"notes": notes}).eq("id", comparison_id).eq("recruiter_id", recruiter_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating notes: {e}")
            return False

    def delete_comparison(self, comparison_id: str, recruiter_id: str) -> bool:
        try:
            self.client.table(self.table).delete().eq("id", comparison_id).eq("recruiter_id", recruiter_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting comparison: {e}")
            return False

    def _build_comparison(self, candidates: List[Dict[str, Any]], job_id: Optional[str], criteria: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        skills_map = {}
        for c in candidates:
            skills = c.get("skills") or []
            if isinstance(skills, str):
                try:
                    skills = json.loads(skills)
                except (json.JSONDecodeError, TypeError):
                    skills = [s.strip() for s in skills.split(",") if s.strip()]
            skills_map[c["id"]] = skills

        all_skills = set()
        for skills in skills_map.values():
            all_skills.update(skills)

        profiles = []
        for c in candidates:
            cid = c["id"]
            skills = skills_map.get(cid, [])
            skill_overlap = len(set(skills) & all_skills) / max(len(all_skills), 1)
            profiles.append({
                "id": cid,
                "name": c.get("full_name", "Unknown"),
                "headline": c.get("headline", ""),
                "location": c.get("location", ""),
                "skills": skills,
                "skill_coverage": round(skill_overlap * 100, 1),
                "experience_years": c.get("experience_years", 0),
                "education": c.get("education", ""),
                "profile_url": c.get("profile_url", ""),
            })

        profiles.sort(key=lambda x: x["skill_coverage"], reverse=True)

        return {
            "candidates": profiles,
            "total_skills_pool": len(all_skills),
            "job_id": job_id,
            "criteria": criteria or {},
            "generated_at": datetime.utcnow().isoformat(),
        }
