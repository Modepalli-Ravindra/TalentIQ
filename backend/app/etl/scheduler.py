import asyncio
import logging
from datetime import datetime
from app.etl.sync_service import JobSyncService
from app.etl.repository import JobRepository
from app.core.config import settings

logger = logging.getLogger("talentiq.etl.scheduler")

_sync_running = False


async def run_scheduled_sync():
    global _sync_running
    if _sync_running:
        logger.warning("Sync already in progress — skipping")
        return
    _sync_running = True
    try:
        from app.core.supabase import get_supabase_client
        client = get_supabase_client()
        repo = JobRepository(client)
        service = JobSyncService(repo)
        report = await service.sync()
        logger.info(f"Scheduled sync completed: {report.imported} imported, {report.updated} updated")
        return report
    except Exception as e:
        logger.error(f"Scheduled sync failed: {e}")
    finally:
        _sync_running = False


async def start_scheduler():
    interval_hours = settings.SYNC_INTERVAL_HOURS
    interval_seconds = interval_hours * 3600
    logger.info(f"Scheduler started — syncing every {interval_hours} hours")
    while True:
        await asyncio.sleep(interval_seconds)
        await run_scheduled_sync()
