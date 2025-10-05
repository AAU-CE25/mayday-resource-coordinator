from fastapi import APIRouter, HTTPException
from typing import List

from api_service.app.models import User
from domain.schemas import UserCreate
from api_service.app.logic import UserLogic

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=User)
def create_user_endpoint(userCreate: UserCreate):
    return UserLogic.create_user(userCreate)

@router.get("/", response_model=List[User])
def read_users():
    return UserLogic.get_users()

@router.get("/{user_id}", response_model=User)
def read_user(user_id: int):
    user = UserLogic.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
def update_user(user_id: int, user: User):
    db_user = UserLogic.get_user(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.update_user(user_id, user.dict(exclude_unset=True))    

@router.delete("/{user_id}")
def delete_user(user_id: int):
    user = UserLogic.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.delete_user(user_id)