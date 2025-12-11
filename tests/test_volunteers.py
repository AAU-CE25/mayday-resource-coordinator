import uuid

import pytest


@pytest.fixture
def created_user_id(client):
    unique_email = f"volunteer_{uuid.uuid4().hex[:8]}@test.com"
    payload = {
        "name": "John Doe",
        "email": unique_email,
        "password": "password123",
        "phonenumber": "+4512345678",
        "role": "SUV",
    }
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code in (200, 201)
    return resp.json()["id"]


@pytest.fixture
def created_event_id(client):
    payload = {
        "description": "Volunteer Event",
        "priority": 1,
        "status": "active",
        "location": {"latitude": 0.0, "longitude": 0.0},
    }
    resp = client.post("/events/", json=payload)
    assert resp.status_code == 201
    return resp.json()["id"]


class TestVolunteers:
    def test_create_volunteer(self, client, created_user_id, created_event_id):
        payload = {
            "user_id": created_user_id,
            "event_id": created_event_id,
            "status": "active",
        }
        response = client.post("/volunteers/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["id"] == created_user_id
        assert data["event_id"] == created_event_id
        assert data["status"] == "active"

    def test_get_volunteers(self, client, created_user_id, created_event_id):
        # Seed one volunteer to ensure list is not empty
        client.post(
            "/volunteers/",
            json={"user_id": created_user_id, "event_id": created_event_id, "status": "active"},
        )
        response = client.get("/volunteers/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_volunteer_not_found(self, client):
        response = client.get("/volunteers/999999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Volunteer not found"