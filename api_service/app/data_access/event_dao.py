from sqlmodel import Session, select

from api_service.app.models import Event
from domain.schemas import EventCreate, EventResponse, EventUpdate
from api_service.app.db import engine

class EventDAO:
    @staticmethod
    def create_event(event_data: EventCreate) -> Event:
        """Create and persist a new Event from an EventCreate object."""
        with Session(engine) as session:
            # Get the maximum ID or default to 0
            max_id = session.exec(select(Event.id).order_by(Event.id.desc())).first() or 0
            
            # Create the new Event object
            new_event = Event(
                id=max_id + 1,
                description=event_data.description,
                datetime=event_data.datetime,
                priority=event_data.priority,
                status=event_data.status,
                location_id=event_data.location_id,
            )

            # Save and return the persisted event
            session.add(new_event)
            session.commit()
            session.refresh(new_event)
            return new_event

    @staticmethod
    def get_event(event_id: int) -> EventResponse | None:
        """Retrieve an event by ID."""
        with Session(engine) as session:
            return session.get(Event, event_id)

    @staticmethod
    def get_events(query, skip, limit, priority, status) -> list[EventResponse]:
        """Retrieve events."""
        query = select(Event)
    
        if priority:
            query = query.where(Event.priority == priority)
        if status:
            query = query.where(Event.status == status)
        with Session(engine) as session:
            return session.exec(query.offset(skip).limit(limit)).all()

    @staticmethod
    def update_event(event_id: int, event_data: dict) -> EventResponse | None:
        """Update an event by ID."""
        with Session(engine) as session:
            event = session.get(Event, event_id)
            if not event:
                return None
            for key, value in event_data.items():
                setattr(event, key, value)
            session.add(event)
            session.commit()
            session.refresh(event)
            return event

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
