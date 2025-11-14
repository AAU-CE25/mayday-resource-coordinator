from fastapi import APIRouter, HTTPException, status
from domain.schemas import (
    ResourceNeededCreate,
    ResourceNeededResponse,
    ResourceNeededUpdate,
    ResourceAvailableCreate,
    ResourceAvailableResponse,
    ResourceAvailableUpdate,
)
from api_service.app.logic import ResourceLogic

router = APIRouter(prefix="/resources", tags=["resources"])

# ResourceNeeded endpoints
@router.post("/needed/", response_model=ResourceNeededResponse, status_code=status.HTTP_201_CREATED)
def create_resource_needed(resource: ResourceNeededCreate):
    return ResourceLogic.create_resource_needed(resource)

@router.get("/needed/", response_model=list[ResourceNeededResponse])
def read_resources_needed():
    return ResourceLogic.get_resources_needed()

@router.get("/needed/{resource_id}", response_model=ResourceNeededResponse)
def read_resource_needed(resource_id: int):
    resource = ResourceLogic.get_resource_needed(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return resource

@router.put("/needed/{resource_id}", response_model=ResourceNeededResponse)
def update_resource_needed(resource_id: int, resource: ResourceNeededUpdate):
    db_resource = ResourceLogic.get_resource_needed(resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    updated = ResourceLogic.update_resource_needed(resource_id, resource.model_dump(exclude_unset=True))
    return updated

@router.delete("/needed/{resource_id}")
def delete_resource_needed(resource_id: int):
    resource = ResourceLogic.get_resource_needed(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return ResourceLogic.delete_resource_needed(resource_id)

# ResourceAvailable endpoints
@router.post("/available/", response_model=ResourceAvailableResponse, status_code=status.HTTP_201_CREATED)
def create_resource_available(resource: ResourceAvailableCreate):
    return ResourceLogic.create_resource_available(resource)

@router.get("/available/", response_model=list[ResourceAvailableResponse])
def read_resources_available():
    return ResourceLogic.get_resources_available()

@router.get("/available/{resource_id}", response_model=ResourceAvailableResponse)
def read_resource_available(resource_id: int):
    resource = ResourceLogic.get_resource_available(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return resource

@router.put("/available/{resource_id}", response_model=ResourceAvailableResponse)
def update_resource_available(resource_id: int, resource: ResourceAvailableUpdate):
    db_resource = ResourceLogic.get_resource_available(resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    updated = ResourceLogic.update_resource_available(resource_id, resource.model_dump(exclude_unset=True))
    return updated

@router.delete("/available/{resource_id}")
def delete_resource_available(resource_id: int):
    resource = ResourceLogic.get_resource_available(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return ResourceLogic.delete_resource_available(resource_id)