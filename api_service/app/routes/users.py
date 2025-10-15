from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from api_service.app.auth.role_checker import require_role



from domain.schemas import UserCreate, UserResponse, UserUpdate
from api_service.app.logic import UserLogic

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(["AUTHORITY"]))])
def read_user(user_id: int):
    user = UserLogic.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(["AUTHORITY"]))])
def update_user(user: UserUpdate):
    db_user = UserLogic.get_user(user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.update_user(user)    

@router.delete("/{user_id}",dependencies=[Depends(require_role(["AUTHORITY"]))])
def delete_user(user_id: int):
    user = UserLogic.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.delete_user(user_id)