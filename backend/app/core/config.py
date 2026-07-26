import os
import logging
from dotenv import load_dotenv
from typing import List

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


class Settings:
    PROJECT_NAME: str = "TalentIQ AI Core API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    SYNC_INTERVAL_HOURS: int = int(os.getenv("SYNC_INTERVAL_HOURS", "6"))
    ARBEITNOW_MAX_PAGES: int = int(os.getenv("ARBEITNOW_MAX_PAGES", "10"))

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ]

    MAX_BODY_SIZE: int = int(os.getenv("MAX_BODY_SIZE", str(10 * 1024 * 1024)))
    MAX_RESUME_SIZE: int = int(os.getenv("MAX_RESUME_SIZE", str(10 * 1024 * 1024)))
    MAX_AI_PROMPT_LENGTH: int = int(os.getenv("MAX_AI_PROMPT_LENGTH", "20000"))
    ALLOWED_UPLOAD_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Phase 2: Email
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "resend")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@talentiq.ai")

    # Phase 2: Embedding
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "512"))

    # Phase 2: Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    def validate(self) -> None:
        missing = []
        if not self.JWT_SECRET:
            missing.append("JWT_SECRET")
        if not self.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not self.SUPABASE_SERVICE_ROLE_KEY and not self.SUPABASE_ANON_KEY:
            missing.append("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY")
        if missing:
            logging.warning(f"Missing required environment variables: {', '.join(missing)}")


settings = Settings()
