import uuid

import pytest
from fastapi.testclient import TestClient

from api_service.app.main import app


@pytest.fixture
def health_client(client: TestClient):
    """Alias fixture for readability in health/connectivity tests."""
    return client


def test_health_endpoint_reports_database_ok(health_client: TestClient):
    response = health_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"database": "ok"}


def test_stats_endpoint_returns_expected_shape(health_client: TestClient):
    response = health_client.get("/stats/")
    assert response.status_code == 200
    data = response.json()
    for key in {"activeEvents", "totalVolunteers", "resourcesAvailable", "totalLocations"}:
        assert key in data
        assert isinstance(data[key], int)


def test_auth_register_and_login_flow(client: TestClient):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@test.com"
    register_payload = {
        "name": "Flow User",
        "email": unique_email,
        "phonenumber": "+4500000001",
        "password": "password123",
        "role": "SUV"
    }

    register_resp = client.post("/auth/register", json=register_payload)
    assert register_resp.status_code in (200, 201)
    created_user = register_resp.json()
    assert created_user["email"] == unique_email

    login_payload = {"email": unique_email, "password": "password123"}
    login_resp = client.post("/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token_payload = login_resp.json()
    assert token_payload["token_type"] == "bearer"
    assert isinstance(token_payload["access_token"], str) and token_payload["access_token"]


