from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from domain.schemas import VolunteerCreate, VolunteerResponse, VolunteerUpdate
from api_service.app.logic import VolunteerLogic

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

@router.post("/", response_model=VolunteerResponse)
def create_volunteer_endpoint(volunteerCreate: VolunteerCreate):
    return VolunteerLogic.create_volunteer(volunteerCreate)

"""@router.get("/active", response_model=list[VolunteerResponse])
def read_active_volunteers(
    event_id: Optional[int] = Query(None, description="Filter by event ID"),
    skip: int = Query(0, ge=0, description="Number of rows to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of rows to return")
):
    return VolunteerLogic.get_active_volunteers(event_id=event_id, skip=skip, limit=limit)"""

@router.get("/", response_model=list[VolunteerResponse])
def read_volunteers(
    event_id: Optional[int] = Query(None, description="Filter by event ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status (active, completed, cancelled)"),
    skip: int = Query(0, ge=0, description="Number of rows to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of rows to return")
):
    """
    Get volunteers with optional filtering.
    """
    return VolunteerLogic.get_volunteers(
        event_id=event_id,
        user_id=user_id,
        status=status,
        skip=skip,
        limit=limit
    )

@router.get("/{volunteer_id}", response_model=VolunteerResponse)
def read_volunteer(volunteer_id: int):
    volunteer = VolunteerLogic.get_volunteer(volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer

@router.put("/{volunteer_id}", response_model=VolunteerResponse)
def update_volunteer(volunteer: VolunteerUpdate):
    db_volunteer = VolunteerLogic.get_volunteer(volunteer.id)
    if not db_volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return VolunteerLogic.update_volunteer(volunteer)    

@router.delete("/{volunteer_id}")
def delete_volunteer(volunteer_id: int):
    volunteer = VolunteerLogic.get_volunteer(volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return VolunteerLogic.delete_volunteer(volunteer_id)