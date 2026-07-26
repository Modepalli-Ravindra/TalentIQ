import logging
import sys
from typing import Optional


class SensitiveFilter(logging.Filter):
    SENSITIVE_KEYS = {
        "password", "secret", "token", "api_key", "apikey",
        "authorization", "service_role", "supabase_anon_key",
        "supabase_service_role_key", "groq_api_key",
    }

    def filter(self, record: logging.LogRecord) -> bool:
        if hasattr(record, "msg"):
            msg = str(record.msg).lower()
            for key in self.SENSITIVE_KEYS:
                if key in msg:
                    record.msg = self._sanitize(str(record.msg))
                    break
        if record.args:
            sanitized_args = []
            for arg in record.args:
                if isinstance(arg, str):
                    sanitized_args.append(self._sanitize(arg))
                else:
                    sanitized_args.append(arg)
            record.args = tuple(sanitized_args)
        return True

    @staticmethod
    def _sanitize(text: str) -> str:
        import re
        patterns = [
            r'(password["\s:=]+)[^\s,}"\']+' ,
            r'(token["\s:=]+)[^\s,}"\']+' ,
            r'(api[_-]?key["\s:=]+)[^\s,}"\']+' ,
            r'(secret["\s:=]+)[^\s,}"\']+' ,
            r'(authorization["\s:=]+)[^\s,}"\']+' ,
            r'(Bearer\s+)[^\s,}"\']+' ,
        ]
        result = text
        for pattern in patterns:
            result = re.sub(pattern, r"\1***REDACTED***", result, flags=re.IGNORECASE)
        return result


def setup_logging(log_level: Optional[str] = None) -> logging.Logger:
    level = getattr(logging, (log_level or "INFO").upper(), logging.INFO)

    root_logger = logging.getLogger("talentiq")
    root_logger.setLevel(level)

    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)

        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveFilter())
        root_logger.addHandler(handler)

        file_handler = logging.FileHandler("talentiq.log", encoding="utf-8")
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        file_handler.addFilter(SensitiveFilter())
        root_logger.addHandler(file_handler)

    root_logger.info(f"Logging initialized at level {log_level or 'INFO'}")
    return root_logger


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"talentiq.{name}")
