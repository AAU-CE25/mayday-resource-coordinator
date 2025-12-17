import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def sample_event():
    return {
        "description": "Test flood event",
        "priority": 3,
        "status": "pending",
        "location": {
            "street": "Test Street",
            "city": "Copenhagen",
            "postcode": "2100",
            "country": "Denmark",
            "address": {
                "street": "Test Street",
                "city": "Copenhagen",
                "postcode": "2100",
                "country": "Denmark"
            },
            "latitude": 55.6761,
            "longitude": 12.5683
        }
    }

class TestEvents:
    def test_create_event(self, client: TestClient, sample_event):
        response = client.post("/events/", json=sample_event)
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == sample_event["description"]
        assert data["priority"] == sample_event["priority"]

    def test_get_events(self, client: TestClient):
        response = client.get("/events/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_event_missing_required_field(self, client: TestClient):
        invalid_event = {
            "priority": 3,
            "status": "pending"
        }
        response = client.post("/events/", json=invalid_event)
        assert response.status_code == 422

    def test_create_event_invalid_priority(self, client: TestClient, sample_event):
        sample_event["priority"] = 10
        response = client.post("/events/", json=sample_event)
        assert response.status_code == 422
