import random
import json
import requests
from faker import Faker

fake = Faker()

# ------------------ CONFIG ------------------
API_BASE = "http://localhost:8000"  # <-- change if needed
COPENHAGEN_COORDS = {"lat": 55.6761, "lon": 12.5683}

# ------------------ STATIC DATA ------------------
RESOURCE_TYPES = [
    {"name": "Ambulance", "resource_type": "vehicle", "description": "Emergency medical vehicle"},
    {"name": "Fire Truck", "resource_type": "vehicle", "description": "Fire suppression and rescue"},
    {"name": "Paramedic", "resource_type": "personnel", "description": "Medical emergency responder"},
    {"name": "Police Officer", "resource_type": "personnel", "description": "Crowd and traffic control"},
    {"name": "Boat", "resource_type": "vehicle", "description": "Water rescue operations"},
    {"name": "Drone", "resource_type": "equipment", "description": "Aerial reconnaissance"},
]

EVENT_DESCRIPTIONS = [
    "Flood near residential area",
    "Large wildfire reported",
    "Road traffic accident",
    "Building collapse",
    "Chemical spill in factory",
    "Earthquake damage assessment",
    "Missing person in forest",
    "Bridge structural damage",
]

# ------------------ HELPERS ------------------
def generate_copenhagen_location():
    """Generate a fake location within or near Copenhagen."""

    location = {
        "street": fake.street_address(),
        "city": "Copenhagen",
        "country": "Denmark",
        "postcode": random.choice(["1050", "2200", "2300", "2100", "2450"]),
        "latitude": COPENHAGEN_COORDS["lat"] + random.uniform(-0.05, 0.05),
        "longitude": COPENHAGEN_COORDS["lon"] + random.uniform(-0.05, 0.05),
    }

    return location

# ------------------ DATA GENERATORS ------------------
def generate_random_event():
    event_description = random.choice(EVENT_DESCRIPTIONS)
    priority = random.randint(1, 5)
    status = random.choice(["active", "resolved", "pending"])
    location = generate_copenhagen_location()

    resources_needed = []
    for res in random.sample(RESOURCE_TYPES, k=random.randint(1, 3)):
        resources_needed.append({
            "name": res["name"],
            "resource_type": res["resource_type"],
            "description": res["description"],
            "quantity": random.randint(1, 5),
            "is_fulfilled": False,
        })

    data = {
        "event": {
            "description": event_description,
            "priority": priority,
            "status": status,
            "location": location,
            "resources_needed": resources_needed
        }
    }
    return data

def generate_random_volunteer():
    user = {
        "name": fake.name(),
        "email": fake.unique.email(),
        "password": "password123",
        "role": random.choice(["SUV", "VC"]),
    }

    volunteer = {
        "user": user,
        "phonenumber": fake.phone_number(),
        "availability": random.choice(["available", "busy", "off-duty"]),
        "location_id": None,
    }
    return volunteer

def generate_random_resource_available(volunteer_id: int):
    res = random.choice(RESOURCE_TYPES)
    return {
        "name": res["name"],
        "resource_type": res["resource_type"],
        "quantity": random.randint(1, 5),
        "description": res["description"],
        "status": random.choice(["available", "in_use", "maintenance"]),
        "volunteer_id": volunteer_id,
        "is_allocated": random.choice([False, True]),
    }

# ------------------ REQUEST HELPERS ------------------
def post_json(endpoint: str, payload: dict):
    url = f"{API_BASE}/{endpoint}"
    resp = requests.post(url, json=payload)
    try:
        resp.raise_for_status()
        print(f"✅ POST {endpoint} | status={resp.status_code}")
        return resp.json()
    except Exception as e:
        print(f"❌ Error posting to {endpoint}: {e}")
        print(f"Payload:\n{json.dumps(payload, indent=2)}")
        print(f"Response: {resp.text}")
        return None

# ------------------ MAIN SEEDING LOGIC ------------------
def seed_test_data(num_volunteers=3, num_events=3, num_resources=3):
    created_volunteers = []
    created_events = []

    # --- Volunteers ---
    for _ in range(num_volunteers):
        volunteer_data = generate_random_volunteer()
        response = post_json("volunteers", volunteer_data)
        if response:
            created_volunteers.append(response)

    # --- Events ---
    for _ in range(num_events):
        event_data = generate_random_event()
        response = post_json("events/ingest/", event_data)
        if response:
            created_events.append(response)

    # --- Resources available ---
    for _ in range(num_resources):
        if not created_volunteers:
            print("❌ No volunteers created; skipping resource available.")
            num_resources = 0
            break
        volunteer = random.choice(created_volunteers)
        volunteer_id = volunteer.get("id") or volunteer.get("volunteer", {}).get("id")
        if volunteer_id:
            resource_data = generate_random_resource_available(volunteer_id)
            post_json("resources/available/", resource_data)

    print(f"\n✅ Seed complete: {len(created_volunteers)} volunteers, {len(created_events)} events, {num_resources} resources available.")

# ------------------ ENTRY POINT ------------------
if __name__ == "__main__":
    seed_test_data(num_volunteers=2, num_events=2, num_resources=2)
