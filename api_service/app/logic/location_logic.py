from api_service.app.models import Location
from api_service.app.data_access import LocationDAO
from api_service.app.clients import OSMClient
from domain.schemas import LocationCreate, LocationResponse, LocationUpdate, LocationAddress
from api_service.app.core.config import settings

class LocationLogic:
    def create_location(location: LocationCreate) -> LocationResponse:

        # Check for existing location
        if settings.REVERSE_GEOCODING_ENABLED:
            existing_location: Location | None = None
            if location.address:
                full_address = ", ".join(
                    filter(None, [location.address.street, location.address.city, location.address.postcode, location.address.country])
                )
                existing_location = LocationDAO.get_location_by_full_address(full_address)
            elif location.latitude is not None and location.longitude is not None:
                existing_location = LocationDAO.get_location_by_coordinates(location.latitude, location.longitude)
            if existing_location:
                return LocationLogic.validate_location_response(existing_location)
            
            # Create new location if not found
            _location = LocationLogic.enhance_location(location)
            response_location = LocationDAO.create_location(_location)
        else:
            # When reverse geocoding is disabled, address may be None.
            street = location.address.street if location.address else None
            city = location.address.city if location.address else None
            postcode = location.address.postcode if location.address else None
            country = location.address.country if location.address else None
            result = Location(
                street=street,
                city=city,
                postcode=postcode,
                country=country,
                latitude=location.latitude,
                longitude=location.longitude
            )
            response_location = LocationDAO.create_location(result)
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
        # address may be None on update
        street = location_update.address.street if location_update.address else None
        city = location_update.address.city if location_update.address else None
        postcode = location_update.address.postcode if location_update.address else None
        country = location_update.address.country if location_update.address else None
        _location = Location(
            **location_update.model_dump(),
            street=street,
            city=city,
            postcode=postcode,
            country=country
        )
        response_location = LocationDAO.update_location(_location)
        return LocationLogic.validate_location_response(response_location)

    def delete_location(location_id: int):
        return LocationDAO.delete_location(location_id)
    
    @staticmethod
    def enhance_location(location: LocationCreate) -> Location:
        # Normalize LocationCreate into a Location object. Address may be None.
        _location = location
        full_address = None
        if location.address:
            # derive lat/lon from address
            _location.latitude, _location.longitude = LocationLogic.create_location_from_address(location.address)
            full_address = ", ".join(
                filter(None, [location.address.street, location.address.city, location.address.postcode, location.address.country])
            )
        elif location.latitude is not None and location.longitude is not None:
            # attempt to create an address from coordinates; allowed to return None fields
            try:
                addr = LocationLogic.create_address_from_location(location.latitude, location.longitude)
            except NotImplementedError:
                addr = None
            _location.address = addr
            if addr:
                full_address = ", ".join(
                    filter(None, [addr.street, addr.city, addr.postcode, addr.country])
                )

        # Safe extraction of address fields (may be None)
        street = _location.address.street if _location.address else None
        city = _location.address.city if _location.address else None
        postcode = _location.address.postcode if _location.address else None
        country = _location.address.country if _location.address else None

        result : Location = Location(
            city=city,
            country=country,
            street=street,
            postcode=postcode,
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