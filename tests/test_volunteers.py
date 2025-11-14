import pytest
from fastapi.testclient import TestClient
from api_service.app.main import app

@pytest.fixture
def sample_volunteer():
    import uuid
    unique_email = f"volunteer_{uuid.uuid4().hex[:8]}@test.com"
    return {
        "user": {
            "name": "John Doe",
            "email": unique_email,
            "password": "password123",
            "role": "SUV"
        },
        "phonenumber": "+4512345678",
        "availability": "available",
        "location_id": None
    }

class TestVolunteers:
    def test_create_volunteer(self, client, sample_volunteer):
        response = client.post("/volunteers/", json=sample_volunteer)
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["name"] == sample_volunteer["user"]["name"]
        assert data["phonenumber"] == sample_volunteer["phonenumber"]

    def test_get_volunteers(self, client):
        response = client.get("/volunteers/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_volunteer_duplicate_email(self, client, sample_volunteer):
        # First creation succeeds
        response1 = client.post("/volunteers/", json=sample_volunteer)
        assert response1.status_code == 201
        
        # Second creation with same email fails
        response2 = client.post("/volunteers/", json=sample_volunteer)
        assert response2.status_code == 400

    def test_create_volunteer_invalid_email(self, client, sample_volunteer):
        sample_volunteer["user"]["email"] = "invalid-email"
        response = client.post("/volunteers/", json=sample_volunteer)
        assert response.status_code == 422
