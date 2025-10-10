from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from api_service.app.models import Volunteer
from api_service.app.db import engine

class VolunteerDAO:
    @staticmethod
    def create_volunteer(volunteer_data: Volunteer) -> Volunteer:
        with Session(engine) as session:
             # Check if a volunteer with the same user already exists
            query = select(Volunteer).where(Volunteer.user_id == volunteer_data.user_id)
            existing_volunteer = session.exec(query).first()

            if existing_volunteer:
                # Return the existing user (avoid duplicates)
                return existing_volunteer           
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
        """Update a volunteer by ID, handling database errors safely."""
        with Session(engine) as session:
            try:
                # Fetch the existing record first
                existing = session.get(Volunteer, volunteer_update.id)
                if not existing:
                    return None  # Volunteer not found; do not insert new row

                # Copy updated fields from input object
                for key, value in volunteer_update.model_dump().items():
                    if key != "id" and value is not None:
                        setattr(existing, key, value)

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
                err =f"Database error while updating volunteer {volunteer_update.id}: {e}"
                raise Exception(err) from e

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
