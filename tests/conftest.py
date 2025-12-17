import os
import pytest
import sys
from pathlib import Path
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

# Ensure tests never depend on external Postgres creds
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

# Ensure admin bootstrap is present in CI (where .env may be absent)
os.environ.setdefault("ADMIN_EMAIL", "ci-admin@example.com")
os.environ.setdefault("ADMIN_PASSWORD", "ChangeMe_CI_123")
os.environ.setdefault("ADMIN_NAME", "CI Administrator")
os.environ.setdefault("ADMIN_PHONE", "0000000000")

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
from api_service.app.core.config import settings


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
        # Auto-login as seeded admin (if configured) and set default Authorization header
        admin_email = settings.ADMIN_EMAIL
        admin_password = settings.ADMIN_PASSWORD
        if admin_email and admin_password:
            resp = test_client.post("/auth/login", json={"email": admin_email, "password": admin_password})
            if resp.status_code == 200:
                token = resp.json().get("access_token")
                if token:
                    test_client.headers.update({"Authorization": f"Bearer {token}"})
        yield test_client

    app.dependency_overrides.clear()