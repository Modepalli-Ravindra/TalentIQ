import json
import logging
from typing import Optional, List, Dict, Any

from groq import Groq

from app.core.config import settings

logger = logging.getLogger("talentiq.ai")

_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def _chat(system: str, user: str, temperature: float = 0.3, max_tokens: int = 1024) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


def _chat_json(system: str, user: str, temperature: float = 0.2) -> Dict[str, Any]:
    raw = _chat(system, user, temperature=temperature, max_tokens=2048)
    cleaned = raw.strip()
    import re
    code_block = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
    if code_block:
        cleaned = code_block.group(1).strip()
    else:
        brace_start = cleaned.find("{")
        bracket_start = cleaned.find("[")
        if brace_start != -1 and (bracket_start == -1 or brace_start < bracket_start):
            cleaned = cleaned[brace_start:]
            brace_depth = 0
            for i, ch in enumerate(cleaned):
                if ch == "{": brace_depth += 1
                elif ch == "}": brace_depth -= 1
                if brace_depth == 0:
                    cleaned = cleaned[:i + 1]
                    break
    return json.loads(cleaned)


# --- 1. Job Description Summarizer ---

def summarize_job(description: str, max_sentences: int = 3) -> Dict[str, Any]:
    system = (
        "You are an expert HR analyst. Summarize job descriptions concisely. "
        "Return JSON with keys: summary (string), key_responsibilities (list of strings), "
        "required_experience (string), company_culture_notes (string)."
    )
    user = (
        f"Summarize this job description in {max_sentences} sentences max. "
        f"Extract key responsibilities, required experience, and culture signals.\n\n"
        f"{description}"
    )
    try:
        return _chat_json(system, user)
    except Exception as e:
        logger.error(f"Job summarization failed: {e}")
        return {
            "summary": description[:300] + "..." if len(description) > 300 else description,
            "key_responsibilities": [],
            "required_experience": "",
            "company_culture_notes": "",
        }


# --- 2. Resume Parser & Skill Extractor ---

def parse_resume(resume_text: str) -> Dict[str, Any]:
    system = (
        "You are an expert resume parser. Extract structured data from resumes. "
        "Return JSON with keys: name (string or null), email (string or null), "
        "phone (string or null), summary (string), skills (list of strings), "
        "experience (list of objects with title, company, duration, highlights), "
        "education (list of objects with degree, institution, year), "
        "certifications (list of strings), years_of_experience (number or null)."
    )
    user = f"Parse this resume and extract all structured information:\n\n{resume_text}"
    try:
        return _chat_json(system, user)
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        return {"skills": [], "experience": [], "education": [], "summary": ""}


def extract_skills_from_text(text: str) -> List[str]:
    system = (
        "You are a technical skill extractor. Extract all technical skills, "
        "programming languages, frameworks, tools, and certifications mentioned. "
        "Return a JSON array of skill strings only, e.g. [\"Python\", \"React\", \"AWS\"]."
    )
    try:
        result = _chat_json(system, text)
        return result if isinstance(result, list) else result.get("skills", [])
    except Exception as e:
        logger.error(f"Skill extraction failed: {e}")
        return []


# --- 3. Candidate-Job Fit Analyzer ---

def analyze_fit(job_description: str, candidate_profile: Dict[str, Any]) -> Dict[str, Any]:
    system = (
        "You are a recruitment AI that analyzes candidate-to-job fit. "
        "Return JSON with keys: "
        "match_score (number 0-100), "
        "strengths (list of strings - what the candidate does well for this role), "
        "skill_gaps (list of strings - skills the candidate is missing), "
        "recommendations (list of objects with skill and resource_url fields), "
        "verdict (string - 'Strong Fit', 'Good Fit', 'Partial Fit', or 'Weak Fit'), "
        "explanation (string - 2-3 sentence explanation)."
    )
    skills = candidate_profile.get("parsedSkills", candidate_profile.get("skills", []))
    user = (
        f"Analyze the fit between this candidate and job.\n\n"
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"CANDIDATE PROFILE:\n"
        f"- Skills: {', '.join(skills)}\n"
        f"- Experience: {candidate_profile.get('experience', 'N/A')}\n"
        f"- Education: {candidate_profile.get('education', 'N/A')}\n"
        f"- Summary: {candidate_profile.get('summary', 'N/A')}\n"
    )
    try:
        return _chat_json(system, user)
    except Exception as e:
        logger.error(f"Fit analysis failed: {e}")
        return {
            "match_score": 0,
            "strengths": [],
            "skill_gaps": [],
            "recommendations": [],
            "verdict": "Unable to analyze",
            "explanation": "Analysis could not be completed.",
        }


# --- 4. Job Description Bias Detector & Optimizer ---

def analyze_job_bias(job_text: str) -> Dict[str, Any]:
    system = (
        "You are an expert DEI consultant and HR compliance specialist. "
        "Analyze job descriptions for bias, inflated requirements, and harmful language. "
        "Return JSON with keys: "
        "issues (list of objects with type, text, suggestion, severity ('high'|'medium'|'low')), "
        "readability_score (number 0-100), "
        "optimized_description (string - the fully rewritten, unbiased version), "
        "summary (string - brief overview of findings)."
    )
    user = f"Analyze this job description for bias and optimization opportunities:\n\n{job_text}"
    try:
        return _chat_json(system, user)
    except Exception as e:
        logger.error(f"Bias analysis failed: {e}")
        return {
            "issues": [],
            "readability_score": 0,
            "optimized_description": job_text,
            "summary": "Analysis could not be completed.",
        }


# --- 5. Email Generator ---

def generate_followup_email(
    email_type: str,
    candidate_name: str,
    job_title: str,
    company: str,
    additional_context: Optional[str] = None,
) -> Dict[str, str]:
    system = (
        "You are a professional recruiter email writer. "
        "Generate polished, warm, and professional recruitment emails. "
        "Return JSON with keys: subject (string), body (string). "
        "The email should be concise, personalized, and action-oriented."
    )
    context_block = f"\nAdditional context: {additional_context}" if additional_context else ""
    user = (
        f"Write a {email_type} email for:\n"
        f"- Candidate: {candidate_name}\n"
        f"- Position: {job_title}\n"
        f"- Company: {company}{context_block}\n"
    )
    try:
        return _chat_json(system, user)
    except Exception as e:
        logger.error(f"Email generation failed: {e}")
        return {
            "subject": f"Follow-up: {job_title} at {company}",
            "body": f"Hi {candidate_name},\n\nThank you for your interest in the {job_title} position at {company}. We will be in touch soon.\n\nBest regards,\n{company} Recruitment Team",
        }


# --- 6. Task Scheduler / Productivity Suggestions ---

def generate_task_suggestions(context: Dict[str, Any]) -> Dict[str, Any]:
    system = (
        "You are a productivity and recruitment workflow AI assistant. "
        "Based on the recruiter's current context, suggest prioritized tasks and actions. "
        "Return JSON with keys: "
        "tasks (list of objects with title, priority ('high'|'medium'|'low'), "
        "category ('sourcing'|'interviewing'|'follow_up'|'admin'|'analytics'), "
        "estimated_minutes (number), due_hint (string)), "
        "insights (list of strings - actionable insights based on current data)."
    )
    user = (
        f"Given this recruitment context, suggest prioritized tasks:\n"
        f"- Pending applications: {context.get('pending_applications', 0)}\n"
        f"- Interviews scheduled: {context.get('interviews_scheduled', 0)}\n"
        f"- Open positions: {context.get('open_positions', 0)}\n"
        f"- Recent activity: {context.get('recent_activity', 'none')}\n"
        f"- Time of week: {context.get('day_of_week', 'unknown')}\n"
    )
    try:
        return _chat_json(system, user)
    except Exception as e:
        logger.error(f"Task suggestion failed: {e}")
        return {"tasks": [], "insights": []}


# --- 7. General AI Chat (catch-all) ---

def ai_chat(prompt: str, context: Optional[str] = None) -> str:
    system = (
        "You are TalentIQ AI, a recruitment and HR technology assistant. "
        "You help with resume analysis, job matching, candidate communication, "
        "interview preparation, and recruitment workflow optimization. "
        "Be concise, actionable, and professional."
    )
    if context:
        system += f"\n\nContext: {context}"
    return _chat(system, prompt, temperature=0.5)
