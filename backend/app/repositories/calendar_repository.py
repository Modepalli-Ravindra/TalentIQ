import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger("talentiq.repositories.calendar")


class CalendarRepository:
    def __init__(self, client):
        self.client = client
        self.connections_table = "calendar_connections"
        self.events_table = "calendar_events"

    def get_connections(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.connections_table)
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting calendar connections: {e}")
            return []

    def get_connection(self, connection_id: str) -> Optional[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.connections_table)
                .select("*")
                .eq("id", connection_id)
                .single()
                .execute()
            )
            return result.data
        except Exception as e:
            logger.error(f"Error getting connection {connection_id}: {e}")
            return None

    def upsert_connection(self, user_id: str, provider: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            existing = (
                self.client.table(self.connections_table)
                .select("id")
                .eq("user_id", user_id)
                .eq("provider", provider)
                .execute()
            )
            if existing.data:
                conn_id = existing.data[0]["id"]
                data["updated_at"] = datetime.utcnow().isoformat()
                result = (
                    self.client.table(self.connections_table)
                    .update(data)
                    .eq("id", conn_id)
                    .execute()
                )
                return result.data[0] if result.data else None
            else:
                data["user_id"] = user_id
                data["provider"] = provider
                result = self.client.table(self.connections_table).insert(data).execute()
                return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error upserting connection: {e}")
            return None

    def delete_connection(self, connection_id: str) -> bool:
        try:
            self.client.table(self.connections_table).delete().eq("id", connection_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting connection {connection_id}: {e}")
            return False

    def list_events(self, user_id: str, start: Optional[str] = None, end: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            query = self.client.table(self.events_table).select("*").eq("user_id", user_id)
            if start:
                query = query.gte("start_time", start)
            if end:
                query = query.lte("end_time", end)
            result = query.order("start_time", desc=False).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing events: {e}")
            return []

    def create_event(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table(self.events_table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            return None

    def update_event(self, event_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table(self.events_table).update(data).eq("id", event_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating event: {event_id}: {e}")
            return None

    def delete_event(self, event_id: str) -> bool:
        try:
            self.client.table(self.events_table).delete().eq("id", event_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {e}")
            return False
