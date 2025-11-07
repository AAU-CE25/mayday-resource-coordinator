from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from api_service.app.auth.role_checker import require_role



from domain.schemas import UserCreate, UserResponse, UserUpdate
from api_service.app.logic import UserLogic

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user_endpoint(userCreate: UserCreate):
    return UserLogic.create_user(userCreate)

@router.get("/", response_model=list[UserResponse])
def read_users(
    skip: int = Query(0, ge=0, description="Number of rows to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of rows to return")
):
    return UserLogic.get_users(skip=skip, limit=limit)

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