from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import timedelta

from api_service.app.db import get_session
from api_service.app.models import User
from api_service.app.auth.hashing import hash_password, verify_password
from api_service.app.auth.jwt_handler import create_access_token, decode_access_token
from api_service.app.auth.jwt_bearer import JWTBearer
from api_service.app.logic import UserLogic
from domain.schemas import UserResponse, UserCreate, UserLogin, UserToken
from domain.exceptions import UserExistsException

router = APIRouter(prefix="/auth", tags=["Auth"])
jwt_bearer = JWTBearer()

def get_current_user(token: str = Depends(jwt_bearer), session: Session = Depends(get_session)) -> User:
    """
    Dependency to get the current authenticated user from JWT token
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate):
    # Hash password
    user.password = hash_password(user.password)
    # Check if user already exists
    try:
        return UserLogic.create_user(user)
    except UserExistsException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=UserToken)
def login_user(user_login: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == user_login.email)).first()
    if not user or not verify_password(user_login.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "role": user.role}, timedelta(minutes=60))
    return UserToken(access_token=token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's information
    """
    return current_user
