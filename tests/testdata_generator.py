import random
import json
import requests
from faker import Faker

fake = Faker()

# ------------------ CONFIG ------------------
API_BASE = "http://mayday-cluster-api-alb-1789067592.eu-central-1.elb.amazonaws.com"  # <-- change if needed
#API_BASE = "http://localhost:8000"

# Admin credentials for authentication (required for creating events and other resources)
ADMIN_EMAIL = "default_admin@example.com"  # <-- change to your admin email
ADMIN_PASSWORD = "admin123"  # <-- change to your admin password

COPENHAGEN_COORDS = {"lat": 55.6761, "lon": 12.5683}

# Global variable to store auth token
AUTH_TOKEN = None

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

def generate_random_resource_needed(event_id: int):
    """Generate a random resource needed for an event."""
    res = random.choice(RESOURCE_TYPES)
    return {
        "name": res["name"],
        "resource_type": res["resource_type"],
        "quantity": random.randint(1, 10),
        "description": res["description"],
        "is_fulfilled": False,
        "event_id": event_id,
    }

# ------------------ AUTHENTICATION ------------------
def login_admin():
    """
    Login with admin credentials and store the JWT token.
    Returns True if successful, False otherwise.
    """
    global AUTH_TOKEN
    
    print("\n🔐 Authenticating as admin...")
    print(f"   Email: {ADMIN_EMAIL}")
    
    url = f"{API_BASE}/auth/login"
    payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        resp = requests.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        AUTH_TOKEN = data.get("access_token")
        
        if AUTH_TOKEN:
            print(f"   ✅ Authentication successful")
            print(f"   Token: {AUTH_TOKEN[:30]}...")
            return True
        else:
            print(f"   ❌ No access token in response")
            return False
    except Exception as e:
        print(f"   ❌ Authentication failed: {e}")
        print(f"   Response: {resp.text if 'resp' in locals() else 'No response'}")
        return False

# ------------------ REQUEST HELPERS ------------------
def get_headers():
    """Get headers with authentication token if available."""
    headers = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers

def post_json(endpoint: str, payload: dict):
    url = f"{API_BASE}/{endpoint}"
    headers = get_headers()
    resp = requests.post(url, json=payload, headers=headers)
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
def seed_test_data(num_volunteers=0, num_events=3, num_resources_available=3, num_resources_needed=3, num_users=3):
    """
    Seed test data in the correct order: Auth → Events → Resources Needed → Users → Volunteers → Resources Available
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
    created_resources_available = 0
    created_resources_needed = 0

    print("\n" + "="*50)
    print("🌱 Starting Test Data Seeding")
    print("="*50)

    # --- Step 0: Authenticate ---
    if not login_admin():
        print("\n❌ ERROR: Authentication failed. Cannot proceed without admin access.")
        print("   Please check ADMIN_EMAIL and ADMIN_PASSWORD in the config section.")
        return

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
    if num_volunteers > 0 and len(created_events) == 0:
        print("\n❌ ERROR: No events created. Cannot create volunteers without events.")
        print("   Aborting volunteer and resource creation.")
        num_volunteers = 0
        num_resources_available = 0

    # --- Step 2: Create Resources Needed (requires events) ---
    print(f"\n📋 Creating {num_resources_needed} needed resource(s)...")
    if num_resources_needed > 0 and len(created_events) == 0:
        print("  ⚠️  No events created; skipping resources needed.")
        num_resources_needed = 0
    
    for i in range(num_resources_needed):
        event = random.choice(created_events)
        event_id = event.get("id")
        if event_id:
            resource_data = generate_random_resource_needed(event_id)
            print(f"\n  Resource Needed {i+1}/{num_resources_needed}:")
            print(f"    Name: {resource_data['name']}")
            print(f"    Type: {resource_data['resource_type']}")
            print(f"    Quantity: {resource_data['quantity']}")
            print(f"    Event ID: {event_id}")
            response = post_json("resources/needed/", resource_data)
            if response:
                created_resources_needed += 1
                print(f"    ✅ Resource needed created")
            else:
                print(f"    ❌ Failed to create resource needed")
        else:
            print(f"  ❌ No event ID found for resource needed {i+1}")

    # --- Step 3: Create Users (needed for volunteers) ---
    print(f"\n👥 Creating {num_users} user(s)...")
    for i in range(num_users):
        user_data = {
            "name": fake.name(),
            "email": fake.unique.email(),
            "phonenumber": fake.phone_number(),
            "password": "password123"
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
        num_resources_available = 0

    # --- Step 4: Create Volunteers (requires events and users) ---
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

    # --- Step 5: Create Resources Available (requires volunteers) ---
    print(f"\n📦 Creating {num_resources_available} available resource(s)...")
    if num_resources_available > 0 and len(created_volunteers) == 0:
        print("  ⚠️  No volunteers created; skipping resources available.")
        num_resources_available = 0
    
    for i in range(num_resources_available):
        volunteer = random.choice(created_volunteers)
        volunteer_id = volunteer.get("id")
        if volunteer_id:
            resource_data = generate_random_resource_available(volunteer_id)
            print(f"\n  Resource Available {i+1}/{num_resources_available}:")
            print(f"    Name: {resource_data['name']}")
            print(f"    Type: {resource_data['resource_type']}")
            print(f"    Volunteer ID: {volunteer_id}")
            response = post_json("resources/available/", resource_data)
            if response:
                created_resources_available += 1
                print(f"    ✅ Resource available created")
            else:
                print(f"    ❌ Failed to create resource available")
        else:
            print(f"  ❌ No volunteer ID found for resource available {i+1}")

    # --- Summary ---
    print("\n" + "="*50)
    print("✅ Seeding Complete!")
    print("="*50)
    print(f"📅 Events created:            {len(created_events)}")
    print(f"📋 Resources needed created:  {created_resources_needed}")
    print(f"👥 Users created:             {len(created_users)}")
    print(f"🙋 Volunteers created:        {len(created_volunteers)}")
    print(f"📦 Resources available created: {created_resources_available}")
    print("="*50 + "\n")

# ------------------ ENTRY POINT ------------------
if __name__ == "__main__":
    # Example usage:
    # - Create 3 events
    # - Create 5 resources needed for events
    # - Create 5 users (SUVs)
    # - Create 8 volunteers (some users can volunteer for multiple events)
    # - Create 3 available resources from volunteers
    
    seed_test_data(
        num_events=4,
        num_resources_needed=10,
        num_users=15,
        num_volunteers=8,
        num_resources_available=0
    )