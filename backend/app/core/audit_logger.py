import logging
import time
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("talentiq.audit")


class AuditLogger:
    """Centralized audit logging to Supabase audit_logs table."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from app.core.supabase import get_supabase_client
            self._client = get_supabase_client()
        return self._client

    def log(
        self,
        action: str,
        resource_type: str,
        user_id: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        try:
            client = self._get_client()
            record = {
                "action": action,
                "resource_type": resource_type,
                "user_id": user_id,
                "resource_id": resource_id,
                "details": details or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
            }
            client.table("audit_logs").insert(record).execute()
            logger.debug(f"Audit: {action} {resource_type} by {user_id}")
        except Exception as e:
            logger.error(f"Audit log failed: {e}")

    def log_auth(self, action: str, user_id: str, ip: str = "", ua: str = "") -> None:
        self.log(action=action, resource_type="auth", user_id=user_id, ip_address=ip, user_agent=ua)

    def log_job(self, action: str, user_id: str, job_id: str, details: dict = None, ip: str = "", ua: str = "") -> None:
        self.log(action=action, resource_type="job", user_id=user_id, resource_id=job_id, details=details, ip_address=ip, user_agent=ua)

    def log_resume(self, action: str, user_id: str, resume_id: str = "", details: dict = None, ip: str = "", ua: str = "") -> None:
        self.log(action=action, resource_type="resume", user_id=user_id, resource_id=resume_id, details=details, ip_address=ip, user_agent=ua)

    def log_ai(self, action: str, user_id: str, details: dict = None, ip: str = "", ua: str = "") -> None:
        self.log(action=action, resource_type="ai_usage", user_id=user_id, details=details, ip_address=ip, user_agent=ua)

    def log_interview(self, action: str, user_id: str, interview_id: str = "", details: dict = None, ip: str = "", ua: str = "") -> None:
        self.log(action=action, resource_type="interview", user_id=user_id, resource_id=interview_id, details=details, ip_address=ip, user_agent=ua)

    def log_admin(self, action: str, user_id: str, resource_type: str, resource_id: str = "", details: dict = None, ip: str = "", ua: str = "") -> None:
        self.log(action=action, resource_type=resource_type, user_id=user_id, resource_id=resource_id, details=details, ip_address=ip, user_agent=ua)


audit_logger = AuditLogger()


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware that logs auth-related actions automatically."""

    AUDIT_PATHS = {
        "/api/v1/auth/login": "login",
        "/api/v1/auth/register": "register",
        "/api/v1/etl/jobs/sync": "etl_sync",
    }

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        path = request.url.path
        method = request.method

        for audit_path, action in self.AUDIT_PATHS.items():
            if path == audit_path and method in ("POST", "PUT", "PATCH"):
                ip = request.client.host if request.client else ""
                ua = request.headers.get("user-agent", "")
                user_id = getattr(request.state, "user_id", None)
                audit_logger.log(
                    action=action,
                    resource_type="api",
                    user_id=user_id,
                    details={"path": path, "method": method, "status": response.status_code},
                    ip_address=ip,
                    user_agent=ua,
                )
                break

        return response
