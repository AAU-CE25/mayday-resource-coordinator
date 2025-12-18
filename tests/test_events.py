import pytest
from fastapi.testclient import TestClient
from api_service.app.main import app

client = TestClient(app)

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
    def test_create_event(self, client, sample_event):
        response = client.post("/events/", json=sample_event)
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == sample_event["description"]
        assert data["priority"] == sample_event["priority"]

    def test_get_events(self, client):
        response = client.get("/events/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_event_missing_required_field(self, client):
        invalid_event = {
            "priority": 3,
            "status": "pending"
        }
        response = client.post("/events/", json=invalid_event)
        assert response.status_code == 422

    def test_create_event_invalid_priority(self, client, sample_event):
        sample_event["priority"] = 10
        response = client.post("/events/", json=sample_event)
        assert response.status_code == 422

    def test_get_event_by_id(self, client, sample_event):
        created = client.post("/events/", json=sample_event).json()
        response = client.get(f"/events/{created['id']}")
        assert response.status_code == 200
        assert response.json()["id"] == created["id"]

    def test_update_event(self, client, sample_event):
        created = client.post("/events/", json=sample_event).json()
        update_payload = {"status": "completed", "priority": 2}

        response = client.put(f"/events/{created['id']}", json=update_payload)
        assert response.status_code == 200
        updated = response.json()
        assert updated["status"] == "completed"
        assert updated["priority"] == 2

    def test_delete_event(self, client, sample_event):
        created = client.post("/events/", json=sample_event).json()
        response = client.delete(f"/events/{created['id']}")
        assert response.status_code == 204

        not_found = client.get(f"/events/{created['id']}")
        assert not_found.status_code == 404

    def test_delete_event_not_found(self, client):
        response = client.delete("/events/999999")
        assert response.status_code == 404

    def test_update_event_not_found(self, client):
        response = client.put("/events/999999", json={"status": "active"})
        assert response.status_code == 404

    def test_filter_events_by_priority_and_status(self, client, sample_event):
        # Create two events with different priority/status
        event_a = sample_event.copy()
        event_a["priority"] = 1
        event_a["status"] = "active"
        client.post("/events/", json=event_a)

        event_b = sample_event.copy()
        event_b["priority"] = 3
        event_b["status"] = "pending"
        client.post("/events/", json=event_b)

        by_priority = client.get("/events/?priority=1")
        assert by_priority.status_code == 200
        assert all(ev["priority"] == 1 for ev in by_priority.json())

        by_status = client.get("/events/?status=pending")
        assert by_status.status_code == 200
        assert all(ev["status"] == "pending" for ev in by_status.json())

    def test_get_events_with_pagination(self, client, sample_event):
        for idx in range(3):
            e = sample_event.copy()
            e["description"] = f"Event {idx}"
            client.post("/events/", json=e)

        paged = client.get("/events/?skip=1&limit=1")
        assert paged.status_code == 200
        assert len(paged.json()) == 1

    def test_ingest_event_happy_path(self, client):
        payload = {
            "event": {
                "description": "Ingested Event",
                "priority": 2,
                "status": "active",
                "location": {"latitude": 10.0, "longitude": 20.0},
                "resources_needed": [
                    {
                        "name": "Water",
                        "resource_type": "supply",
                        "description": "Bottled water",
                        "quantity": 5,
                        "is_fulfilled": False,
                    }
                ],
            }
        }

        resp = client.post("/events/ingest", json=payload)
        assert resp.status_code == 200
        event_id = resp.json()["event_id"]

        fetched = client.get(f"/events/{event_id}")
        assert fetched.status_code == 200

        needed = client.get("/resources/needed/").json()
        event_needed = [r for r in needed if r["event_id"] == event_id]
        assert len(event_needed) == 1
        assert event_needed[0]["event_id"] == event_id

    def test_ingest_event_invalid_payload_returns_400(self, client):
        resp = client.post("/events/ingest", json={"bad": "payload"})
        assert resp.status_code == 400
