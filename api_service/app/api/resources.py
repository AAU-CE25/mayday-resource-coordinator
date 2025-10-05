from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models import ResourceAvailable, ResourceNeeded
from app.db import get_session

router = APIRouter(prefix="/resources", tags=["resources"])

# ResourceNeeded endpoints
@router.post("/needed/", response_model=ResourceNeeded)
def create_resource_needed(resource: ResourceNeeded, session: Session = Depends(get_session)):
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@router.get("/needed/", response_model=list[ResourceNeeded])
def read_resources_needed(session: Session = Depends(get_session)):
    resources = session.exec(select(ResourceNeeded)).all()
    return resources

@router.get("/needed/{resource_id}", response_model=ResourceNeeded)
def read_resource_needed(resource_id: int, session: Session = Depends(get_session)):
    resource = session.get(ResourceNeeded, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return resource

@router.put("/needed/{resource_id}", response_model=ResourceNeeded)
def update_resource_needed(resource_id: int, resource: ResourceNeeded, session: Session = Depends(get_session)):
    db_resource = session.get(ResourceNeeded, resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    for key, value in resource.dict(exclude_unset=True).items():
        setattr(db_resource, key, value)
    session.add(db_resource)
    session.commit()
    session.refresh(db_resource)
    return db_resource

@router.delete("/needed/{resource_id}")
def delete_resource_needed(resource_id: int, session: Session = Depends(get_session)):
    resource = session.get(ResourceNeeded, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    session.delete(resource)
    session.commit()
    return {"ok": True}

# ResourceAvailable endpoints
@router.post("/available/", response_model=ResourceAvailable)
def create_resource_available(resource: ResourceAvailable, session: Session = Depends(get_session)):
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@router.get("/available/", response_model=list[ResourceAvailable])
def read_resources_available(session: Session = Depends(get_session)):
    resources = session.exec(select(ResourceAvailable)).all()
    return resources

@router.get("/available/{resource_id}", response_model=ResourceAvailable)
def read_resource_available(resource_id: int, session: Session = Depends(get_session)):
    resource = session.get(ResourceAvailable, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return resource

@router.put("/available/{resource_id}", response_model=ResourceAvailable)
def update_resource_available(resource_id: int, resource: ResourceAvailable, session: Session = Depends(get_session)):
    db_resource = session.get(ResourceAvailable, resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    for key, value in resource.dict(exclude_unset=True).items():
        setattr(db_resource, key, value)
    session.add(db_resource)
    session.commit()
    session.refresh(db_resource)
    return db_resource

@router.delete("/available/{resource_id}")
def delete_resource_available(resource_id: int, session: Session = Depends(get_session)):
    resource = session.get(ResourceAvailable, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    session.delete(resource)
    session.commit()
    return {"ok": True}