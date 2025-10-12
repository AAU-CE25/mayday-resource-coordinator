from api_service.app.models import ResourceAvailable, ResourceNeeded
from api_service.app.data_access import ResourceDAO
from domain import ResourceNeededCreate

class ResourceLogic:
    def create_resource_needed(resource: ResourceNeededCreate):
        new_resource_needed = ResourceNeeded(
            name=resource.name,
            resource_type=resource.resource_type,
            description=resource.description,
            quantity=resource.quantity,
            is_fulfilled=resource.is_fulfilled,
            event_id=resource.event_id
        )
        return ResourceDAO.create_resource_needed(new_resource_needed)

    def get_resource_needed(resource_id: int):
        return ResourceDAO.get_resource_needed(resource_id)

    def get_resources_needed():
        return ResourceDAO.get_resources_needed()

    def update_resource_needed(resource_id: int, resource_data: dict):
        return ResourceDAO.update_resource_needed(resource_id, resource_data)

    def delete_resource_needed(resource_id: int):
        return ResourceDAO.delete_resource_needed(resource_id)

    def create_resource_available(resource: ResourceAvailable):
        return ResourceDAO.create_resource_available(resource)

    def get_resource_available(resource_id: int):
        return ResourceDAO.get_resource_available(resource_id)

    def get_resources_available():
        return ResourceDAO.get_resources_available()

    def update_resource_available(resource_id: int, resource_data: dict):
        return ResourceDAO.update_resource_available(resource_id, resource_data)

    def delete_resource_available(resource_id: int):
        return ResourceDAO.delete_resource_available(resource_id)