import os
import uuid
import logging
from typing import Optional
from supabase import create_client, Client

logger = logging.getLogger("talentiq.supabase")

_client: Client = None


def get_supabase_client() -> Client:
    global _client
    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

    logger.info("Initializing Supabase client...")
    logger.info(f"SUPABASE_URL set: {bool(url)} (length={len(url)})")
    logger.info(f"SUPABASE_SERVICE_ROLE_KEY set: {bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))}")
    logger.info(f"SUPABASE_ANON_KEY set: {bool(os.getenv('SUPABASE_ANON_KEY'))}")

    if not url:
        logger.error("SUPABASE_URL is empty or not set")
        raise ValueError("SUPABASE_URL must be set")
    if not key:
        logger.error("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set")
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set")

    try:
        _client = create_client(url, key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.exception(f"Failed to create Supabase client: {e}")
        raise

    return _client


def safe_uuid(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    try:
        uuid.UUID(val)
        return val
    except (ValueError, TypeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, val))
