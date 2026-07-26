import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("talentiq.services.copilot")


class CopilotService:
    def __init__(self, client, groq_client=None):
        self.client = client
        self.groq = groq_client
        self.conversations_table = "copilot_conversations"
        self.messages_table = "copilot_messages"

    def get_or_create_conversation(
        self, user_id: str, context_type: str = "general", context_id: Optional[str] = None, title: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            if context_id:
                result = (
                    self.client.table(self.conversations_table)
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("context_type", context_type)
                    .eq("context_id", context_id)
                    .order("updated_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if result.data:
                    return result.data[0]

            data = {
                "user_id": user_id,
                "context_type": context_type,
                "context_id": context_id,
                "title": title or f"{context_type} conversation",
            }
            result = self.client.table(self.conversations_table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting/creating conversation: {e}")
            return None

    def get_messages(self, conversation_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.messages_table)
                .select("*")
                .eq("conversation_id", conversation_id)
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return []

    def send_message(self, conversation_id: str, content: str, context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        try:
            user_msg = {
                "conversation_id": conversation_id,
                "role": "user",
                "content": content,
            }
            self.client.table(self.messages_table).insert(user_msg).execute()

            history = self.get_messages(conversation_id)
            messages = [{"role": m["role"], "content": m["content"]} for m in history]

            system_prompt = self._build_system_prompt(context)
            full_messages = [{"role": "system", "content": system_prompt}] + messages

            assistant_content = self._call_groq(full_messages)

            assistant_msg = {
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": assistant_content,
                "metadata": json.dumps({"context": context}) if context else None,
            }
            result = self.client.table(self.messages_table).insert(assistant_msg).execute()

            self.client.table(self.conversations_table).update(
                {"updated_at": datetime.utcnow().isoformat()}
            ).eq("id", conversation_id).execute()

            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return None

    def list_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        try:
            result = (
                self.client.table(self.conversations_table)
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing conversations: {e}")
            return []

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        try:
            self.client.table(self.messages_table).delete().eq("conversation_id", conversation_id).execute()
            self.client.table(self.conversations_table).delete().eq("id", conversation_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False

    def _build_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        base = (
            "You are TalentIQ Copilot, an AI career assistant. You help users with:\n"
            "- Job search strategy and matching\n"
            "- Resume writing and improvement\n"
            "- Interview preparation and tips\n"
            "- Career advice and skill development\n"
            "- Application tracking and follow-ups\n\n"
            "Be concise, actionable, and supportive. Use bullet points for lists. "
            "When referencing jobs or applications, use the context provided."
        )
        if context:
            if context.get("type") == "job_search":
                base += f"\n\nCurrent search context: User is looking for {context.get('query', 'jobs')}."
            elif context.get("type") == "resume":
                base += "\n\nThe user is working on their resume. Help them improve it."
            elif context.get("type") == "interview":
                base += f"\n\nThe user has an upcoming interview for: {context.get('job_title', 'a position')}. Help them prepare."
            elif context.get("type") == "application":
                base += f"\n\nThe user is tracking application: {context.get('company', 'a company')}."
        return base

    def _call_groq(self, messages: List[Dict[str, str]]) -> str:
        if not self.groq:
            return "I'm here to help! However, the AI service is currently unavailable. Please try again later."
        try:
            response = self.groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return "I encountered an error processing your request. Please try again."
