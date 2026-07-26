import logging
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger("talentiq.services.resume_improvement")


class ResumeImprovementService:
    def __init__(self, client, groq_client=None):
        self.client = client
        self.groq = groq_client
        self.table = "resume_improvements"

    def improve_resume(
        self,
        user_id: str,
        original_text: str,
        improvement_type: str = "full",
        target_job_description: Optional[str] = None,
        resume_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        try:
            prompt = self._build_improvement_prompt(original_text, improvement_type, target_job_description)

            if self.groq:
                response = self.groq.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.5,
                    max_tokens=2048,
                )
                raw = response.choices[0].message.content
                result = self._parse_improvement_response(raw)
            else:
                result = {
                    "improved_text": original_text,
                    "suggestions": ["AI service unavailable. Please try again."],
                    "score_before": 50,
                    "score_after": 50,
                }

            record = {
                "user_id": user_id,
                "resume_id": resume_id,
                "original_text": original_text,
                "improved_text": result["improved_text"],
                "improvement_type": improvement_type,
                "target_job_description": target_job_description,
                "suggestions": json.dumps(result.get("suggestions", [])),
                "score_before": result.get("score_before"),
                "score_after": result.get("score_after"),
            }

            db_result = self.client.table(self.table).insert(record).execute()
            return db_result.data[0] if db_result.data else None
        except Exception as e:
            logger.error(f"Error improving resume: {e}")
            return None

    def get_history(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting improvement history: {e}")
            return []

    def mark_applied(self, improvement_id: str, user_id: str) -> bool:
        try:
            self.client.table(self.table).update({"applied": True}).eq("id", improvement_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error marking applied: {e}")
            return False

    def _build_improvement_prompt(self, text: str, improvement_type: str, target_jd: Optional[str] = None) -> str:
        type_instructions = {
            "rewrite": "Rewrite this resume section to be more professional and impactful. Use strong action verbs and quantified achievements.",
            "enhance": "Enhance this resume by adding more detail, power words, and quantified results where possible.",
            "ats_optimize": "Optimize this resume for ATS (Applicant Tracking Systems). Use standard section headers, relevant keywords, and clean formatting.",
            "keyword_boost": f"Boost keyword relevance for this resume. Target keywords from the job description provided.",
            "format": "Reformat this resume for better readability. Use consistent formatting, clear sections, and professional structure.",
            "full": "Provide a comprehensive resume improvement: rewrite for impact, optimize for ATS, add keywords, and improve formatting. Return the complete improved resume.",
        }

        prompt = f"Improve this resume. Task: {type_instructions.get(improvement_type, type_instructions['full'])}\n\n"
        prompt += f"Original Resume:\n{text}\n\n"

        if target_jd:
            prompt += f"Target Job Description:\n{target_jd}\n\n"

        prompt += (
            "Respond in JSON format:\n"
            '{"improved_text": "...", "suggestions": ["suggestion1", ...], "score_before": 0-100, "score_after": 0-100}\n'
            "The improved_text should be the full improved resume text.\n"
            "suggestions should be a list of specific improvement tips.\n"
            "score_before and score_after are estimated ATS/readability scores."
        )
        return prompt

    def _parse_improvement_response(self, raw: str) -> Dict[str, Any]:
        try:
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
            return json.loads(text)
        except (json.JSONDecodeError, IndexError):
            return {
                "improved_text": raw,
                "suggestions": [],
                "score_before": None,
                "score_after": None,
            }
