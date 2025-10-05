from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.models.models import ResourceNeeded
from app.core.database import get_session

router = APIRouter(prefix="/resources-needed", tags=["resources-needed"])

@router.get(
    "/",
    response_model=List[ResourceNeeded],
    summary="Get all needed resources",
    description="Retrieve all resources needed for events, with optional filtering by event or fulfillment status"
)
def get_resources_needed(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    event_id: Optional[int] = Query(None, description="Filter by event ID"),
    is_fulfilled: Optional[bool] = Query(None, description="Filter by fulfillment status"),
    session: Session = Depends(get_session)
):
    query = select(ResourceNeeded)
    if event_id:
        query = query.where(ResourceNeeded.event_id == event_id)
    if is_fulfilled is not None:
        query = query.where(ResourceNeeded.is_fulfilled == is_fulfilled)
    return session.exec(query.offset(skip).limit(limit)).all()

@router.get(
    "/{resource_id}",
    response_model=ResourceNeeded,
    summary="Get needed resource by ID",
    description="Retrieve a specific needed resource by its ID"
)
def get_resource_needed(resource_id: int, session: Session = Depends(get_session)):
    resource = session.get(ResourceNeeded, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.post(
    "/",
    response_model=ResourceNeeded,
    status_code=201,
    summary="Create needed resource",
    description="Create a new needed resource entry"
)
def create_resource_needed(resource: ResourceNeeded, session: Session = Depends(get_session)):
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource