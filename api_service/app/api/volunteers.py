from fastapi import APIRouter, HTTPException
from app.models import Volunteer

from app.logic import VolunteerLogic

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

@router.post("/", response_model=Volunteer)
def create_volunteer(volunteer: Volunteer):
    return VolunteerLogic.create_volunteer(volunteer)

@router.get("/", response_model=list[Volunteer])
def get_volunteers():
    return VolunteerLogic.get_volunteers()

@router.get("/{volunteer_id}", response_model=Volunteer)
def get_volunteer(volunteer_id: int):
    volunteer = VolunteerLogic.get_volunteer(volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer

@router.put("/{volunteer_id}", response_model=Volunteer)
def update_volunteer(volunteer_id: int, volunteer: Volunteer):
    db_volunteer = VolunteerLogic.get_volunteer(volunteer_id)
    if not db_volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return VolunteerLogic.update_volunteer(volunteer_id, volunteer.dict(exclude_unset=True))

@router.delete("/{volunteer_id}")
def delete_volunteer(volunteer_id: int):
    volunteer = VolunteerLogic.get_volunteer(volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return VolunteerLogic.delete_volunteer(volunteer_id)