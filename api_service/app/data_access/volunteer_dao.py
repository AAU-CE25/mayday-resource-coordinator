from sqlmodel import Session, select

from api_service.app.models import Volunteer
from api_service.app.db import engine

class VolunteerDAO:
    @staticmethod
    def create_volunteer(volunteer_data: Volunteer) -> Volunteer:
        """Create and persist a new volunteer."""
        with Session(engine) as session:
            session.add(volunteer_data)
            session.commit()
            session.refresh(volunteer_data)
            return volunteer_data

    @staticmethod
    def get_volunteer(volunteer_id: int) -> Volunteer | None:
        """Retrieve a volunteer by ID."""
        with Session(engine) as session:
            return session.get(Volunteer, volunteer_id)

    @staticmethod
    def get_volunteers(skip, limit) -> list[Volunteer]:
        """Retrieve all volunteers."""
        query = select(Volunteer)

        with Session(engine) as session:
            return session.exec(query.offset(skip).limit(limit)).all()

    @staticmethod
    def update_volunteer(volunteer_update: Volunteer) -> Volunteer | None:
        """Update a volunteer by ID."""
        with Session(engine) as session:
           # Fetch the existing record first
            existing = session.get(Volunteer, volunteer_update.id)
            if not existing:
                return None  # Don't insert new row

            # Copy updated fields from input object
            for key, value in volunteer_update.model_dump().items():
                if key != "id" and value is not None:
                    setattr(existing, key, value)

            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    @staticmethod
    def delete_volunteer(volunteer_id: int) -> bool:
        """Delete a volunteer by ID."""
        with Session(engine) as session:
            volunteer = session.get(Volunteer, volunteer_id)
            if not volunteer:
                return False
            session.delete(volunteer)
            session.commit()
            return True
