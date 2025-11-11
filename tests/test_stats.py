def test_get_stats(client):
    resp = client.get("/stats")
    assert resp.status_code == 200
    data = resp.json()

    # Ensure expected keys exist and are integers
    for key in ("activeEvents", "totalVolunteers", "resourcesAvailable", "totalLocations"):
        assert key in data
        assert isinstance(data[key], int)
