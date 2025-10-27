import random
from faker import Faker
from datetime import datetime
import json
# from domain.schemas import LocationCreate, ResourceNeededCreate, EventCreate

fake = Faker()

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

def generate_random_event():
    event_description = random.choice(EVENT_DESCRIPTIONS)
    priority = random.randint(1, 5)
    status = random.choice(["active", "resolved", "pending"])

    location = {
        "region": fake.city(),
        "address": fake.street_address(),
        "postcode": fake.postcode(),
        "latitude": float(fake.latitude()),
        "longitude": float(fake.longitude()),
    }

    # Randomly select 1–3 resources
    resources_needed = []
    for res in random.sample(RESOURCE_TYPES, k=random.randint(1, 3)):
        resources_needed.append({
            "name": res["name"],
            "resource_type": res["resource_type"],
            "description": res["description"],
            "quantity": random.randint(1, 5),
            "is_fulfilled": False
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


# Example usage: generate and print 5 events
if __name__ == "__main__":
    for _ in range(1):
        print(json.dumps(generate_random_event(), indent=2))
        print("-" * 80)