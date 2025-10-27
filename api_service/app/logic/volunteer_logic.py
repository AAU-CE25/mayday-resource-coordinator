from domain.schemas import VolunteerCreate, VolunteerResponse, VolunteerUpdate, UserResponse
from ..models import Volunteer
from .user_logic import UserLogic
from api_service.app.data_access import VolunteerDAO

class VolunteerLogic:
    def create_volunteer(volunteerCreate: VolunteerCreate) -> VolunteerResponse:
        #returs existing if exists
        _existing_user: UserResponse = UserLogic.create_user(volunteerCreate.user)

        new_volunteer = Volunteer({
            **volunteerCreate.model_dump(exclude={"user"}),  # Exclude nested user data
            "user_id": _existing_user.id
        })
        volunteer = VolunteerDAO.create_volunteer(new_volunteer)
        return VolunteerResponse.model_validate({
            **volunteer.model_dump(),
            "user": _existing_user
        })

    def get_volunteer(volunteer_id: int) -> VolunteerResponse | None:
        response_volunteer = VolunteerDAO.get_volunteer(volunteer_id)
        if not response_volunteer:
            return None
        
        user : UserResponse= None
        # Load the associated location if it exists
        if response_volunteer.user_id:
            user = UserLogic.get_user(response_volunteer.user_id) 
        if not user:
            return None
        # Validate the event including nested user
        return VolunteerResponse.model_validate({
            **response_volunteer.model_dump(),  # Event fields
            "user": user.model_dump()
        })

    def get_volunteers(skip: int, limit: int) -> list[VolunteerResponse]:
        volunteers = VolunteerDAO.get_volunteers(skip, limit)
        result: list[VolunteerResponse] = []
        for volunteer in volunteers:
            result.append(VolunteerLogic.get_volunteer(volunteer.id))
        return result

    def update_volunteer(volunteer_update: VolunteerUpdate) -> VolunteerResponse | None:
        _volunteer = Volunteer(**volunteer_update.model_dump())
        response_volunteer = VolunteerDAO.update_volunteer(_volunteer)
        if response_volunteer:
            return VolunteerResponse.model_validate(response_volunteer)
        return None

    def delete_volunteer(volunteer_id: int):
        return VolunteerDAO.delete_volunteer(volunteer_id)
    