from fastapi import Depends
from sqlmodel import Session
from database import get_session

def get_db() -> Session:
    return Depends(get_session)