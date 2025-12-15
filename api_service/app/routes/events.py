from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from api_service.app.auth.role_checker import require_role
from domain import EventCreate, EventResponse, EventUpdate
from api_service.app.logic import EventLogic, IngestionLogic

router = APIRouter(prefix="/events", tags=["events"])

@router.get(
    "/", 
    response_model=list[EventResponse],
    summary="Get all events",
    description="Retrieve a list of all disaster events with optional filtering",
    response_description="List of events",
    dependencies=[Depends(require_role(["AUTHORITY"]))]
)
def get_events(
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of events to return"),
    priority: Optional[int] = Query(None, ge=1, le=5, description="Filter by priority level"),
    status: Optional[str] = Query(None, description="Filter by event status")
):
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
    },
    dependencies=[Depends(require_role(["AUTHORITY"]))]
)
def get_event(event_id: int):
    event = EventLogic.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post(
    "/", 
    response_model=EventResponse,
    status_code=201,
    summary="Create new event",
    description="Create a new disaster event",
    dependencies=[Depends(require_role(["AUTHORITY"]))]
)
def create_event(event: EventCreate):
    return EventLogic.create_event(event)

@router.put(
    "/{event_id}", 
    response_model=EventResponse,
    summary="Update event",
    description="Update an existing disaster event",
    responses={
        200: {"description": "Event updated"},
        404: {"description": "Event not found"}
    },
    dependencies=[Depends(require_role(["AUTHORITY"]))]
)
def update_event(event_id: int, event: EventUpdate):
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
    },
    dependencies=[Depends(require_role(["AUTHORITY"]))]
)
def delete_event(event_id: int):
    event = EventLogic.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventLogic.delete_event(event_id)

@router.post("/ingest", dependencies=[Depends(require_role(["AUTHORITY"]))])
def ingest_event(full_event: dict):
    try:
        # print(full_event)
        event_id = IngestionLogic.ingest_full_event(full_event)
        return {"message": "Event successfully ingested", "event_id": event_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
