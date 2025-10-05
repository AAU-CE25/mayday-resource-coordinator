import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_resources_needed():
    response = client.get("/resources-needed/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_resource_needed_not_found():
    response = client.get("/resources-needed/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Resource not found"

def test_create_resource_needed():
    payload = {
        "event_id": 1,
        "resource_type": "food",
        "quantity": 5,
        "is_fulfilled": False
    }
    response = client.post("/resources-needed/", json=payload)
    assert response.status_code in (201, 422)
