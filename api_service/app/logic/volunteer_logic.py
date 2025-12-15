from domain.schemas import VolunteerCreate, VolunteerResponse, VolunteerUpdate, UserResponse
from ..models import Volunteer
from .user_logic import UserLogic
from api_service.app.data_access import VolunteerDAO

class VolunteerLogic:
    def create_volunteer(volunteerCreate: VolunteerCreate) -> VolunteerResponse:
        # Create the volunteer with the provided user_id
        new_volunteer = Volunteer(**volunteerCreate.model_dump())
        volunteer = VolunteerDAO.create_volunteer(new_volunteer)
        
        # Fetch the user for the response
        user = UserLogic.get_user(volunteer.user_id)
        if not user:
            raise ValueError(f"User with id {volunteer.user_id} not found")
        
        return VolunteerResponse.model_validate({
            **volunteer.model_dump(),
            "user": user
        })

    def get_volunteer(volunteer_id: int) -> VolunteerResponse | None:
        response_volunteer = VolunteerDAO.get_volunteer(volunteer_id)
        if not response_volunteer:
            return None
        
        user : UserResponse= None
        # Load the associated user if it exists
        if response_volunteer.user_id:
            user = UserLogic.get_user(response_volunteer.user_id) 
        if not user:
            return None
        # Validate the volunteer including nested user
        return VolunteerResponse.model_validate({
            **response_volunteer.model_dump(),  # Volunteer fields
            "user": user.model_dump()
        })
        return response_volunteer


    def get_volunteers(event_id: int = None, user_id: int = None, status: str = None, skip: int = 0, limit: int = 100) -> list[VolunteerResponse]:
        """Get volunteers with optional filtering by event_id, user_id, and status."""
        volunteers = VolunteerDAO.get_volunteers(
            event_id=event_id,
            user_id=user_id,
            status=status,
            skip=skip,
            limit=limit
        )
        result: list[VolunteerResponse] = []
        for volunteer in volunteers:
            result.append(VolunteerLogic.get_volunteer(volunteer.id))
        return result

    def get_active_volunteers(event_id: int = None, skip: int = 0, limit: int = 100) -> list[VolunteerResponse]:
        """Get all volunteers with status='active'. Optionally filter by event_id."""
        volunteers = VolunteerDAO.get_active_volunteers(event_id=event_id, skip=skip, limit=limit)
        result: list[VolunteerResponse] = []
        for volunteer in volunteers:
            result.append(VolunteerLogic.get_volunteer(volunteer.id))
        return result

    def update_volunteer(volunteer_update: VolunteerUpdate) -> VolunteerResponse | None:
        _volunteer = Volunteer(**volunteer_update.model_dump())
        response_volunteer = VolunteerDAO.update_volunteer(_volunteer)
        if not response_volunteer:
            return None
        
        # Fetch the user for the response
        user = UserLogic.get_user(response_volunteer.user_id)
        if not user:
            return None
        
        return VolunteerResponse.model_validate({
            **response_volunteer.model_dump(),
            "user": user
        })

    def delete_volunteer(volunteer_id: int):
        return VolunteerDAO.delete_volunteer(volunteer_id)
    