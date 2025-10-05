from app.models import Volunteer
from app.data_access import VolunteerDAO

class VolunteerLogic:
    def create_volunteer(volunteer: Volunteer):
        return VolunteerDAO.create_volunteer(volunteer)

    def get_volunteer(volunteer_id: int):
        return VolunteerDAO.get_volunteer(volunteer_id)

    def get_volunteers():
        return VolunteerDAO.get_volunteers()

    def update_volunteer(volunteer_id: int, volunteer_data: dict):
        return VolunteerDAO.update_volunteer(volunteer_id, volunteer_data)

    def delete_volunteer(volunteer_id: int):
        return VolunteerDAO.delete_volunteer(volunteer_id)