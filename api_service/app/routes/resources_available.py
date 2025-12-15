from fastapi import APIRouter, HTTPException, status, Depends
from api_service.app.auth.role_checker import require_role
from domain.schemas import (
    ResourceAvailableCreate,
    ResourceAvailableResponse,
    ResourceAvailableUpdate,
)
from api_service.app.logic import ResourceLogic

router = APIRouter(prefix="/resources/available", tags=["resources_available"])


@router.post("/", response_model=ResourceAvailableResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["AUTHORITY"]))])
def create_resource_available(resource: ResourceAvailableCreate):
    return ResourceLogic.create_resource_available(resource)


@router.get("/", response_model=list[ResourceAvailableResponse], dependencies=[Depends(require_role(["AUTHORITY"]))])
def read_resources_available():
    return ResourceLogic.get_resources_available()


@router.get("/{resource_id}", response_model=ResourceAvailableResponse, dependencies=[Depends(require_role(["AUTHORITY"]))])
def read_resource_available(resource_id: int):
    resource = ResourceLogic.get_resource_available(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return resource


@router.put("/{resource_id}", response_model=ResourceAvailableResponse, dependencies=[Depends(require_role(["AUTHORITY"]))])
def update_resource_available(resource_id: int, resource: ResourceAvailableUpdate):
    db_resource = ResourceLogic.get_resource_available(resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    updated = ResourceLogic.update_resource_available(resource_id, resource.model_dump(exclude_unset=True))
    return updated


@router.delete("/{resource_id}", dependencies=[Depends(require_role(["AUTHORITY"]))])
def delete_resource_available(resource_id: int):
    resource = ResourceLogic.get_resource_available(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="ResourceAvailable not found")
    return ResourceLogic.delete_resource_available(resource_id)
