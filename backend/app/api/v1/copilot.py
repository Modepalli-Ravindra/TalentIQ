from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.services.copilot_service import CopilotService

router = APIRouter()


class ConversationCreate(BaseModel):
    context_type: str = "general"
    context_id: Optional[str] = None
    title: Optional[str] = None


class MessageSend(BaseModel):
    content: str
    context: Optional[dict] = None


def _get_service():
    from app.services.ai_service import _get_client
    return CopilotService(get_supabase_client(), _get_client())


@router.get("/copilot/conversations")
async def list_conversations(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    service = _get_service()
    conversations = service.list_conversations(current_user["id"], limit=limit)
    return {"success": True, "data": conversations, "count": len(conversations)}


@router.post("/copilot/conversations")
async def create_conversation(data: ConversationCreate, current_user: dict = Depends(get_current_user)):
    service = _get_service()
    conv = service.get_or_create_conversation(
        user_id=current_user["id"],
        context_type=data.context_type,
        context_id=data.context_id,
        title=data.title,
    )
    if not conv:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    return {"success": True, "data": conv}


@router.get("/copilot/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    service = _get_service()
    messages = service.get_messages(conversation_id)
    return {"success": True, "data": messages, "count": len(messages)}


@router.post("/copilot/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str, data: MessageSend, current_user: dict = Depends(get_current_user)
):
    service = _get_service()
    msg = service.send_message(conversation_id, data.content, context=data.context)
    if not msg:
        raise HTTPException(status_code=500, detail="Failed to send message")
    return {"success": True, "data": msg}


@router.post("/copilot/chat")
async def copilot_chat(data: MessageSend, current_user: dict = Depends(get_current_user)):
    service = _get_service()
    conv = service.get_or_create_conversation(
        user_id=current_user["id"],
        context_type=data.context.get("type", "general") if data.context else "general",
        context_id=data.context.get("id") if data.context else None,
        title="Quick chat",
    )
    if not conv:
        raise HTTPException(status_code=500, detail="Failed to create conversation")

    msg = service.send_message(conv["id"], data.content, context=data.context)
    if not msg:
        raise HTTPException(status_code=500, detail="Failed to get response")

    return {"success": True, "data": {"conversation_id": conv["id"], "message": msg}}


@router.delete("/copilot/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    service = _get_service()
    deleted = service.delete_conversation(conversation_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete")
    return {"success": True}
