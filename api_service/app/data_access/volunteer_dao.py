from sqlmodel import Session, select

from api_service.app.models import Volunteer
from api_service.app.db import engine

class VolunteerDAO:
    @staticmethod
    def create_volunteer(volunteer: Volunteer) -> Volunteer:
        """Create and persist a new volunteer."""
        with Session(engine) as session:
            session.add(volunteer)
            session.commit()
            session.refresh(volunteer)
            return volunteer

    @staticmethod
    def get_volunteer(volunteer_id: int) -> Volunteer | None:
        """Retrieve a volunteer by ID."""
        with Session(engine) as session:
            return session.get(Volunteer, volunteer_id)

    @staticmethod
    def get_volunteers() -> list[Volunteer]:
        """Retrieve all volunteers."""
        with Session(engine) as session:
            return session.exec(select(Volunteer)).all()

    @staticmethod
    def update_volunteer(volunteer_id: int, volunteer_data: dict) -> Volunteer | None:
        """Update a volunteer by ID."""
        with Session(engine) as session:
            volunteer = session.get(Volunteer, volunteer_id)
            if not volunteer:
                return None
            for key, value in volunteer_data.items():
                setattr(volunteer, key, value)
            session.add(volunteer)
            session.commit()
            session.refresh(volunteer)
            return volunteer

    @staticmethod
    def delete_volunteer(volunteer_id: int) -> bool:
        """Delete a volunteer by ID."""
        with Session(engine) as session:
            volunteer = session.get(Volunteer, volunteer_id)
            if not volunteer:
                return False
            session.delete(volunteer)
            session.commit()
            return {"ok": True}
