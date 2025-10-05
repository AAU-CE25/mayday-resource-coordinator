from app.models import ResourceAvailable, ResourceNeeded
from app.data_access import ResourceDAO

class ResourceLogic:
    def create_resource_needed(resource: ResourceNeeded):
        return ResourceDAO.create_resource_needed(resource)

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