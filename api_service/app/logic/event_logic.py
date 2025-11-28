from datetime import datetime, timezone
from domain import EventCreate, EventResponse, EventUpdate, LocationResponse
from api_service.app.data_access import EventDAO
from logic import LocationLogic, VolunteerLogic
from ..models import Event


class EventLogic:
    def create_event(event: EventCreate) -> EventResponse:
        new_location = LocationLogic.create_location(event.location)
        now = datetime.now(timezone.utc)
            
        new_event = Event(
            #id will be auto-generated
            description=event.description,
            priority=event.priority,
            status=event.status,
            location_id=new_location.id,
            create_time = now,
            modified_time = now)

          # 3️⃣ Persist event and get the saved object
        response_event = EventDAO.create_event(new_event)

        # 4️⃣ Validate location separately (optional)
        validated_location = None
        if new_location:
            validated_location = LocationResponse.model_validate(new_location)

        # 5️⃣ Construct EventResponse including nested location
        validated_event = EventResponse.model_validate({
            **response_event.model_dump(),  # event fields
            "location": validated_location  # nested LocationResponse
        })

        return validated_event

    def get_event(event_id: int) -> EventResponse | None:
        response_event = EventDAO.get_event(event_id)
        if not response_event:
            return None
        
        location = None
        # Load the associated location if it exists
        if response_event.location_id:
            location = LocationLogic.get_location(response_event.location_id) 
        if not location:
            return None
        
        # Compute volunteers count for the event
        response_event.volunteers_count = len(VolunteerLogic.get_volunteers(event_id=event_id))

        # Validate the event including nested location
        return EventResponse.model_validate({
            **response_event.model_dump(),  # Event fields
            "location": location.model_dump()
        })

    def get_events(skip: int, limit: int, priority: int | None = None, status: str | None = None) -> list[EventResponse]:
        events = EventDAO.get_events(skip, limit, priority, status)
        result: list[EventResponse] = []
        for event in events:
            result.append(EventLogic.get_event(event.id))

        return result

    def update_event(event_update: EventUpdate) -> EventResponse | None:
        _event = Event(**event_update.model_dump())
        if event_update.location:
            # Update the location if location data is provided
            updated_location = LocationLogic.create_location(event_update.location)
            _event.location_id = updated_location.id
        
        return EventDAO.update_event(_event)

    def delete_event(event_id: int):
        return EventDAO.delete_event(event_id)