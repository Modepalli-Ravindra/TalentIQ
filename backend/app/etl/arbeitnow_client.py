import logging
import httpx
import time
from typing import Optional, List, Dict
from app.etl.transformer import transform_arbeitnow_job
from app.etl.models import ExternalJobRecord

logger = logging.getLogger("talentiq.etl.client")

ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2
REQUEST_TIMEOUT = 30


async def fetch_arbeitnow_jobs(page: int = 1) -> Dict:
    params = {"page": page}
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"Fetching Arbeitnow page {page} (attempt {attempt}/{MAX_RETRIES})")
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
                response = await client.get(ARBEITNOW_API_URL, params=params)
                response.raise_for_status()
                data = response.json()
                logger.info(f"Fetched page {page}: {len(data.get('data', []))} jobs")
                return data
        except httpx.TimeoutException:
            last_error = f"Timeout on page {page}"
            logger.warning(f"{last_error} (attempt {attempt})")
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP {e.response.status_code} on page {page}"
            logger.warning(f"{last_error} (attempt {attempt})")
        except Exception as e:
            last_error = f"Unexpected error on page {page}: {e}"
            logger.error(f"{last_error} (attempt {attempt})")

        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY_SECONDS * attempt)

    logger.error(f"All {MAX_RETRIES} retries failed for page {page}: {last_error}")
    return {"data": [], "links": {}}


async def fetch_all_jobs(max_pages: int = 10) -> List[ExternalJobRecord]:
    all_raw_jobs: List[dict] = []
    current_page = 1
    has_next = True

    while has_next and current_page <= max_pages:
        response = await fetch_arbeitnow_jobs(page=current_page)
        raw_jobs = response.get("data", [])

        if not raw_jobs:
            break

        all_raw_jobs.extend(raw_jobs)

        links = response.get("links", {})
        has_next = bool(links.get("next"))
        current_page += 1

        logger.info(f"Page {current_page - 1} fetched. Total so far: {len(all_raw_jobs)}")

    logger.info(f"Total raw jobs fetched: {len(all_raw_jobs)} from {current_page - 1} pages")

    transformed: List[ExternalJobRecord] = []
    for i, raw in enumerate(all_raw_jobs):
        record = transform_arbeitnow_job(raw, i)
        if record:
            transformed.append(record)

    logger.info(f"Transformed {len(transformed)} / {len(all_raw_jobs)} jobs")
    return transformed
