from fastapi import APIRouter, Depends
from domain.schemas import StatsResponse
from api_service.app.logic import StatsLogic
from api_service.app.auth.role_checker import require_role

router = APIRouter(prefix="/stats")


@router.get("/", response_model=StatsResponse, dependencies=[Depends(require_role(["AUTHORITY"]))])
def get_stats():
	"""Return aggregated statistics for dashboard/monitoring."""
	return StatsLogic.get_stats()
