from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.repositories.calendar_repository import CalendarRepository

router = APIRouter()


class CalendarConnect(BaseModel):
    provider: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    calendar_id: Optional[str] = None
    calendar_name: Optional[str] = None


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: str
    end_time: str
    timezone: str = "UTC"
    location: Optional[str] = None
    interview_id: Optional[str] = None


def _get_repo():
    return CalendarRepository(get_supabase_client())


@router.get("/calendar/connections")
async def list_connections(current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    connections = repo.get_connections(current_user["id"])
    safe = [{k: v for k, v in c.items() if k not in ("access_token", "refresh_token")} for c in connections]
    return {"success": True, "data": safe, "count": len(safe)}


@router.post("/calendar/connect")
async def connect_calendar(data: CalendarConnect, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    conn = repo.upsert_connection(
        user_id=current_user["id"],
        provider=data.provider,
        data={
            "access_token": data.access_token,
            "refresh_token": data.refresh_token,
            "calendar_id": data.calendar_id,
            "calendar_name": data.calendar_name,
            "status": "active",
        },
    )
    if not conn:
        raise HTTPException(status_code=500, detail="Failed to connect calendar")
    return {"success": True, "data": {k: v for k, v in conn.items() if k not in ("access_token", "refresh_token")}}


@router.delete("/calendar/connections/{connection_id}")
async def disconnect_calendar(connection_id: str, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    conn = repo.get_connection(connection_id)
    if not conn or conn["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Connection not found")
    repo.delete_connection(connection_id)
    return {"success": True}


@router.get("/calendar/events")
async def list_events(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    repo = _get_repo()
    events = repo.list_events(current_user["id"], start=start, end=end)
    return {"success": True, "data": events, "count": len(events)}


@router.post("/calendar/events")
async def create_event(data: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    event = repo.create_event({
        "user_id": current_user["id"],
        "title": data.title,
        "description": data.description,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "timezone": data.timezone,
        "location": data.location,
        "interview_id": data.interview_id,
        "is_interview": data.interview_id is not None,
    })
    if not event:
        raise HTTPException(status_code=500, detail="Failed to create event")
    return {"success": True, "data": event}


@router.delete("/calendar/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    repo = _get_repo()
    repo.delete_event(event_id)
    return {"success": True}


@router.get("/calendar/ics/{user_id}")
async def export_ics(user_id: str):
    repo = _get_repo()
    events = repo.list_events(user_id)

    ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TalentIQ//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n"
    for event in events:
        start = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ")
        end = datetime.fromisoformat(event["end_time"].replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ")
        ics += f"BEGIN:VEVENT\nDTSTART:{start}\nDTEND:{end}\nSUMMARY:{event['title']}\n"
        if event.get("description"):
            ics += f"DESCRIPTION:{event['description']}\n"
        if event.get("location"):
            ics += f"LOCATION:{event['location']}\n"
        ics += f"UID:{event['id']}\nEND:VEVENT\n"
    ics += "END:VCALENDAR"

    return HTMLResponse(content=ics, media_type="text/calendar", headers={"Content-Disposition": "attachment; filename=talentiq-calendar.ics"})
