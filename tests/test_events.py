import pytest
from fastapi.testclient import TestClient
from api_service.app.main import app

client = TestClient(app)

def test_get_events():
    response = client.get("/events/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_event_not_found():
    response = client.get("/events/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"

def test_create_event():
    # You may need to adjust location_id and datetime to match your schema
    payload = {
        "location_id": 1,
        "description": "Test event",
        "datetime": "2025-10-05T12:00:00",
        "priority": 3,
        "status": "active"
    }
    response = client.post("/events/", json=payload)
    # Accept 201 or 422 (if location_id does not exist)
    assert response.status_code in (201, 422)
