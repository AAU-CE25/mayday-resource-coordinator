from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import timedelta

from api_service.app.db import get_session
from api_service.app.models import User
from api_service.app.auth.hashing import hash_password, verify_password
from api_service.app.auth.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register_user(name: str, email: str, password: str, role: str = "SUV", session: Session = Depends(get_session)):
    # Check if user already exists
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

     # Hash password
    hashed_pw = hash_password(password)

    # Create user object and save
    new_user = User(name=name, email=email, password=hashed_pw, role=role)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User registered successfully", "id": new_user.id}

@router.post("/login")
def login_user(email: str, password: str, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "role": user.role}, timedelta(minutes=60))
    return {"access_token": token, "token_type": "bearer"}
