import logging
from typing import List, Dict, Any, Optional
from supabase import Client

from app.services.embedding_service import generate_profile_embedding
from app.services.ai_service import analyze_fit

logger = logging.getLogger("talentiq.recommendations")


class RecommendationEngine:
    def __init__(self, client: Client):
        self.client = client

    def get_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        include_reasons: bool = False,
    ) -> List[Dict[str, Any]]:
        try:
            profile = self._get_user_profile(user_id)
            if not profile:
                return self._get_trending_jobs(limit)

            user_skills = profile.get("skills", [])
            resume_text = profile.get("bio", "") or profile.get("summary", "")

            candidate_jobs = self._find_candidate_jobs(user_skills, limit=limit * 3)

            scored_jobs = []
            for job in candidate_jobs:
                score_data = self._score_job_match(job, user_skills, resume_text)
                scored_jobs.append({
                    "job": job,
                    "match_score": score_data["match_score"],
                    "skills_matched": score_data["skills_matched"],
                    "skills_missing": score_data["skills_missing"],
                    "reason": score_data.get("reason", "") if include_reasons else "",
                    "learning_suggestions": score_data.get("learning_suggestions", []),
                })

            scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
            top_jobs = scored_jobs[:limit]

            self._log_recommendations(user_id, top_jobs)

            return top_jobs
        except Exception as e:
            logger.error(f"Recommendation generation failed for user {user_id}: {e}")
            return self._get_trending_jobs(limit)

    def _get_user_profile(self, user_id: str) -> Optional[Dict]:
        try:
            result = self.client.table("profiles").select("*").eq("id", user_id).limit(1).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get profile for {user_id}: {e}")
            return None

    def _find_candidate_jobs(self, user_skills: List[str], limit: int = 30) -> List[Dict]:
        try:
            result = (
                self.client.table("external_jobs")
                .select("*")
                .order("published_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to find candidate jobs: {e}")
            return []

    def _score_job_match(
        self,
        job: Dict,
        user_skills: List[str],
        resume_text: str = "",
    ) -> Dict[str, Any]:
        job_skills = set()
        for skill in (job.get("tags") or []):
            job_skills.add(skill.lower())
        for skill in (job.get("ai_skills") or []):
            job_skills.add(skill.lower())

        user_skills_lower = set(s.lower() for s in user_skills)

        matched = user_skills_lower & job_skills
        missing = job_skills - user_skills_lower

        if not job_skills:
            base_score = 50
        else:
            base_score = int((len(matched) / max(len(job_skills), 1)) * 100)

        if user_skills and job_skills:
            jaccard = len(matched) / max(len(user_skills_lower | job_skills), 1)
            base_score = int(base_score * 0.7 + jaccard * 100 * 0.3)

        match_score = min(99, max(10, base_score))

        description_boost = 0
        description = (job.get("description") or "").lower()
        for skill in user_skills_lower:
            if skill in description:
                description_boost += 2
        match_score = min(99, match_score + description_boost)

        learning_suggestions = []
        for skill in list(missing)[:3]:
            learning_suggestions.append(f"Consider learning {skill.title()} to improve your match for this role")

        return {
            "match_score": match_score,
            "skills_matched": list(matched),
            "skills_missing": list(missing)[:5],
            "reason": f"Match based on {len(matched)} shared skills out of {len(job_skills)} required",
            "learning_suggestions": learning_suggestions,
        }

    def _get_trending_jobs(self, limit: int) -> List[Dict]:
        try:
            result = (
                self.client.table("external_jobs")
                .select("*")
                .order("published_at", desc=True)
                .limit(limit)
                .execute()
            )
            jobs = result.data or []
            return [
                {
                    "job": job,
                    "match_score": 50,
                    "skills_matched": [],
                    "skills_missing": [],
                    "reason": "Trending job",
                    "learning_suggestions": [],
                }
                for job in jobs
            ]
        except Exception:
            return []

    def _log_recommendations(self, user_id: str, recommendations: List[Dict]) -> None:
        try:
            for rec in recommendations:
                self.client.table("recommendation_logs").insert({
                    "user_id": user_id,
                    "external_job_id": rec["job"].get("id"),
                    "match_score": rec["match_score"],
                    "reason": rec.get("reason", ""),
                    "skills_matched": rec.get("skills_matched", []),
                    "skills_missing": rec.get("skills_missing", []),
                }).execute()
        except Exception as e:
            logger.warning(f"Failed to log recommendations: {e}")
