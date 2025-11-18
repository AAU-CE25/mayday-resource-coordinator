import pytest
import sys
from pathlib import Path
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from api_service.app.main import app
from api_service.app.db import get_session

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh in-memory database for each test"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session

@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with isolated database session"""
    def get_session_override():
        return db_session
    
    app.dependency_overrides[get_session] = get_session_override
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()