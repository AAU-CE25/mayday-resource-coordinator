from api_service.app.models import Location
from api_service.app.data_access import LocationDAO
from api_service.app.clients import OSMClient
from domain.schemas import LocationCreate, LocationResponse, LocationUpdate, LocationAddress, LocationGeocode

class LocationLogic:
    def create_location(location: LocationCreate) -> LocationResponse:
        _location = LocationLogic.enhance_location(location)
        response_location = LocationDAO.create_location(_location)
        return LocationLogic.validate_location_responose(response_location)

    def get_location(location_id: int) -> LocationResponse | None:
        response_location = LocationDAO.get_location(location_id)
        if response_location:
            return LocationLogic.validate_location_responose(response_location)
        return None

    def get_locations() -> list[LocationResponse]:
        location_list = LocationDAO.get_locations()
        result: list[LocationResponse]= []
        for loc in location_list:
            result.append(LocationLogic.validate_location_responose(loc))

        return result

    def update_location(location_update: LocationUpdate) -> LocationResponse | None:
        _location = Location(**location_update.model_dump())
        response_location = LocationDAO.update_location(_location)
        return LocationResponse.model_validate(response_location)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)
    
    @staticmethod
    def enhance_location(location: LocationCreate) -> Location:
        _location = location
        if location.source == "address" and location.address:
            _location.geocode = LocationGeocode(latitude=55.6761, longitude=12.5683)  # Dummy coordinates for Copenhagen
        elif location.source == "geocode" and location.geocode:
            _location.address = LocationAddress(region="Dummy Region", address="Dummy Address", postcode="0000")  # Dummy address
        result : Location = Location(
            region=_location.address.city,
            address=_location.address.street,
            postcode=_location.address.postcode,
            longitude=_location.geocode.longitude,
            latitude=_location.geocode.latitude
        )
        return result
    
    @staticmethod
    def validate_location_response(location: Location) -> LocationResponse:
        validated_address = LocationAddress(
            street=location.address,
            city=location.address.city,
            postcode=location.address.postcode,
            country=location.address.country
        )
        validated_geocode = LocationGeocode(
            latitude=location.latitude,
            longitude=location.longitude
        )
        validated_location = LocationResponse(
            id=location.id,
            address=validated_address,
            geocode=validated_geocode
        )
        return validated_location
    @staticmethod
    def create_location_from_address(address: LocationAddress) -> LocationGeocode:
        full_address = ", ".join(
            filter(None, [address.street, address.city, address.state, address.country])
        )
        lat, lon = OSMClient.get_coordinates_from_address(full_address)
        return LocationGeocode(latitude=lat, longitude=lon)
    @staticmethod
    def create_address_from_location(geocode: LocationGeocode) -> LocationAddress:
        address = OSMClient.get_address_from_coordinates(geocode.latitude, geocode.longitude)
        return LocationAddress(
            street=address.get("road"),
            city=address.get("city") or address.get("town") or address.get("village"),
            state=address.get("state"),
            country=address.get("country")
        )