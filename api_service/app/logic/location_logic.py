from api_service.app.models import Location
from api_service.app.data_access import LocationDAO
from domain.schemas import LocationCreate, LocationResponse, LocationUpdate

class LocationLogic:
    def create_location(location: LocationCreate) -> LocationResponse:
        new_location = Location(
                **location.model_dump()
            )
        response_location = LocationDAO.create_location(new_location)
        validated_location = LocationResponse.model_validate(response_location)
        return validated_location

    def get_location(location_id: int) -> LocationResponse | None:
        response_location = LocationDAO.get_location(location_id)
        if response_location:
            return LocationResponse.model_validate(response_location)
        return None

    def get_locations() -> list[LocationResponse]:
        location_list = LocationDAO.get_locations()
        result: list[LocationResponse]= []
        for loc in location_list:
            result.append(LocationResponse.model_validate(loc))

        return result

    def update_location(location_update: LocationUpdate) -> LocationResponse | None:
        _location = Location(**location_update.model_dump())
        response_location = LocationDAO.update_location(_location)
        return LocationResponse.model_validate(response_location)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)