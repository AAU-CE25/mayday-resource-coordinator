import pytest
import uuid
from fastapi.testclient import TestClient
from api_service.app.main import app

@pytest.fixture
def sample_volunteer_id(client):
    unique_email = f"volunteer_{uuid.uuid4().hex[:8]}@test.com"
    volunteer_data = {
        "user": {
            "name": "Test Volunteer",
            "email": unique_email,
            "password": "password123",
            "role": "SUV"
        },
        "phonenumber": "+4512345678",
        "availability": "available",
        "location_id": None
    }
    response = client.post("/volunteers/", json=volunteer_data)
    assert response.status_code == 201
    volunteer = response.json()
    return volunteer["id"]  # This should now work

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