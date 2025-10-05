from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.models.models import ResourceAvailable
from app.core.database import get_session

router = APIRouter(prefix="/resources-available", tags=["resources-available"])

@router.get(
    "/",
    response_model=List[ResourceAvailable],
    summary="Get all available resources",
    description="Retrieve all available resources from volunteers with optional filtering"
)
def get_resources_available(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    is_allocated: Optional[bool] = Query(None, description="Filter by allocation status"),
    session: Session = Depends(get_session)
):
    query = select(ResourceAvailable)
    if resource_type:
        query = query.where(ResourceAvailable.resource_type == resource_type)
    if is_allocated is not None:
        query = query.where(ResourceAvailable.is_allocated == is_allocated)
    return session.exec(query.offset(skip).limit(limit)).all()

@router.get(
    "/{resource_id}",
    response_model=ResourceAvailable,
    summary="Get available resource by ID",
    description="Retrieve a specific available resource by its ID"
)
def get_resource_available(resource_id: int, session: Session = Depends(get_session)):
    resource = session.get(ResourceAvailable, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.post(
    "/",
    response_model=ResourceAvailable,
    status_code=201,
    summary="Add available resource",
    description="Add a new resource available from a volunteer"
)
def create_resource_available(resource: ResourceAvailable, session: Session = Depends(get_session)):
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource