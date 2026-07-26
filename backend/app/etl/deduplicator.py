import logging
from typing import List, Tuple, Dict
from app.etl.models import ExternalJobRecord

logger = logging.getLogger("talentiq.etl.deduplicator")


def deduplicate_jobs(
    incoming: List[ExternalJobRecord],
    existing_external_ids: Dict[str, str],
) -> Tuple[List[ExternalJobRecord], List[ExternalJobRecord], int]:
    to_insert: List[ExternalJobRecord] = []
    to_update: List[ExternalJobRecord] = []
    duplicates = 0

    seen_ids: set = set()

    for job in incoming:
        key = f"{job.external_id}:{job.source}"

        if key in seen_ids:
            duplicates += 1
            continue
        seen_ids.add(key)

        if job.external_id in existing_external_ids:
            to_update.append(job)
        else:
            to_insert.append(job)

    logger.info(
        f"Deduplication complete: {len(to_insert)} new, "
        f"{len(to_update)} to update, {duplicates} duplicates"
    )
    return to_insert, to_update, duplicates
