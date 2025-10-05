import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_locations():
    response = client.get("/locations/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_location_not_found():
    response = client.get("/locations/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Location not found"

def test_create_location():
    payload = {
        "name": "Test Location",
        "region": "Test Region",
        "postcode": "12345"
    }
    response = client.post("/locations/", json=payload)
    assert response.status_code in (201, 422)
