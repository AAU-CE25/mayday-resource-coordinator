from sqlmodel import Session, select

from api_service.app.models import Location
from api_service.app.db import engine

class LocationDAO:

    @staticmethod
    def create_location(location: Location) -> Location:
        """Create and persist a new location."""
        with Session(engine) as session:
            session.add(location)
            session.commit()
            session.refresh(location)
            return location


    @staticmethod
    def get_location(location_id: int) -> Location | None:
        """Retrieve a location by ID."""
        with Session(engine) as session:
            return session.get(Location, location_id)
        
    @staticmethod
    def get_location_by_coordinates(latitude: float, longitude: float) -> Location | None:
        """Retrieve a location by its coordinates."""
        with Session(engine) as session:
            query = select(Location).where(
                (Location.latitude == latitude) &
                (Location.longitude == longitude)
            )
            return session.exec(query).first()
        

    @staticmethod
    def get_locations() -> list[Location]:
        """Retrieve all locations."""
        with Session(engine) as session:
            return session.exec(select(Location)).all()

    @staticmethod
    def update_location(location_update: Location) -> Location | None:
        """Update an existing location by ID."""
        with Session(engine) as session:
            # Fetch the existing record first
            existing = session.get(Location, location_update.id)
            if not existing:
                return None  # Don't insert new row

            # Copy updated fields from input object
            for key, value in location_update.model_dump().items():
                if key != "id" and value is not None:
                    setattr(existing, key, value)

            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    @staticmethod
    def delete_location(location_id: int) -> bool:
        """Delete a location by ID."""
        with Session(engine) as session:
            location = session.get(Location, location_id)
            if not location:
                return False
            session.delete(location)
            session.commit()
            return  {"ok": True}
