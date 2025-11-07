import pytest
from fastapi.testclient import TestClient
from api_service.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
