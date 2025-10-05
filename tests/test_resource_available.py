import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_resources_available():
    response = client.get("/resources-available/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_resource_available_not_found():
    response = client.get("/resources-available/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Resource not found"

def test_create_resource_available():
    payload = {
        "volunteer_id": 1,
        "resource_type": "water",
        "quantity": 10,
        "is_allocated": False
    }
    response = client.post("/resources-available/", json=payload)
    assert response.status_code in (201, 422)
