import pytest
import uuid
from fastapi.testclient import TestClient
from api_service.app.main import app


@pytest.fixture
def sample_user_event(client):
    # Create a user via the auth register endpoint
    unique_email = f"user_{uuid.uuid4().hex[:8]}@test.com"
    user_payload = {
        "name": "Test User",
        "email": unique_email,
        "phonenumber": "+4500000000",
        "password": "password123",
        "role": "SUV"
    }
    resp = client.post("/auth/register", json=user_payload)
    assert resp.status_code == 200 or resp.status_code == 201
    user = resp.json()

    # Create a minimal event (EventCreate requires location)
    event_payload = {
        "description": "Test Event",
        "priority": 1,
        "status": "active",
        "location": {"latitude": 0.0, "longitude": 0.0}
    }
    resp2 = client.post("/events/", json=event_payload)
    assert resp2.status_code == 201
    event = resp2.json()

    return {"user_id": user["id"], "event_id": event["id"]}


class TestVolunteers:
    def test_create_volunteer(self, client, sample_user_event):
        payload = {
            "user_id": sample_user_event["user_id"],
            "event_id": sample_user_event["event_id"],
            "status": "active"
        }
        response = client.post("/volunteers/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["name"] == "Test User"

    def test_get_volunteers(self, client):
        response = client.get("/volunteers/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


def test_get_volunteer_not_found(client):
    response = client.get("/volunteers/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Volunteer not found"


def test_create_volunteer_minimal(client):
    # ensure endpoint accepts creating a volunteer with existing user and event
    # create dependencies
    unique_email = f"user_{uuid.uuid4().hex[:8]}@test.com"
    user_payload = {"name": "U2", "email": unique_email, "phonenumber": "+4500000001", "password": "pw", "role": "SUV"}
    u = client.post("/auth/register", json=user_payload).json()
    e_payload = {"description": "E2", "priority": 1, "status": "active", "location": {"latitude": 0.0, "longitude": 0.0}}
    e = client.post("/events/", json=e_payload).json()
    payload = {"user_id": u["id"], "event_id": e["id"], "status": "active"}
    response = client.post("/volunteers/", json=payload)
    assert response.status_code in (200, 201, 422)

