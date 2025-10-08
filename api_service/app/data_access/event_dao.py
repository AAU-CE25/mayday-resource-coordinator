from sqlmodel import Session, select

from api_service.app.models import Event
from domain.schemas import EventCreate, EventResponse, EventUpdate
from api_service.app.db import engine

class EventDAO:
    @staticmethod
    def create_event(event_data: Event) -> Event:
        """Create and persist a new Event from an EventCreate object."""
        with Session(engine) as session:
            # Save and return the persisted event
            session.add(event_data)
            session.commit()
            session.refresh(event_data)
            return event_data

    @staticmethod
    def get_event(event_id: int) -> Event | None:
        """Retrieve an event by ID."""
        with Session(engine) as session:
            return session.get(Event, event_id)

    @staticmethod
    def get_events(skip, limit, priority, status) -> list[Event]:
        """Retrieve events."""
        query = select(Event)
    
        if priority:
            query = query.where(Event.priority == priority)
        if status:
            query = query.where(Event.status == status)
        with Session(engine) as session:
            return session.exec(query.offset(skip).limit(limit)).all()

    @staticmethod
    def update_event(event_update : Event) -> Event | None:
        """Update an event by ID."""
        with Session(engine) as session:
            # Fetch the existing record first
            existing = session.get(Event, event_update.id)
            if not existing:
                return None # Don't insert new row
            for key, value in event_update.model_dump().items():
                if key != "id" and value is not None:
                    setattr(existing, key, value)
        
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    @staticmethod
    def delete_event(event_id: int) -> bool:
        """Delete an event by ID."""
        with Session(engine) as session:
            event = session.get(Event, event_id)
            if not event:
                return False
            session.delete(event)
            session.commit()
            return True
