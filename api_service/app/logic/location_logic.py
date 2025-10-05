from app.models import Location
from app.data_access import LocationDAO

class LocationLogic:
    def create_location(location: Location):
        return LocationDAO.create_location(location)

    def get_location(location_id: int):
        return LocationDAO.get_location(location_id)

    def get_locations():
        return LocationDAO.get_locations()

    def update_location(location_id: int, location_data: dict):
        return LocationDAO.update_location(location_id, location_data)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)