import os
import pytest
import sys
from pathlib import Path
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

# Ensure tests never depend on external Postgres creds
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from api_service.app import db
from api_service.app.data_access import (
    user_dao,
    event_dao,
    location_dao,
    resource_dao,
    stats_dao,
    volunteer_dao,
)
from api_service.app.main import app


@pytest.fixture(scope="function")
def db_session(monkeypatch):
    """Create a fresh in-memory database for each test and point the app to it."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    # Point all DAO code to the in-memory engine
    monkeypatch.setattr(db, "engine", engine)
    for dao_module in (
        user_dao,
        event_dao,
        location_dao,
        resource_dao,
        stats_dao,
        volunteer_dao,
    ):
        monkeypatch.setattr(dao_module, "engine", engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with isolated database session"""

    def get_session_override():
        return db_session

    app.dependency_overrides[db.get_session] = get_session_override

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()