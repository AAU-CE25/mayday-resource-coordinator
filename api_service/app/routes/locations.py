from fastapi import APIRouter, HTTPException

from api_service.app.models import Location
from api_service.app.logic import LocationLogic
from domain.schemas import LocationCreate, LocationResponse, LocationUpdate

router = APIRouter(prefix="/locations", tags=["locations"])

@router.post("/", response_model=LocationResponse)
def create_location(location: LocationCreate):
    return LocationLogic.create_location(location)

@router.get("/", response_model=list[LocationResponse])
def read_locations():
    return LocationLogic.get_locations()

@router.get("/{location_id}", response_model=LocationResponse)
def read_location(location_id: int):
    location = LocationLogic.get_location(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.put("/{location_id}", response_model=LocationResponse)
def update_location(location_update: LocationUpdate):
    db_location = LocationLogic.get_location(location_update.id)
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    return LocationLogic.update_location(location_update)

@router.delete("/{location_id}")
def delete_location(location_id: int):
    location = LocationLogic.get_location(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return LocationLogic.delete_location(location_id)