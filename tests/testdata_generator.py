import random
import json
import requests
from faker import Faker

fake = Faker()

# ------------------ CONFIG ------------------
API_BASE = "http://localhost:8000"  # <-- change if needed
COPENHAGEN_COORDS = {"lat": 55.6761, "lon": 12.5683}

# ------------------ STATIC DATA ------------------
# Civilian resources for community disaster response
RESOURCE_TYPES = [
    {"name": "Personal Vehicle", "resource_type": "vehicle", "description": "Transport people and supplies"},
    {"name": "Pickup Truck", "resource_type": "vehicle", "description": "Haul debris and heavy items"},
    {"name": "SUV/Van", "resource_type": "vehicle", "description": "Transport groups and equipment"},
    {"name": "Boat/Kayak", "resource_type": "vehicle", "description": "Water rescue and transport"},
    {"name": "First Aid Kit", "resource_type": "equipment", "description": "Basic medical supplies"},
    {"name": "Power Tools", "resource_type": "equipment", "description": "Chainsaw, drills for cleanup"},
    {"name": "Shovels & Tools", "resource_type": "equipment", "description": "Manual cleanup tools"},
    {"name": "Water Pump", "resource_type": "equipment", "description": "Remove flood water"},
    {"name": "Generator", "resource_type": "equipment", "description": "Emergency power supply"},
    {"name": "Food Supplies", "resource_type": "supplies", "description": "Non-perishable food items"},
    {"name": "Bottled Water", "resource_type": "supplies", "description": "Drinking water supply"},
    {"name": "Blankets/Bedding", "resource_type": "supplies", "description": "Emergency shelter supplies"},
    {"name": "Flashlights/Lanterns", "resource_type": "equipment", "description": "Portable lighting"},
    {"name": "Radio Equipment", "resource_type": "equipment", "description": "Communication devices"},
    {"name": "Tarpaulins", "resource_type": "supplies", "description": "Cover damaged roofs"},
]

# Community disaster response events - tasks civilians can help with
EVENT_DESCRIPTIONS = [
    "Flood preparation - sandbag filling station",
    "Post-flood cleanup - residential area",
    "Debris removal from streets",
    "Emergency supply distribution point",
    "Food and water collection drive",
    "Temporary shelter setup assistance",
    "Welfare check on elderly residents",
    "Search for missing pets in affected area",
    "Road clearing - fallen trees and branches",
    "Damage assessment survey team",
    "Community kitchen for displaced families",
    "Clothing and blanket collection center",
    "Pump water from flooded basements",
    "Tarpaulin installation on damaged roofs",
    "Medical supply sorting and packing",
    "Transport coordination for evacuees",
    "Child care center for emergency workers",
    "Information desk for affected residents",
    "Power restoration support team",
    "Communication relay station setup",
]

# ------------------ HELPERS ------------------
def generate_copenhagen_location():
    """Generate a fake location within or near Copenhagen."""

    location = {
        "latitude": COPENHAGEN_COORDS["lat"] + random.uniform(-0.05, 0.05),
        "longitude": COPENHAGEN_COORDS["lon"] + random.uniform(-0.05, 0.05),
        "address": {
            "street": fake.street_address(),
            "city": "Copenhagen",
            "postcode": random.choice(["1050", "2200", "2300", "2100", "2450"]),
            "country": "Denmark"    
        }
    }

    return location

# ------------------ DATA GENERATORS ------------------
def generate_random_event():
    """
    Generate a random event for the POST /events/ endpoint.
    Returns EventCreate schema structure.
    """
    event_description = random.choice(EVENT_DESCRIPTIONS)
    priority = random.randint(1, 5)
    status = random.choice(["active", "resolved", "pending"])
    location = generate_copenhagen_location()

    # EventCreate expects: description, priority, status, location (LocationCreate)
    data = {
        "description": event_description,
        "priority": priority,
        "status": status,
        "location": location
    }
    return data

def generate_random_volunteer(created_users: list[dict], created_events: list[dict]):
    """
    Generate a random volunteer for an existing user and event.
    
    """
    if not created_users:
        raise ValueError("No users available to assign volunteer to. Create users first.")
    if not created_events:
        raise ValueError("No events available to assign volunteer to. Create events first.")
    
    user = random.choice(created_users)
    event = random.choice(created_events)
    
    user_id = user.get("id")
    event_id = event.get("id")
    
    if not user_id:
        raise ValueError(f"Selected user has no ID: {user}")
    if not event_id:
        raise ValueError(f"Selected event has no ID: {event}")
    
    volunteer = {
        "user_id": user_id,
        "event_id": event_id,
        "status": "active"  # All new volunteers start as active
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
def seed_test_data(num_volunteers=0, num_events=3, num_resources=3, num_users=3):
    """
    Seed test data in the correct order: Events → Users → Volunteers → Resources
    """
    # Auto-adjust if volunteers requested without sufficient events/users
    if num_volunteers > 0:
        if num_events == 0:
            print("⚠️  To create volunteers, you need events. Setting num_events=num_volunteers.")
            num_events = max(1, num_volunteers)
        if num_users == 0:
            print("⚠️  To create volunteers, you need users. Setting num_users=num_volunteers.")
            num_users = max(1, num_volunteers)
    
    created_volunteers = []
    created_events = []
    created_users = []
    created_resources = 0

    print("\n" + "="*50)
    print("🌱 Starting Test Data Seeding")
    print("="*50)

    # --- Step 1: Create Events (needed for volunteers) ---
    print(f"\n📅 Creating {num_events} event(s)...")
    for i in range(num_events):
        event_data = generate_random_event()
        print(f"\n  Event {i+1}/{num_events}:")
        print(f"    Description: {event_data['description']}")
        print(f"    Priority: {event_data['priority']}")
        print(f"    Status: {event_data['status']}")
        
        # Use POST /events/ endpoint (returns EventResponse with id)
        response = post_json("events/", event_data)
        if response:
            # POST /events/ returns EventResponse: {id, description, priority, status, ...}
            event_id = response.get("id")
            
            if event_id:
                # Store event with full response data
                created_events.append(response)
                print(f"    ✅ Event ID: {event_id}")
            else:
                print(f"    ⚠️  Event created but no ID found")
                print(f"    Response keys: {list(response.keys())}")
        else:
            print(f"    ❌ Failed to create event")

    if num_volunteers > 0 and len(created_events) == 0:
        print("\n❌ ERROR: No events created. Cannot create volunteers without events.")
        print("   Aborting volunteer and resource creation.")
        num_volunteers = 0
        num_resources = 0

    # --- Step 2: Create Users (needed for volunteers) ---
    print(f"\n👥 Creating {num_users} user(s)...")
    for i in range(num_users):
        user_data = {
            "name": fake.name(),
            "email": fake.unique.email(),
            "phonenumber": fake.phone_number(),
            "password": "password123",
            "role": "SUV",
        }
        print(f"\n  User {i+1}/{num_users}:")
        print(f"    Name: {user_data['name']}")
        print(f"    Email: {user_data['email']}")
        response = post_json("auth/register", user_data)
        if response:
            user_id = response.get("id")
            if user_id:
                created_users.append(response)
                print(f"    ✅ User ID: {user_id}")
            else:
                print(f"    ⚠️  User created but no ID returned")
        else:
            print(f"    ❌ Failed to create user")

    if num_volunteers > 0 and len(created_users) == 0:
        print("\n❌ ERROR: No users created. Cannot create volunteers without users.")
        print("   Aborting volunteer and resource creation.")
        num_volunteers = 0
        num_resources = 0

    # --- Step 3: Create Volunteers (requires events and users) ---
    print(f"\n🙋 Creating {num_volunteers} volunteer(s)...")
    for i in range(num_volunteers):
        try:
            volunteer_data = generate_random_volunteer(created_users, created_events)
            print(f"\n  Volunteer {i+1}/{num_volunteers}:")
            print(f"    User ID: {volunteer_data['user_id']}")
            print(f"    Event ID: {volunteer_data['event_id']}")
            print(f"    Status: {volunteer_data['status']}")
            response = post_json("volunteers/", volunteer_data)
            if response:
                volunteer_id = response.get("id")
                if volunteer_id:
                    created_volunteers.append(response)
                    print(f"    ✅ Volunteer ID: {volunteer_id}")
                else:
                    print(f"    ⚠️  Volunteer created but no ID returned")
            else:
                print(f"    ❌ Failed to create volunteer")
        except ValueError as e:
            print(f"    ❌ Error: {e}")
            break

    # --- Step 4: Create Resources Available (requires volunteers) ---
    print(f"\n📦 Creating {num_resources} available resource(s)...")
    if num_resources > 0 and len(created_volunteers) == 0:
        print("  ⚠️  No volunteers created; skipping resource available.")
        num_resources = 0
    
    for i in range(num_resources):
        volunteer = random.choice(created_volunteers)
        volunteer_id = volunteer.get("id")
        if volunteer_id:
            resource_data = generate_random_resource_available(volunteer_id)
            print(f"\n  Resource {i+1}/{num_resources}:")
            print(f"    Name: {resource_data['name']}")
            print(f"    Type: {resource_data['resource_type']}")
            print(f"    Volunteer ID: {volunteer_id}")
            response = post_json("resources/available/", resource_data)
            if response:
                created_resources += 1
                print(f"    ✅ Resource created")
            else:
                print(f"    ❌ Failed to create resource")
        else:
            print(f"  ❌ No volunteer ID found for resource {i+1}")

    # --- Summary ---
    print("\n" + "="*50)
    print("✅ Seeding Complete!")
    print("="*50)
    print(f"📅 Events created:     {len(created_events)}")
    print(f"👥 Users created:      {len(created_users)}")
    print(f"🙋 Volunteers created: {len(created_volunteers)}")
    print(f"📦 Resources created:  {created_resources}")
    print("="*50 + "\n")

# ------------------ ENTRY POINT ------------------
if __name__ == "__main__":
    # Example usage:
    # - Create 3 events with resources needed
    # - Create 5 users (SUVs)
    # - Create 8 volunteers (some users can volunteer for multiple events)
    # - Create 3 available resources from volunteers
    
    seed_test_data(
        num_events=3,
        num_users=5,
        num_volunteers=0,
        num_resources=3
    )