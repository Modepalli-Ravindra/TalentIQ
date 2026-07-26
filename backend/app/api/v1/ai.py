from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.core.deps import get_current_user
from app.core.rate_limiter import check_rate_limit, get_rate_limit_headers
from app.core.ai_cache import cached_ai_call, store_ai_response
from app.core.config import settings
from app.services.ai_service import (
    summarize_job,
    parse_resume,
    extract_skills_from_text,
    analyze_fit,
    analyze_job_bias,
    generate_followup_email,
    generate_task_suggestions,
    ai_chat,
)

router = APIRouter()


class SummarizeRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=settings.MAX_AI_PROMPT_LENGTH)
    max_sentences: int = Field(default=3, ge=1, le=10)


class ParseResumeRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, max_length=20000)


class ExtractSkillsRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=10000)


class FitAnalysisRequest(BaseModel):
    job_description: str = Field(..., min_length=10, max_length=10000)
    candidate_profile: Dict[str, Any]


class BiasAnalysisRequest(BaseModel):
    job_text: str = Field(..., min_length=10, max_length=10000)


class EmailRequest(BaseModel):
    email_type: str = Field(..., pattern="^(interview|feedback|offer|follow_up|rejection)$")
    candidate_name: str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=1, max_length=200)
    company: str = Field(..., min_length=1, max_length=200)
    additional_context: Optional[str] = Field(None, max_length=5000)


class TaskSuggestionRequest(BaseModel):
    pending_applications: int = Field(default=0, ge=0)
    interviews_scheduled: int = Field(default=0, ge=0)
    open_positions: int = Field(default=0, ge=0)
    recent_activity: str = Field(default="", max_length=5000)
    day_of_week: str = Field(default="", max_length=20)


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000)
    context: Optional[str] = Field(None, max_length=10000)


def _rate_limited_response(data: dict, endpoint: str, request: Request) -> JSONResponse:
    remaining_min, remaining_hr, limit = check_rate_limit(request, endpoint)
    headers = get_rate_limit_headers(endpoint, remaining_min, remaining_hr, limit)
    return JSONResponse(content={"success": True, "data": data}, headers=headers)


def _cached_rate_limited_response(
    data: dict, endpoint: str, request: Request, prompt: str = ""
) -> JSONResponse:
    remaining_min, remaining_hr, limit = check_rate_limit(request, endpoint)
    headers = get_rate_limit_headers(endpoint, remaining_min, remaining_hr, limit)
    if prompt:
        store_ai_response(prompt, settings.GROQ_MODEL, data, endpoint=endpoint)
    return JSONResponse(content={"success": True, "data": data}, headers=headers)


@router.post(
    "/ai/summarize",
    summary="Summarize a job description",
    description="Uses AI to generate a concise summary of a job posting.",
    responses={
        200: {"description": "Job summary generated successfully"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def summarize_job_endpoint(
    req: SummarizeRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    cached = cached_ai_call(req.description, settings.GROQ_MODEL, endpoint="summarize")
    if cached:
        return _rate_limited_response(cached, "summarize", request)
    result = summarize_job(req.description, req.max_sentences)
    return _cached_rate_limited_response(result, "summarize", request, prompt=req.description)


@router.post(
    "/ai/parse-resume",
    summary="Parse resume text into structured data",
    description="Extracts structured information from resume text including skills, experience, and education.",
    responses={
        200: {"description": "Resume parsed successfully"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def parse_resume_endpoint(
    req: ParseResumeRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    cached = cached_ai_call(req.resume_text, settings.GROQ_MODEL, endpoint="parse-resume")
    if cached:
        return _rate_limited_response(cached, "parse-resume", request)
    result = parse_resume(req.resume_text)
    return _cached_rate_limited_response(result, "parse-resume", request, prompt=req.resume_text)


@router.post(
    "/ai/extract-skills",
    summary="Extract skills from text",
    description="Identifies and extracts technical and soft skills from job or profile text.",
    responses={
        200: {"description": "Skills extracted successfully"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def extract_skills_endpoint(
    req: ExtractSkillsRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    cached = cached_ai_call(req.text, settings.GROQ_MODEL, endpoint="extract-skills")
    if cached:
        return _rate_limited_response(cached, "extract-skills", request)
    skills = extract_skills_from_text(req.text)
    return _cached_rate_limited_response({"skills": skills}, "extract-skills", request, prompt=req.text)


@router.post(
    "/ai/fit-analysis",
    summary="Analyze candidate-job fit",
    description="AI-powered analysis of how well a candidate matches a job description, including match score, strengths, and skill gaps.",
    responses={
        200: {"description": "Fit analysis completed"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def fit_analysis_endpoint(
    req: FitAnalysisRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    prompt = f"{req.job_description}|{req.candidate_profile}"
    cached = cached_ai_call(prompt, settings.GROQ_MODEL, endpoint="fit-analysis")
    if cached:
        return _rate_limited_response(cached, "fit-analysis", request)
    result = analyze_fit(req.job_description, req.candidate_profile)
    return _cached_rate_limited_response(result, "fit-analysis", request, prompt=prompt)


@router.post(
    "/ai/bias-analysis",
    summary="Analyze job posting for bias",
    description="Scans job descriptions for potential biases and suggests inclusive language improvements.",
    responses={
        200: {"description": "Bias analysis completed"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def bias_analysis_endpoint(
    req: BiasAnalysisRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    cached = cached_ai_call(req.job_text, settings.GROQ_MODEL, endpoint="bias-analysis")
    if cached:
        return _rate_limited_response(cached, "bias-analysis", request)
    result = analyze_job_bias(req.job_text)
    return _cached_rate_limited_response(result, "bias-analysis", request, prompt=req.job_text)


@router.post(
    "/ai/generate-email",
    summary="Generate recruitment email",
    description="Generates professional recruitment emails (interview, feedback, offer, follow-up, rejection).",
    responses={
        200: {"description": "Email generated successfully"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def generate_email_endpoint(
    req: EmailRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    prompt = f"{req.email_type}|{req.candidate_name}|{req.job_title}|{req.company}"
    cached = cached_ai_call(prompt, settings.GROQ_MODEL, endpoint="generate-email")
    if cached:
        return _rate_limited_response(cached, "generate-email", request)
    result = generate_followup_email(
        email_type=req.email_type,
        candidate_name=req.candidate_name,
        job_title=req.job_title,
        company=req.company,
        additional_context=req.additional_context,
    )
    return _cached_rate_limited_response(result, "generate-email", request, prompt=prompt)


@router.post(
    "/ai/task-suggestions",
    summary="Get AI task suggestions",
    description="Analyzes current workload and suggests prioritized tasks for recruiters.",
    responses={
        200: {"description": "Task suggestions generated"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def task_suggestions_endpoint(
    req: TaskSuggestionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    result = generate_task_suggestions(req.model_dump())
    return _rate_limited_response(result, "task-suggestions", request)


@router.post(
    "/ai/chat",
    summary="Chat with AI assistant",
    description="General-purpose AI chat for recruitment queries and assistance.",
    responses={
        200: {"description": "Chat response generated"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["AI"],
)
async def ai_chat_endpoint(
    req: ChatRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    cached = cached_ai_call(req.prompt, settings.GROQ_MODEL, endpoint="chat", context=req.context)
    if cached:
        return _rate_limited_response(cached, "chat", request)
    response = ai_chat(req.prompt, req.context)
    return _cached_rate_limited_response(
        {"response": response}, "chat", request, prompt=req.prompt
    )
