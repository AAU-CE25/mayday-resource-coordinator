
from domain.schemas import UserCreate, UserResponse, UserUpdate, UserLogin
from ..models import User
from api_service.app.data_access import UserDAO

class UserLogic:
    def create_user(userCreate: UserCreate) -> UserResponse:
        new_user = User(
            **userCreate.model_dump(),
            status='available'
            )
        user = UserDAO.create_user(new_user)
        return UserResponse.model_validate(user)

    def get_user(user_id: int) -> UserResponse | None:
        user = UserDAO.get_user(user_id)
        if user:    
            return UserResponse.model_validate(user)
        return None

    def get_users(skip: int, limit: int, status: str | None = None) -> list[UserResponse]:
        users = UserDAO.get_users(skip, limit, status)
        result: list[UserResponse] = []
        for user in users:
            result.append(UserResponse.model_validate(user))
        return result

    def update_user(user_id: int, user_update: UserUpdate) -> UserResponse | None:
        _user = User(id=user_id, **user_update.model_dump())
        response_user= UserDAO.update_user(user_id, _user)
        if response_user:
            return UserResponse.model_validate(response_user)
        return None

    def delete_user(user_id: int):
        return UserDAO.delete_user(user_id)