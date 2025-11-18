from fastapi import APIRouter
from domain.schemas import StatsResponse
from api_service.app.logic import StatsLogic

router = APIRouter(prefix="/stats")


@router.get("/", response_model=StatsResponse)
def get_stats():
	"""Return aggregated statistics for dashboard/monitoring."""
	return StatsLogic.get_stats()
