from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from api_service.app.auth.role_checker import require_role



from domain.schemas import UserAdminUpdate, UserCreate, UserResponse, UserUpdate
from api_service.app.logic import UserLogic

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserResponse], dependencies=[Depends(require_role(["AUTHORITY", "VC"]))])
def read_users(
    skip: int = Query(0, ge=0, description="Number of rows to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of rows to return"),
    status: str | None = Query(None, description="Filter by status (available, assigned, unavailable)")
):
    return UserLogic.get_users(skip=skip, limit=limit, status=status)

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(["AUTHORITY", "VC", "SUV"]))])
def read_user(user_id: int):
    user = UserLogic.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(["AUTHORITY", "VC", "SUV"]))])
def update_user(user_id: int, user: UserUpdate):
    db_user = UserLogic.get_user(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.update_user(user_id, user)    

@router.put("/{user_id}/admin", response_model=UserResponse, dependencies=[Depends(require_role(["AUTHORITY", "VC"]))])
def update_user_admin(user_id: int, user: UserAdminUpdate):
    db_user = UserLogic.get_user(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.update_user(user_id, user)     

@router.delete("/{user_id}",dependencies=[Depends(require_role(["AUTHORITY"]))])
def delete_user(user_id: int):
    user = UserLogic.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserLogic.delete_user(user_id)