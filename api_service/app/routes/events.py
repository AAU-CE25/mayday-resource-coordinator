from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from domain import EventCreate, EventResponse, EventUpdate
from api_service.app.logic import EventLogic

router = APIRouter(prefix="/events", tags=["events"])

@router.get(
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
    """
    Get events with optional filtering and pagination.
    
    - **skip**: Number of events to skip (for pagination)
    - **limit**: Maximum number of events to return
    - **priority**: Filter by priority level (1-5)
    - **status**: Filter by event status
    """

    events = EventLogic.get_events(skip=skip, limit=limit, priority=priority, status=status)
    return events

@router.get(
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
    """
    Get a specific event by ID.
    
    - **event_id**: The ID of the event to retrieve
    """
    event = EventLogic.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post(
    "/", 
    response_model=EventResponse,
    status_code=201,
    summary="Create new event",
    description="Create a new disaster event"
)
def create_event(event: EventCreate):
    """
    Create a new disaster event.
    
    - **location_id**: ID of the location where the event occurred
    - **description**: Detailed description of the event
    - **datetime**: When the event occurred
    - **priority**: Priority level (1-5, where 5 is highest)
    - **status**: Current status of the event
    """
    return EventLogic.create_event(event)

@router.put(
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
    """
    Update an existing disaster event.
    
    - **event_id**: The ID of the event to update
    - **location_id**: ID of the location where the event occurred
    - **description**: Detailed description of the event
    - **datetime**: When the event occurred
    - **priority**: Priority level (1-5, where 5 is highest)
    - **status**: Current status of the event
    """
    db_event = EventLogic.get_event(event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventLogic.update_event(event_id, event)

@router.delete(
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
    """
    Delete a disaster event.
    
    - **event_id**: The ID of the event to delete
    """
    event = EventLogic.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventLogic.delete_event(event_id)