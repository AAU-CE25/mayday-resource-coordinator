from domain import EventCreate, EventResponse
from api_service.app.data_access import EventDAO

class EventLogic:
    def create_event(event: EventCreate) -> EventResponse:
        return EventDAO.create_event(event)

    def get_event(event_id: int) -> EventResponse | None:
        return EventDAO.get_event(event_id)

    def get_events(skip, limit, priority, status) -> list[EventResponse]:
        return EventDAO.get_events(skip, limit, priority, status)

    def update_event(event_id: int, event_data: dict) -> EventResponse | None:
        return EventDAO.update_event(event_id, event_data)

    def delete_event(event_id: int):
        return EventDAO.delete_event(event_id)