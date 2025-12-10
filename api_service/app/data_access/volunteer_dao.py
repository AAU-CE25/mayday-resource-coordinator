from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from datetime import datetime

from api_service.app.models import Volunteer, User
from api_service.app.db import engine
from sqlmodel import select
from datetime import datetime

class VolunteerDAO:
    @staticmethod
    def refresh_user_status(user_id: int, session: Session | None = None) -> None:
        """Ensure the linked User.status reflects whether they have any active volunteers.

        If a session is provided, the update is performed on that session and not committed
        (caller should commit). If no session is provided, the method opens its own session
        and commits the change.
        """
        owns_session = False
        if session is None:
            session = Session(engine)
            owns_session = True

        try:
            user = session.get(User, user_id)
            if user:
                active = session.exec(
                    select(Volunteer).where(Volunteer.user_id == user_id, Volunteer.status == "active")
                ).first()

                if user.status == "unavailable":
                    desired_status = "unavailable"
                elif active:
                    desired_status = "assigned"
                else:
                    desired_status = "available"

                if user.status != desired_status:
                    user.status = desired_status
                    session.add(user)
                    if owns_session:
                        session.commit()
        finally:
            if owns_session:
                session.close()

    @staticmethod
    def create_volunteer(volunteer_data: Volunteer) -> Volunteer:
        with Session(engine) as session:
            # Set create_time for new volunteer
            volunteer_data.create_time = datetime.now()

            # Ensure new assignments are explicitly active unless caller provided a status
            if not volunteer_data.status:
                volunteer_data.status = "active"

            session.add(volunteer_data)

            # Flush so that the pending volunteer row is visible to subsequent SELECTs
            session.flush()

            # Recompute and set the user's status based on active assignments
            if volunteer_data.user_id:
                VolunteerDAO.refresh_user_status(volunteer_data.user_id, session)

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
                # Only update fields that were explicitly set and are not None
                for key, value in volunteer_update.model_dump(exclude_unset=True).items():
                    if key != "id" and value is not None:
                        setattr(existing, key, value)

                # Add the existing volunteer to the session to track changes
                session.add(existing)

                # If status is being set to 'completed', set completion_time
                if existing.status == "completed" and existing.completion_time is None:
                    existing.completion_time = datetime.now()

                # Always flush before refreshing user status so the changes are visible
                session.flush()

                # Recompute the linked user's status based on remaining active assignments
                if existing.user_id:
                    VolunteerDAO.refresh_user_status(existing.user_id, session)

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
    def complete_volunteer(volunteer_id: int) -> bool:
        """Mark a volunteer assignment completed (soft delete).

        This preserves an audit/log of all volunteer assignments. Sets the
        volunteer `status` to 'completed' and `completion_time` if not set.
        Also updates the linked user's `status` to 'available' when they have
        no other active assignments.
        """
        with Session(engine) as session:
            volunteer = session.get(Volunteer, volunteer_id)
            if not volunteer:
                return False

            # If already completed, nothing to change
            if volunteer.status == "completed":
                return True

            # Mark completed and set completion_time
            volunteer.status = "completed"
            if not volunteer.completion_time:
                volunteer.completion_time = datetime.now()
            session.add(volunteer)

            # Flush the change so queries see the volunteer as completed
            session.flush()

            # Recompute and set the user's status based on active assignments
            if volunteer.user_id:
                VolunteerDAO.refresh_user_status(volunteer.user_id, session)

            session.commit()
            return True

    @staticmethod
    def delete_volunteer(volunteer_id: int) -> bool:
        """Hard delete a volunteer by ID.
        
        Warning: This permanently removes the volunteer record from the database.
        Consider using complete_volunteer() instead to preserve audit history.
        """
        with Session(engine) as session:
            volunteer = session.get(Volunteer, volunteer_id)
            if not volunteer:
                return False
            session.delete(volunteer)
            session.commit()
            return True

    @staticmethod
    def complete_volunteers_for_event(event_id: int) -> int:
        """Mark all volunteers for an event as completed and set completion_time.

        Returns the number of rows updated.
        """
        with Session(engine) as session:
            # Fetch volunteers for event that are not already completed
            query = select(Volunteer).where(Volunteer.event_id == event_id)
            volunteers = session.exec(query).all()
            now = datetime.now()
            updated = 0
            for v in volunteers:
                if v.status != "completed":
                    v.status = "completed"
                    v.completion_time = now
                    session.add(v)
                    updated += 1

                    # For linked users, recompute status after this change
                    if v.user_id:
                        # Flush the change visibility then recompute
                        session.flush()
                        VolunteerDAO.refresh_user_status(v.user_id, session)

            if updated > 0:
                session.commit()
            return updated
