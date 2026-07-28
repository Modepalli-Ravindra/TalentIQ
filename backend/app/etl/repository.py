import logging
import traceback
from typing import Optional, List, Dict, Any
from supabase import Client

logger = logging.getLogger("talentiq.etl.repository")


class JobRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "external_jobs"

    def get_by_external_id(self, external_id: str, source: str = "arbeitnow") -> Optional[Dict]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("external_id", external_id)
                .eq("source", source)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"get_by_external_id error: {e}")
            return None

    def get_all_external_ids(self, source: str = "arbeitnow") -> Dict[str, str]:
        try:
            result = (
                self.client.table(self.table)
                .select("id, external_id")
                .eq("source", source)
                .execute()
            )
            return {row["external_id"]: row["id"] for row in result.data}
        except Exception as e:
            logger.error(f"get_all_external_ids error: {e}")
            return {}

    def get_content_hashes(self, source: str = "arbeitnow") -> Dict[str, str]:
        try:
            result = (
                self.client.table(self.table)
                .select("external_id, content_hash")
                .eq("source", source)
                .execute()
            )
            return {row["external_id"]: row.get("content_hash", "") for row in result.data}
        except Exception as e:
            logger.error(f"get_content_hashes error: {e}")
            return {}

    def mark_expired(self, external_ids: List[str], source: str = "arbeitnow") -> int:
        if not external_ids:
            return 0
        try:
            from datetime import datetime
            updated = 0
            for eid in external_ids:
                self.client.table(self.table).update({
                    "sync_status": "expired",
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("external_id", eid).eq("source", source).execute()
                updated += 1
            logger.info(f"Marked {updated} jobs as expired")
            return updated
        except Exception as e:
            logger.error(f"mark_expired error: {e}")
            return 0

    def bulk_insert(self, records: List[Dict]) -> int:
        if not records:
            return 0
        try:
            import json
            from datetime import datetime, date

            def serialize(obj):
                if isinstance(obj, (datetime, date)):
                    return obj.isoformat()
                raise TypeError(f"Type {type(obj)} not serializable")

            for record in records:
                for key, val in record.items():
                    if isinstance(val, (datetime, date)):
                        record[key] = val.isoformat()

            batch_size = 50
            inserted = 0
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                result = self.client.table(self.table).insert(batch).execute()
                inserted += len(result.data) if result.data else 0
            logger.info(f"Bulk inserted {inserted} records")
            return inserted
        except Exception as e:
            logger.error(f"bulk_insert error: {e}")
            return 0

    def bulk_update(self, records: List[Dict]) -> int:
        if not records:
            return 0
        from datetime import datetime, date
        updated = 0
        for record in records:
            try:
                record_id = record.pop("id", None)
                if not record_id:
                    continue
                record.pop("external_id", None)
                record.pop("created_at", None)
                for key, val in record.items():
                    if isinstance(val, (datetime, date)):
                        record[key] = val.isoformat()
                self.client.table(self.table).update(record).eq("id", record_id).execute()
                updated += 1
            except Exception as e:
                logger.error(f"bulk_update error for record {record_id}: {e}")
        logger.info(f"Bulk updated {updated} records")
        return updated

    def search_jobs(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        is_remote: Optional[bool] = None,
        tags: Optional[List[str]] = None,
        employment_type: Optional[str] = None,
        sort_by: str = "published_at",
        sort_order: str = "desc",
        page: int = 1,
        per_page: int = 20,
    ) -> Dict:
        logger.info(f"search_jobs called: page={page}, per_page={per_page}, sort_by={sort_by}, sort_order={sort_order}")
        try:
            logger.info(f"Querying table '{self.table}'...")
            query = self.client.table(self.table).select("*", count="exact")

            if keyword:
                logger.info(f"Filtering by keyword: {keyword}")
                query = query.or_(
                    f"title.ilike.%{keyword}%,"
                    f"company_name.ilike.%{keyword}%,"
                    f"description.ilike.%{keyword}%"
                )
            if location:
                query = query.ilike("location", f"%{location}%")
            if is_remote is not None:
                query = query.eq("is_remote", is_remote)
            if tags:
                query = query.overlaps("tags", tags)
            if employment_type:
                query = query.eq("employment_type", employment_type)

            ascending = sort_order == "asc"
            query = query.order(sort_by, desc=not ascending)

            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)

            logger.info("Executing Supabase query...")
            result = query.execute()
            logger.info(f"Query returned {len(result.data or [])} rows, count={result.count}")

            return {
                "data": result.data or [],
                "count": result.count or 0,
                "page": page,
                "per_page": per_page,
                "total_pages": max(1, ((result.count or 0) + per_page - 1) // per_page),
            }
        except Exception as e:
            logger.exception(f"search_jobs FAILED: {e}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            return {"data": [], "count": 0, "page": page, "per_page": per_page, "total_pages": 0}

    def get_job_by_id(self, job_id: str) -> Optional[Dict]:
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("id", job_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"get_job_by_id error: {e}")
            return None

    def delete_expired(self, days_old: int = 90) -> int:
        try:
            from datetime import datetime, timedelta
            cutoff = (datetime.utcnow() - timedelta(days=days_old)).isoformat()
            result = (
                self.client.table(self.table)
                .delete()
                .lt("created_at", cutoff)
                .execute()
            )
            count = len(result.data) if result.data else 0
            logger.info(f"Deleted {count} expired jobs older than {days_old} days")
            return count
        except Exception as e:
            logger.error(f"delete_expired error: {e}")
            return 0
