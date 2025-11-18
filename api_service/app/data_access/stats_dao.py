from sqlmodel import Session, select
from sqlalchemy import func

from api_service.app.db import engine
from api_service.app.models import Event, Volunteer, ResourceAvailable, Location


class StatsDAO:
    @staticmethod
    def get_stats() -> dict:
        """Return aggregated stats used by the frontend dashboard."""
        with Session(engine) as session:
            # active events are those with status active or pending (matches frontend filter)
            active_events = session.exec(
                select(func.count()).select_from(Event).where(Event.status.in_(["active"]))
            ).one()

            total_volunteers = session.exec(
                select(func.count()).select_from(Volunteer)
            ).one()

            resources_sum = session.exec(
                select(func.sum(ResourceAvailable.quantity))
            ).one()
            if resources_sum is None:
                resources_sum = 0

            total_locations = session.exec(
                select(func.count()).select_from(Location)
            ).one()

        return {
            "activeEvents": int(active_events),
            "totalVolunteers": int(total_volunteers),
            "resourcesAvailable": int(resources_sum),
            "totalLocations": int(total_locations),
        }
