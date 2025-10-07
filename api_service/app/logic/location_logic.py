from api_service.app.models import Location
from api_service.app.data_access import LocationDAO
from domain.schemas import LocationCreate, LocationResponse

class LocationLogic:
    def create_location(location: LocationCreate) -> LocationResponse:
        new_location = Location(
                region=location.region,
                address=location.address,
                postcode=location.postcode,
                longitude=location.longitude,
                latitude=location.latitude,
            )
        response_location = LocationDAO.create_location(new_location)
        validated_location = LocationResponse.model_validate(response_location)
        return validated_location

    def get_location(location_id: int):
        return LocationDAO.get_location(location_id)

    def get_locations():
        return LocationDAO.get_locations()

    def update_location(location_id: int, location_data: dict):
        return LocationDAO.update_location(location_id, location_data)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)