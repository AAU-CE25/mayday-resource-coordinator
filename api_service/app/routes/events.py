from fastapi import APIRouter, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from typing import Optional, Set
from sqlalchemy.orm import Session
import json

from domain import EventCreate, EventResponse, EventUpdate
from api_service.app.logic import EventLogic, IngestionLogic
from api_service.app.models import Event
from ..db import get_session as get_db

# Create two routers: one for /events endpoints, one for /ws/events
event_router = APIRouter(prefix="/events", tags=["events"])
ws_router = APIRouter(tags=["websocket"])

# Store active WebSocket connections
active_connections: Set[WebSocket] = set()

# WebSocket endpoint at /ws/events (not under /events prefix)
@ws_router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

# Helper to broadcast event updates to all connected clients
async def broadcast_event_update(event_data: dict):
    """Broadcast new/updated event to all connected WebSocket clients"""
    disconnected = set()
    for connection in active_connections:
        try:
            await connection.send_json(event_data)
        except Exception:
            disconnected.add(connection)
    
    # Remove dead connections
    for connection in disconnected:
        active_connections.discard(connection)

@event_router.get(
    "/", 
    response_model=list[EventResponse],
    summary="Get all events",
    description="Retrieve a list of all disaster events with optional filtering",
    response_description="List of events"
)
def get_events(
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of events to return"),
    priority: Optional[int] = Query(None, ge=1, le=5, description="Filter by priority level"),
    status: Optional[str] = Query(None, description="Filter by event status")
):
    events = EventLogic.get_events(skip=skip, limit=limit, priority=priority, status=status)
    return events

@event_router.get(
    "/{event_id}", 
    response_model=EventResponse,
    summary="Get event by ID",
    description="Retrieve a specific event by its ID",
    responses={
        200: {"description": "Event found"},
        404: {"description": "Event not found"}
    }
)
def get_event(event_id: int):
    event = EventLogic.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@event_router.post(
    "/", 
    response_model=EventResponse,
    status_code=201,
    summary="Create new event",
    description="Create a new disaster event"
)
def create_event(event: EventCreate):
    new_event = EventLogic.create_event(event)
    # Broadcast to WebSocket clients
    import asyncio
    try:
        asyncio.run(broadcast_event_update({"id": new_event.id, "description": new_event.description}))
    except:
        pass  # WebSocket broadcast failed, but event still created
    return new_event

@event_router.put(
    "/{event_id}", 
    response_model=EventResponse,
    summary="Update event",
    description="Update an existing disaster event",
    responses={
        200: {"description": "Event updated"},
        404: {"description": "Event not found"}
    }
)
def update_event(event_id: int, event: EventUpdate):
    db_event = EventLogic.get_event(event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventLogic.update_event(event_id, event)

@event_router.delete(
    "/{event_id}", 
    status_code=204,
    summary="Delete event",
    description="Delete a disaster event",
    responses={
        204: {"description": "Event deleted"},
        404: {"description": "Event not found"}
    }
)
def delete_event(event_id: int):
    event = EventLogic.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventLogic.delete_event(event_id)

@event_router.post("/ingest")
def ingest_event(full_event: dict):
    try:
        # print(full_event)
        event_id = IngestionLogic.ingest_full_event(full_event)
        return {"message": "Event successfully ingested", "event_id": event_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# At the bottom of file, export both routers
# router = [event_router]   Keep for backward compatibility
__all__ = ["event_router", "ws_router"]
