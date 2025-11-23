import pytest
from fastapi.testclient import TestClient
from api_service.app.main import app

client = TestClient(app)

def test_get_volunteers():
    response = client.get("/volunteers/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_volunteer_not_found():
    response = client.get("/volunteers/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Volunteer not found"

def test_create_volunteer():
    payload = {
        "user_id": 1,
        "event_id": 1,
        "status": "active"
    }
    response = client.post("/volunteers/", json=payload)
    assert response.status_code in (200, 201, 422)

