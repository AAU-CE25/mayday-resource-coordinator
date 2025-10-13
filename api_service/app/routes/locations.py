from fastapi import APIRouter, HTTPException

from api_service.app.logic import LocationLogic
from domain.schemas import LocationAddress, LocationGeocode, LocationCreate, LocationResponse, LocationUpdate

router = APIRouter(prefix="/locations", tags=["locations"])

@router.post("/address", response_model=LocationResponse)
def create_location(location: LocationAddress):
    _location = LocationCreate(address=location, source="address")
    return LocationLogic.create_location(_location)

@router.post("/geocode", response_model=LocationResponse)
def create_location(location: LocationGeocode):
    _location = LocationCreate(geocode=location, source="geocode")
    return LocationLogic.create_location(_location)

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