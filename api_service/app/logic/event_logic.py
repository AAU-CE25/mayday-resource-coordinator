from datetime import datetime, timezone

from domain import EventCreate, EventResponse, LocationResponse
from api_service.app.data_access import EventDAO
from .location_logic import LocationLogic
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
        return EventDAO.get_event(event_id)

    def get_events(skip, limit, priority, status) -> list[EventResponse]:
        return EventDAO.get_events(skip, limit, priority, status)

    def update_event(event_id: int, event_data: dict) -> EventResponse | None:
        return EventDAO.update_event(event_id, event_data)

    def delete_event(event_id: int):
        return EventDAO.delete_event(event_id)