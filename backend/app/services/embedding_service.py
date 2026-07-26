import logging
import pickle
import hashlib
import numpy as np
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger("talentiq.embedding")

_vectorizer = None
_vectorizer_lock = False


def _get_vectorizer():
    """Lazy-load and fit the TF-IDF vectorizer on a corpus of recruitment terms."""
    global _vectorizer
    if _vectorizer is not None:
        return _vectorizer

    from sklearn.feature_extraction.text import TfidfVectorizer

    training_corpus = [
        "software engineer python react typescript node.js full stack web development",
        "data scientist machine learning deep learning tensorflow pytorch nlp",
        "product manager agile scrum roadmap stakeholder management",
        "devops engineer kubernetes docker aws cloud infrastructure ci cd",
        "ux ui designer figma sketch user experience interface design",
        "backend developer java spring boot microservices api rest graphql",
        "frontend developer react vue angular javascript html css tailwind",
        "project manager pmp budgeting resource planning risk management",
        "security engineer penetration testing vulnerability assessment compliance",
        "database administrator postgresql mysql mongodb redis elasticsearch",
        "mobile developer ios android swift kotlin react native flutter",
        "ai engineer llm generative ai rag vector database embeddings",
        "technical lead architecture system design code review mentoring",
        "quality assurance testing automation selenium cypress jest",
        "business analyst requirements documentation stakeholder interviews sql",
        "cloud architect aws gcp azure terraform infrastructure as code",
        "marketing manager seo content strategy social media analytics",
        "finance analyst accounting budgeting forecasting reporting",
        "human resources recruiting talent acquisition onboarding training",
        "sales representative business development crm pipeline negotiation",
        "remote hybrid onsite contract full time part time freelance",
        "entry level junior mid senior lead principal staff director vp",
        "startup enterprise agency consulting fintech healthtech edtech",
        "communication collaboration problem solving leadership teamwork",
        "responsive design accessibility wcag semantic html progressive enhancement",
        "rest api websocket graphql grpc protocol buffer event driven",
        "git github gitlab code review pull request merge conflict",
        "agile waterfall kanban sprint retrospective standup planning poker",
        "performance optimization caching cdn load balancing auto scaling",
        "monitoring observability logging tracing alerting prometheus grafana",
    ]

    _vectorizer = TfidfVectorizer(
        max_features=settings.EMBEDDING_DIMENSION,
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95,
        sublinear_tf=True,
    )
    _vectorizer.fit(training_corpus)
    logger.info(f"TF-IDF vectorizer fitted with vocabulary size: {len(_vectorizer.vocabulary_)}")
    return _vectorizer


def generate_embedding(text: str) -> List[float]:
    """Generate a TF-IDF embedding vector from text."""
    if not text or not text.strip():
        return [0.0] * settings.EMBEDDING_DIMENSION

    vectorizer = _get_vectorizer()
    try:
        vector = vectorizer.transform([text])
        dense = vector.toarray().flatten()

        norm = np.linalg.norm(dense)
        if norm > 0:
            dense = dense / norm

        target_dim = settings.EMBEDDING_DIMENSION
        if len(dense) < target_dim:
            dense = np.pad(dense, (0, target_dim - len(dense)))
        elif len(dense) > target_dim:
            dense = dense[:target_dim]

        return dense.tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return [0.0] * settings.EMBEDDING_DIMENSION


def generate_job_embedding(title: str, description: str, tags: List[str] = None) -> List[float]:
    """Generate embedding for a job posting."""
    parts = [title or ""]
    if description:
        parts.append(description[:2000])
    if tags:
        parts.append(" ".join(tags))
    text = " ".join(parts)
    return generate_embedding(text)


def generate_profile_embedding(
    name: str = "",
    skills: List[str] = None,
    experience: str = "",
    bio: str = "",
    summary: str = "",
) -> List[float]:
    """Generate embedding for a candidate profile."""
    parts = []
    if name:
        parts.append(name)
    if skills:
        parts.append(" ".join(skills))
    if summary:
        parts.append(summary[:1000])
    if experience:
        parts.append(experience[:1000])
    if bio:
        parts.append(bio[:500])
    text = " ".join(parts)
    return generate_embedding(text)


def generate_resume_embedding(resume_text: str) -> List[float]:
    """Generate embedding for resume text."""
    return generate_embedding(resume_text[:3000] if resume_text else "")


def text_to_embedding(text: str) -> List[float]:
    """Generic text embedding for semantic search queries."""
    return generate_embedding(text)
