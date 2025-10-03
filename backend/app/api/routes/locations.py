from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models.models import Location
from app.database import get_session

router = APIRouter(prefix="/locations", tags=["locations"])

@router.post("/", response_model=Location)
def create_location(location: Location, session: Session = Depends(get_session)):
    session.add(location)
    session.commit()
    session.refresh(location)
    return location

@router.get("/", response_model=list[Location])
def read_locations(session: Session = Depends(get_session)):
    locations = session.exec(select(Location)).all()
    return locations

@router.get("/{location_id}", response_model=Location)
def read_location(location_id: int, session: Session = Depends(get_session)):
    location = session.get(Location, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.put("/{location_id}", response_model=Location)
def update_location(location_id: int, location: Location, session: Session = Depends(get_session)):
    db_location = session.get(Location, location_id)
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    for key, value in location.dict(exclude_unset=True).items():
        setattr(db_location, key, value)
    session.add(db_location)
    session.commit()
    session.refresh(db_location)
    return db_location

@router.delete("/{location_id}")
def delete_location(location_id: int, session: Session = Depends(get_session)):
    location = session.get(Location, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    session.delete(location)
    session.commit()
    return {"ok": True}