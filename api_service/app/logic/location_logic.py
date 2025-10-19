from api_service.app.models import Location
from api_service.app.data_access import LocationDAO
from api_service.app.clients import OSMClient
from domain.schemas import LocationCreate, LocationResponse, LocationUpdate, LocationAddress

class LocationLogic:
    def create_location(location: LocationCreate) -> LocationResponse:
        # Check for existing location
        existing_location: Location | None = None
        if location.source == "address":
            full_address = ", ".join(
                filter(None, [location.address.street, location.address.city, location.address.postcode, location.address.country])
            )
            existing_location = LocationDAO.get_location_by_full_address(full_address)
        elif location.source == "geocode":
            existing_location = LocationDAO.get_location_by_coordinates(location.latitude, location.longitude)
        if existing_location:
            return LocationLogic.validate_location_response(existing_location)
        
        # Create new location if not found
        _location = LocationLogic.enhance_location(location)
        response_location = LocationDAO.create_location(_location)
        return LocationLogic.validate_location_response(response_location)

    def get_location(location_id: int) -> LocationResponse | None:
        response_location = LocationDAO.get_location(location_id)
        if response_location:
            return LocationLogic.validate_location_response(response_location)
        return None

    def get_location_by_coordinates(latitude: float, longitude: float) -> LocationResponse | None:
        response_location = LocationDAO.get_location_by_coordinates(latitude, longitude)
        if response_location:
            return LocationLogic.validate_location_response(response_location)
        return None

    def get_locations() -> list[LocationResponse]:
        location_list = LocationDAO.get_locations()
        result: list[LocationResponse]= []
        for loc in location_list:
            result.append(LocationLogic.validate_location_response(loc))

        return result

    def update_location(location_update: LocationUpdate) -> LocationResponse | None:
        _location = Location(
            **location_update.model_dump(),
            street=location_update.address.street,
            city=location_update.address.city,
            postcode=location_update.address.postcode,
            country=location_update.address.country
        )
        response_location = LocationDAO.update_location(_location)
        return LocationLogic.validate_location_response(response_location)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)
    
    @staticmethod
    def enhance_location(location: LocationCreate) -> Location:
        _location = location
        if location.source == "address" and location.address:
            _location.latitude, _location.longitude = LocationLogic.create_location_from_address(location.address)
            full_address = ", ".join(
                filter(None, [location.address.street, location.address.city, location.address.postcode, location.address.country])
            )
        elif location.source == "geocode" and location.latitude and location.longitude:
            _location.address = LocationLogic.create_address_from_location(location.latitude, location.longitude)
            full_address = ", ".join(
                filter(None, [_location.address.street, _location.address.city, _location.address.postcode, _location.address.country])
            )
        result : Location = Location(
            city=_location.address.city,
            country=_location.address.country,
            street=_location.address.street,
            postcode=_location.address.postcode,
            longitude=_location.longitude,
            latitude=_location.latitude,
            full_address=full_address
        )
        return result
    
    @staticmethod
    def validate_location_response(location: Location) -> LocationResponse:
        validated_address = LocationAddress(
            street=location.street,
            city=location.city,
            postcode=location.postcode,
            country=location.country
        )
        validated_location = LocationResponse(
            id=location.id,
            address=validated_address,
            latitude=location.latitude,
            longitude=location.longitude
        )
        return validated_location
    @staticmethod
    def create_location_from_address(address: LocationAddress) -> list[float]:
        full_address = ", ".join(
            filter(None, [address.street, address.city, address.postcode, address.country])
        )
        lat, lon = OSMClient.get_coordinates_from_address(full_address)
        if lat is not None and lon is not None:
            return [lat, lon]
        return [0.0, 0.0]

    @staticmethod
    def create_address_from_location(lat: float, lon: float) -> LocationAddress:
        raise NotImplementedError("Reverse geocoding not implemented yet.")