from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.models.models import Volunteer
from app.core.database import get_session

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

@router.get(
    "/",
    response_model=List[Volunteer],
    summary="Get all volunteers",
    description="Retrieve all volunteers with optional filters by event or location"
)
def get_volunteers(
    skip: int = Query(0, ge=0, description="Number of volunteers to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of volunteers to return"),
    event_id: Optional[int] = Query(None, description="Filter by event ID"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    session: Session = Depends(get_session)
):
    query = select(Volunteer)
    if event_id:
        query = query.where(Volunteer.event_id == event_id)
    if location_id:
        query = query.where(Volunteer.location_id == location_id)
    return session.exec(query.offset(skip).limit(limit)).all()

@router.get(
    "/{volunteer_id}",
    response_model=Volunteer,
    summary="Get volunteer by ID",
    description="Retrieve volunteer information by their ID"
)
def get_volunteer(volunteer_id: int, session: Session = Depends(get_session)):
    volunteer = session.get(Volunteer, volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer

@router.post(
    "/",
    response_model=Volunteer,
    status_code=201,
    summary="Register volunteer",
    description="Create a new volunteer record"
)
def create_volunteer(volunteer: Volunteer, session: Session = Depends(get_session)):
    session.add(volunteer)
    session.commit()
    session.refresh(volunteer)
    return volunteer