from fastapi import APIRouter

from app.api.routes import events, resource_available, resource_needed, volunteers, locations

api_router = APIRouter()
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(resource_needed.router, prefix="/resources-needed", tags=["resources-needed"])
api_router.include_router(resource_available.router, prefix="/resources-available", tags=["resources-available"])
api_router.include_router(volunteers.router, prefix="/volunteers", tags=["volunteers"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])