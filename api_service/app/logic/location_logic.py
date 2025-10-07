from api_service.app.models import Location
from api_service.app.data_access import LocationDAO
from domain.schemas import LocationCreate, LocationResponse, LocationUpdate

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

    def get_location(location_id: int) -> LocationResponse | None:
        response_location = LocationDAO.get_location(location_id)
        return LocationResponse.model_validate(response_location)

    def get_locations():
        return LocationDAO.get_locations()

    def update_location(location_update: LocationUpdate) -> LocationResponse | None:
        _location = Location(**location_update.model_dump())
        response_location = LocationDAO.update_location(_location)
        return LocationResponse.model_validate(response_location)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)