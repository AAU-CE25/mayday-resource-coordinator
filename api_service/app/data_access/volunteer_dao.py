from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from datetime import datetime

from api_service.app.models import Volunteer
from api_service.app.db import engine

class VolunteerDAO:
    @staticmethod
    def create_volunteer(volunteer_data: Volunteer) -> Volunteer:
        with Session(engine) as session:
            # Set create_time for new volunteer
            volunteer_data.create_time = datetime.now()
            
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
    def get_volunteers(event_id: int = None, user_id: int = None, status: str = None, skip: int = 0, limit: int = 100) -> list[Volunteer]:
        """Retrieve all volunteers with optional filtering."""
        query = select(Volunteer)
        
        # Add conditional WHERE clauses for each filter parameter
        if event_id is not None:
            query = query.where(Volunteer.event_id == event_id)
        
        if user_id is not None:
            query = query.where(Volunteer.user_id == user_id)
        
        if status is not None:
            query = query.where(Volunteer.status == status)

        with Session(engine) as session:
            return session.exec(query.offset(skip).limit(limit)).all()

    @staticmethod
    def get_active_volunteers(event_id: int = None, skip: int = 0, limit: int = 100) -> list[Volunteer]:
        """Retrieve all active volunteers. Optionally filter by event_id."""
        query = select(Volunteer).where(Volunteer.status == "active")
        
        # Add event_id filter if provided
        if event_id is not None:
            query = query.where(Volunteer.event_id == event_id)

        with Session(engine) as session:
            return session.exec(query.offset(skip).limit(limit)).all()

    @staticmethod
    def update_volunteer(volunteer_update: Volunteer) -> Volunteer | None:
        """Update a volunteer by ID, handling database errors safely."""
        with Session(engine) as session:
            try:
                # Fetch the existing record first
                existing = session.get(Volunteer, volunteer_update.id)
                if not existing:
                    return None  # Volunteer not found; do not insert new row

                # Copy updated fields from input object
                # Use model_dump(exclude_unset=True) to only update fields that were explicitly set
                for key, value in volunteer_update.model_dump(exclude_unset=True).items():
                    if key != "id":
                        setattr(existing, key, value)

                # If status is being set to 'completed', set completion_time
                if volunteer_update.status == "completed" and existing.completion_time is None:
                    existing.completion_time = datetime.now()

                # Commit changes to database
                session.commit()
                session.refresh(existing)
                return existing

            except IntegrityError as e:
                session.rollback()
                err = f"Integrity error while updating volunteer {volunteer_update.id}: {e}"
                raise Exception(err) from e

            except Exception as ex:
                session.rollback()
                err = f"Database error while updating volunteer {volunteer_update.id}: {ex}"
                raise Exception(err) from ex

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
