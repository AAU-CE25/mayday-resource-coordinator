from fastapi import APIRouter, HTTPException, status
from domain.schemas import (
    ResourceNeededCreate,
    ResourceNeededResponse,
    ResourceNeededUpdate,
)
from api_service.app.logic import ResourceLogic

router = APIRouter(prefix="/resources/needed", tags=["resources_needed"])


@router.post("/", response_model=ResourceNeededResponse, status_code=status.HTTP_201_CREATED)
def create_resource_needed(resource: ResourceNeededCreate):
    return ResourceLogic.create_resource_needed(resource)


@router.get("/", response_model=list[ResourceNeededResponse])
def read_resources_needed():
    return ResourceLogic.get_resources_needed()


@router.get("/{resource_id}", response_model=ResourceNeededResponse)
def read_resource_needed(resource_id: int):
    resource = ResourceLogic.get_resource_needed(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return resource


@router.put("/{resource_id}", response_model=ResourceNeededResponse)
def update_resource_needed(resource_id: int, resource: ResourceNeededUpdate):
    db_resource = ResourceLogic.get_resource_needed(resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    updated = ResourceLogic.update_resource_needed(resource_id, resource.model_dump(exclude_unset=True))
    return updated


@router.delete("/{resource_id}")
def delete_resource_needed(resource_id: int):
    resource = ResourceLogic.get_resource_needed(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceNeeded not found")
    return ResourceLogic.delete_resource_needed(resource_id)
