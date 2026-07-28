from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging

logger = logging.getLogger("talentiq.exceptions")


def _error_response(
    status_code: int,
    message: str,
    error: str,
    details: list = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "error": error,
            "details": details or [],
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error.get("loc", []))
            msg = error.get("msg", "Validation error")
            errors.append({"field": loc, "message": msg})
        logger.warning(f"Validation error on {request.method} {request.url.path}: {errors}")
        return _error_response(
            status_code=422,
            message="Request validation failed",
            error="VALIDATION_ERROR",
            details=errors,
        )

    @app.exception_handler(ValidationError)
    async def pydantic_exception_handler(request: Request, exc: ValidationError):
        errors = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error.get("loc", []))
            msg = error.get("msg", "Validation error")
            errors.append({"field": loc, "message": msg})
        logger.warning(f"Pydantic validation error on {request.method} {request.url.path}: {errors}")
        return _error_response(
            status_code=422,
            message="Data validation failed",
            error="VALIDATION_ERROR",
            details=errors,
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return _error_response(
            status_code=exc.status_code,
            message=str(exc.detail) if isinstance(exc.detail, str) else exc.detail.get("detail", "HTTP error"),
            error=f"HTTP_{exc.status_code}",
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        logger.error(f"ValueError on {request.method} {request.url.path}: {exc}")
        return _error_response(
            status_code=400,
            message=str(exc),
            error="BAD_REQUEST",
        )

    @app.exception_handler(FileNotFoundError)
    async def file_not_found_handler(request: Request, exc: FileNotFoundError):
        logger.warning(f"File not found on {request.method} {request.url.path}: {exc}")
        return _error_response(
            status_code=404,
            message="Resource not found",
            error="NOT_FOUND",
        )

    @app.exception_handler(TimeoutError)
    async def timeout_error_handler(request: Request, exc: TimeoutError):
        logger.error(f"Timeout on {request.method} {request.url.path}: {exc}")
        return _error_response(
            status_code=504,
            message="Request timed out",
            error="TIMEOUT",
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception(
            f"Unhandled exception on {request.method} {request.url.path}: {exc}"
        )
        return _error_response(
            status_code=500,
            message="Internal server error",
            error="INTERNAL_ERROR",
        )
