
from domain.schemas import UserCreate
from api_service.app.data_access import UserDAO

class UserLogic:
    def create_user(userCreate: UserCreate):
        return UserDAO.create_user(userCreate)

    def get_user(user_id: int):
        return UserDAO.get_user(user_id)

    def get_users():
        return UserDAO.get_users()

    def update_user(user_id: int, user_data: dict):
        return UserDAO.update_user(user_id, user_data)

    def delete_user(user_id: int):
        return UserDAO.delete_user(user_id)