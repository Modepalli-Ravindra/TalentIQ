import logging
from typing import Optional, List, Dict

logger = logging.getLogger("talentiq.etl.ai_placeholder")


def generate_job_summary(description: Optional[str]) -> Optional[str]:
    if not description:
        return None
    words = description.split()
    if len(words) <= 50:
        return description
    return " ".join(words[:50]) + "..."


def extract_skills(description: Optional[str], tags: Optional[List[str]] = None) -> List[str]:
    if not tags:
        tags = []
    skill_keywords = [
        "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
        "FastAPI", "Django", "Flask", "PostgreSQL", "MySQL", "MongoDB",
        "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
        "Java", "Go", "Rust", "C++", "Ruby", "PHP", "Swift", "Kotlin",
        "GraphQL", "REST", "Redis", "Elasticsearch", "Git", "CI/CD",
        "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch",
        "HTML", "CSS", "Tailwind", "Vue", "Angular", "Svelte",
    ]
    combined = f"{description or ''} {' '.join(tags)}".lower()
    found = [s for s in skill_keywords if s.lower() in combined]
    return list(dict.fromkeys(found + tags))[:15]


def detect_seniority(title: Optional[str], description: Optional[str]) -> str:
    combined = f"{title or ''} {description or ''}".lower()
    if any(w in combined for w in ["staff", "principal", "distinguished", "fellow"]):
        return "Staff+"
    if any(w in combined for w in ["lead", "head of", "director", "vp"]):
        return "Lead"
    if any(w in combined for w in ["senior", "sr.", "sr "]):
        return "Senior"
    if any(w in combined for w in ["junior", "jr.", "jr ", "entry level", "associate", "graduate"]):
        return "Junior"
    return "Mid"


def estimate_salary(description: Optional[str], location: Optional[str]) -> Optional[str]:
    import re
    if not description:
        return None
    patterns = [
        r'\$[\d,]+\s*[-–]\s*\$[\d,]+',
        r'[\d,]+\s*[-–]\s*[\d,]+\s*(?:USD|EUR|GBP)',
        r'(?:salary|compensation)[:\s]*\$[\d,]+',
    ]
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return None


def classify_department(title: Optional[str], description: Optional[str]) -> str:
    combined = f"{title or ''} {description or ''}".lower()
    if any(w in combined for w in ["frontend", "front-end", "ui ", "react", "vue", "css"]):
        return "Frontend Engineering"
    if any(w in combined for w in ["backend", "back-end", "server", "api", "microservice"]):
        return "Backend Engineering"
    if any(w in combined for w in ["full stack", "fullstack", "full-stack"]):
        return "Full Stack Engineering"
    if any(w in combined for w in ["data", "analytics", "ml", "machine learning", "ai"]):
        return "Data & AI"
    if any(w in combined for w in ["devops", "infrastructure", "platform", "sre", "cloud"]):
        return "DevOps & Infrastructure"
    if any(w in combined for w in ["mobile", "ios", "android", "flutter", "react native"]):
        return "Mobile Engineering"
    if any(w in combined for w in ["security", "infosec", "cybersecurity"]):
        return "Security Engineering"
    if any(w in combined for w in ["product", "pm", "project manager"]):
        return "Product Management"
    if any(w in combined for w in ["design", "ux", "ui designer", "figma"]):
        return "Design"
    return "Engineering"
