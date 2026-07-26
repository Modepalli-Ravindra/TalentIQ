from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
import logging
import time

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.exceptions import register_exception_handlers
from app.core.audit_logger import AuditMiddleware
from app.api.v1.auth import router as auth_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.ai import router as ai_router
from app.api.v1.health import router as health_router
from app.api.v1.semantic_search import router as search_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.saved_jobs import router as saved_jobs_router
from app.api.v1.recent_jobs import router as recent_jobs_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.calendar import router as calendar_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.resume_improvement import router as resume_router
from app.api.v1.comparison import router as comparison_router
from app.api.v1.company_verification import router as verification_router

setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger("talentiq")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        status_code = response.status_code
        path = request.url.path
        method = request.method

        from app.api.v1.health import record_request
        record_request(status_code, path)

        if status_code >= 500:
            logger.error(f"{method} {path} -> {status_code} ({duration:.3f}s)")
        elif status_code >= 400:
            logger.warning(f"{method} {path} -> {status_code} ({duration:.3f}s)")
        elif not path.startswith("/health") and not path.startswith("/metrics"):
            logger.info(f"{method} {path} -> {status_code} ({duration:.3f}s)")

        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "message": f"Request body too large. Maximum size is {settings.MAX_BODY_SIZE // (1024 * 1024)}MB.",
                    "error": "PAYLOAD_TOO_LARGE",
                    "details": [],
                },
            )
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate()
    logger.info(f"TalentIQ AI v{settings.VERSION} starting up...")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    scheduler_task = asyncio.create_task(_start_background_scheduler())
    yield
    logger.info("TalentIQ AI shutting down...")
    scheduler_task.cancel()


async def _start_background_scheduler():
    try:
        from app.etl.scheduler import start_scheduler
        await start_scheduler()
    except asyncio.CancelledError:
        logger.info("Scheduler cancelled")
    except Exception as e:
        logger.error(f"Scheduler error: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="TalentIQ AI - AI-powered hiring platform with job search, resume analysis, and candidate matching.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(AuditMiddleware)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["X-RateLimit-Limit-Minute", "X-RateLimit-Remaining-Minute", "X-RateLimit-Remaining-Hour"],
    max_age=600,
)

register_exception_handlers(app)

app.include_router(health_router, tags=["Health"])
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(jobs_router, prefix=settings.API_V1_STR, tags=["Jobs & ETL"])
app.include_router(ai_router, prefix=settings.API_V1_STR, tags=["AI"])
app.include_router(search_router, prefix=settings.API_V1_STR, tags=["Search"])
app.include_router(recommendations_router, prefix=settings.API_V1_STR, tags=["Recommendations"])
app.include_router(saved_jobs_router, prefix=settings.API_V1_STR, tags=["Saved Jobs"])
app.include_router(recent_jobs_router, prefix=settings.API_V1_STR, tags=["Recent Jobs"])
app.include_router(interviews_router, prefix=settings.API_V1_STR, tags=["Interviews"])
app.include_router(calendar_router, prefix=settings.API_V1_STR, tags=["Calendar"])
app.include_router(copilot_router, prefix=settings.API_V1_STR, tags=["Copilot"])
app.include_router(resume_router, prefix=settings.API_V1_STR, tags=["Resume"])
app.include_router(comparison_router, prefix=settings.API_V1_STR, tags=["Comparison"])
app.include_router(verification_router, prefix=settings.API_V1_STR, tags=["Company Verification"])


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "TalentIQ AI Core API",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
