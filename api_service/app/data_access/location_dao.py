from sqlmodel import Session, select
from app.models import Location
from app.db import engine

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
    def get_locations() -> list[Location]:
        """Retrieve all locations."""
        with Session(engine) as session:
            return session.exec(select(Location)).all()

    @staticmethod
    def update_location(location_id: int, location_data: dict) -> Location | None:
        """Update a location by ID."""
        with Session(engine) as session:
            location = session.get(Location, location_id)
            if not location:
                return None
            for key, value in location_data.items():
                setattr(location, key, value)
            session.add(location)
            session.commit()
            session.refresh(location)
            return location

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
