from domain.schemas import StatsResponse
from api_service.app.data_access import StatsDAO


class StatsLogic:
    def get_stats() -> StatsResponse:
        """Retrieve stats via the DAO and return a validated StatsResponse."""
        stats = StatsDAO.get_stats()
        # Validate/convert via domain schema for consistent shape
        return StatsResponse.model_validate(stats)
