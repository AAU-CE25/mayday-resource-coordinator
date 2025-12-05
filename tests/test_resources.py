import pytest
import uuid
from fastapi.testclient import TestClient
from api_service.app.main import app

@pytest.fixture
def sample_volunteer_id(client):
    # Create a user first
    unique_email = f"volunteer_{uuid.uuid4().hex[:8]}@test.com"
    user_payload = {
        "name": "Test Volunteer",
        "email": unique_email,
        "phonenumber": "+4500000002",
        "password": "password123",
        "role": "SUV"
    }
    resp = client.post("/auth/register", json=user_payload)
    assert resp.status_code in (200, 201)
    user = resp.json()

    # Create an event with a minimal location
    event_payload = {
        "description": "Volunteer Event",
        "priority": 1,
        "status": "active",
        "location": {"latitude": 0.0, "longitude": 0.0}
    }
    resp2 = client.post("/events/", json=event_payload)
    assert resp2.status_code == 201
    event = resp2.json()

    # Create the volunteer using IDs
    volunteer_payload = {"user_id": user["id"], "event_id": event["id"], "status": "active"}
    response = client.post("/volunteers/", json=volunteer_payload)
    assert response.status_code == 201
    volunteer = response.json()
    return volunteer["id"]

@pytest.fixture
def sample_resource(sample_volunteer_id):
    return {
        "name": "Ambulance",
        "resource_type": "vehicle",
        "quantity": 2,
        "description": "Emergency medical vehicle",
        "status": "available",
        "volunteer_id": sample_volunteer_id,
        "is_allocated": False
    }

class TestResources:
    def test_create_resource(self, client, sample_resource):
        response = client.post("/resources/available/", json=sample_resource)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_resource["name"]
        assert data["quantity"] == sample_resource["quantity"]

    def test_get_available_resources(self, client):
        response = client.get("/resources/available/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_needed_resources(self, client):
        response = client.get("/resources/needed/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_resource_invalid_quantity(self, client, sample_resource):
        sample_resource["quantity"] = -1
        response = client.post("/resources/available/", json=sample_resource)
        assert response.status_code == 422