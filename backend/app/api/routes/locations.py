from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.models.models import Location
from app.core.database import get_session

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get(
    "/",
    response_model=List[Location],
    summary="Get all locations",
    description="Retrieve all registered locations with optional filters"
)
def get_locations(
    skip: int = Query(0, ge=0, description="Number of locations to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of locations to return"),
    region: Optional[str] = Query(None, description="Filter by region name"),
    postcode: Optional[str] = Query(None, description="Filter by postcode"),
    session: Session = Depends(get_session)
):
    query = select(Location)
    if region:
        query = query.where(Location.region == region)
    if postcode:
        query = query.where(Location.postcode == postcode)
    return session.exec(query.offset(skip).limit(limit)).all()

@router.get(
    "/{location_id}",
    response_model=Location,
    summary="Get location by ID",
    description="Retrieve details about a specific location"
)
def get_location(location_id: int, session: Session = Depends(get_session)):
    location = session.get(Location, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.post(
    "/",
    response_model=Location,
    status_code=201,
    summary="Add new location",
    description="Create a new location entry"
)
def create_location(location: Location, session: Session = Depends(get_session)):
    session.add(location)
    session.commit()
    session.refresh(location)
    return location