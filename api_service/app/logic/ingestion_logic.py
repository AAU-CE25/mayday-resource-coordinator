from domain import EventCreate, ResourceNeededCreate, LocationCreate
from .resource_logic import ResourceLogic
from .event_logic import EventLogic

class IngestionLogic:
    def ingest_full_event(full_event: dict) -> int:

        # Extract location and resources needed data from full event
        location_data = full_event["event"]["location"]
        resources_needed_data = full_event["event"].get("resources_needed", [])

        # Create event
        event = EventCreate(
            description=full_event["event"]["description"],
            priority=full_event["event"]["priority"],
            status=full_event["event"]["status"],
            location=LocationCreate().model_validate(location_data)
        )
        event_validated = EventLogic.create_event(event)

        # Create resources needed
        for r in resources_needed_data:
            r["event_id"] = event_validated.id
            resource_needed_validated = ResourceNeededCreate.model_validate(r)
            print(resource_needed_validated)
            ResourceLogic.create_resource_needed(resource_needed_validated)

        return event_validated.id