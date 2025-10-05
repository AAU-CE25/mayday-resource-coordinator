from fastapi import APIRouter, HTTPException
from app.models import ResourceAvailable, ResourceNeeded
from app.logic import ResourceLogic

router = APIRouter(prefix="/resources", tags=["resources"])

# ResourceNeeded endpoints
@router.post("/needed/", response_model=ResourceNeeded)
def create_resource_needed(resource: ResourceNeeded):
    return ResourceLogic.create_resource_needed(resource)
  

@router.get("/needed/", response_model=list[ResourceNeeded])
def read_resources_needed():
    return ResourceLogic.get_resources_needed()

@router.get("/needed/{resource_id}", response_model=ResourceNeeded)
def read_resource_needed(resource_id: int):
    resource = ResourceLogic.get_resource_needed(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return resource

@router.put("/needed/{resource_id}", response_model=ResourceNeeded)
def update_resource_needed(resource_id: int, resource: ResourceNeeded):
    db_resource = ResourceLogic.get_resource_needed(resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    ResourceLogic.update_resource_needed(resource_id, resource.dict(exclude_unset=True))
    return db_resource

@router.delete("/needed/{resource_id}")
def delete_resource_needed(resource_id: int):
    resource = ResourceLogic.get_resource_needed(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return ResourceLogic.delete_resource_needed(resource_id)

# ResourceAvailable endpoints
@router.post("/available/", response_model=ResourceAvailable)
def create_resource_available(resource: ResourceAvailable):
    return ResourceLogic.create_resource_available(resource)

@router.get("/available/", response_model=list[ResourceAvailable])
def read_resources_available():
    return ResourceLogic.get_resources_available()

@router.get("/available/{resource_id}", response_model=ResourceAvailable)
def read_resource_available(resource_id: int):
    resource = ResourceLogic.get_resource_available(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return resource

@router.put("/available/{resource_id}", response_model=ResourceAvailable)
def update_resource_available(resource_id: int, resource: ResourceAvailable):
    db_resource = ResourceLogic.get_resource_available(resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return ResourceLogic.update_resource_available(resource_id, resource.dict(exclude_unset=True))

@router.delete("/available/{resource_id}")
def delete_resource_available(resource_id: int):
    resource = ResourceLogic.get_resource_available(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return ResourceLogic.delete_resource_available(resource_id)