import logging
import json
from typing import List, Optional, Dict, Any
from supabase import Client

from app.services.embedding_service import generate_job_embedding, text_to_embedding

logger = logging.getLogger("talentiq.repositories.semantic_search")


class SemanticSearchRepository:
    def __init__(self, client: Client):
        self.client = client

    def upsert_job_embedding(self, job_id: str, title: str, description: str, tags: List[str] = None) -> bool:
        try:
            embedding = generate_job_embedding(title, description, tags or [])
            embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
            self.client.table("external_jobs").update({"embedding": embedding_str}).eq("id", job_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert job embedding for {job_id}: {e}")
            return False

    def upsert_profile_embedding(self, user_id: str, name: str = "", skills: List[str] = None, summary: str = "") -> bool:
        try:
            from app.services.embedding_service import generate_profile_embedding
            embedding = generate_profile_embedding(name=name, skills=skills, summary=summary)
            embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
            self.client.table("profiles").update({"embedding": embedding_str}).eq("id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert profile embedding for {user_id}: {e}")
            return False

    def upsert_resume_embedding(self, resume_id: str, resume_text: str) -> bool:
        try:
            from app.services.embedding_service import generate_resume_embedding
            embedding = generate_resume_embedding(resume_text)
            embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
            self.client.table("resumes").update({"embedding": embedding_str}).eq("id", resume_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert resume embedding for {resume_id}: {e}")
            return False

    def semantic_search_jobs(
        self,
        query: str,
        limit: int = 20,
        location: Optional[str] = None,
        is_remote: Optional[bool] = None,
        tags: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        try:
            query_embedding = text_to_embedding(query)
            embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

            rpc_result = self.client.rpc(
                "search_jobs_semantic",
                {
                    "query_embedding": embedding_str,
                    "match_count": limit,
                },
            ).execute()

            results = rpc_result.data if rpc_result.data else []

            if location:
                results = [r for r in results if r.get("location", "") and location.lower() in r["location"].lower()]
            if is_remote is not None:
                results = [r for r in results if r.get("is_remote") == is_remote]
            if tags:
                results = [r for r in results if any(t in (r.get("tags") or []) for t in tags)]

            return results
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return self._fallback_keyword_search(query, limit)

    def _fallback_keyword_search(self, query: str, limit: int = 20) -> List[Dict]:
        try:
            result = (
                self.client.table("external_jobs")
                .select("*")
                .or_(f"title.ilike.%{query}%,description.ilike.%{query}%,company_name.ilike.%{query}%")
                .order("published_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Fallback search failed: {e}")
            return []

    def batch_generate_embeddings(self, table: str, batch_size: int = 50) -> int:
        """Generate embeddings for all records in a table that don't have one yet."""
        try:
            if table == "external_jobs":
                select_cols = "id, title, description, tags"
            elif table == "profiles":
                select_cols = "id, name, skills, bio"
            else:
                return 0

            result = (
                self.client.table(table)
                .select(select_cols)
                .is_("embedding", "null")
                .limit(batch_size)
                .execute()
            )
            records = result.data or []
            updated = 0

            for record in records:
                record_id = record["id"]
                if table == "external_jobs":
                    embedding = generate_job_embedding(
                        record.get("title", ""),
                        record.get("description", ""),
                        record.get("tags", []),
                    )
                elif table == "profiles":
                    from app.services.embedding_service import generate_profile_embedding
                    embedding = generate_profile_embedding(
                        name=record.get("name", ""),
                        skills=record.get("skills", []),
                        bio=record.get("bio", ""),
                    )
                else:
                    continue

                embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
                self.client.table(table).update({"embedding": embedding_str}).eq("id", record_id).execute()
                updated += 1

            logger.info(f"Batch generated {updated} embeddings for {table}")
            return updated
        except Exception as e:
            logger.error(f"Batch embedding generation failed for {table}: {e}")
            return 0
