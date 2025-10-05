from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models import Volunteer
from app.db import get_session

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

@router.post("/", response_model=Volunteer)
def create_volunteer(volunteer: Volunteer, session: Session = Depends(get_session)):
    session.add(volunteer)
    session.commit()
    session.refresh(volunteer)
    return volunteer

@router.get("/", response_model=list[Volunteer])
def read_volunteers(session: Session = Depends(get_session)):
    volunteers = session.exec(select(Volunteer)).all()
    return volunteers

@router.get("/{volunteer_id}", response_model=Volunteer)
def read_volunteer(volunteer_id: int, session: Session = Depends(get_session)):
    volunteer = session.get(Volunteer, volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer

@router.put("/{volunteer_id}", response_model=Volunteer)
def update_volunteer(volunteer_id: int, volunteer: Volunteer, session: Session = Depends(get_session)):
    db_volunteer = session.get(Volunteer, volunteer_id)
    if not db_volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    for key, value in volunteer.dict(exclude_unset=True).items():
        setattr(db_volunteer, key, value)
    session.add(db_volunteer)
    session.commit()
    session.refresh(db_volunteer)
    return db_volunteer

@router.delete("/{volunteer_id}")
def delete_volunteer(volunteer_id: int, session: Session = Depends(get_session)):
    volunteer = session.get(Volunteer, volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    session.delete(volunteer)
    session.commit()
    return {"ok": True}