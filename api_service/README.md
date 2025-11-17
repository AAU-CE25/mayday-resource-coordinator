# Mayday Resource Coordinator - API Service

A FastAPI-based emergency resource coordination system that manages events, volunteers, resources, and locations during emergency situations.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Models & Relationships](#data-models--relationships)
- [API Endpoints](#api-endpoints)
- [Running the Service](#running-the-service)
- [Testing](#testing)
- [Authentication & Authorization](#authentication--authorization)

---

## Architecture Overview

The API service follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────┐
│                   API Routes Layer                   │
│         (FastAPI endpoints - HTTP handlers)          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                   Logic Layer                        │
│        (Business logic & data transformation)        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              Data Access Layer (DAO)                 │
│          (Database operations & queries)             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                   Database                           │
│              (SQLite with SQLModel)                  │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
api_service/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── db.py                # Database configuration
│   ├── models.py            # SQLModel database models
│   ├── routes/              # API endpoint definitions
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User management
│   │   ├── events.py        # Event management
│   │   ├── volunteers.py    # Volunteer management
│   │   ├── resources.py     # Resource management
│   │   ├── locations.py     # Location management
│   │   └── stats.py         # Statistics endpoints
│   ├── logic/               # Business logic layer
│   │   ├── user_logic.py
│   │   ├── event_logic.py
│   │   ├── volunteer_logic.py
│   │   ├── resource_logic.py
│   │   ├── location_logic.py
│   │   ├── stats_logic.py
│   │   └── ingestion_logic.py
│   ├── data_access/         # Data access objects (DAOs)
│   │   ├── user_dao.py
│   │   ├── event_dao.py
│   │   ├── volunteer_dao.py
│   │   ├── resource_dao.py
│   │   ├── location_dao.py
│   │   └── stats_dao.py
│   ├── auth/                # Authentication & authorization
│   │   ├── hashing.py
│   │   ├── jwt_handler.py
│   │   ├── jwt_bearer.py
│   │   └── role_checker.py
│   ├── clients/             # External service clients
│   │   └── osm_client.py    # OpenStreetMap client
│   └── core/
│       └── config.py        # Configuration management
├── scripts/
│   └── reset_db.py          # Database reset utility
└── requirements.txt         # Python dependencies
```

---

## Data Models & Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │◄──────────┐
│ name        │            │
│ email       │            │
│ phonenumber │            │
│ password    │            │
│ role        │            │
└─────────────┘            │
                           │
                           │ user_id (FK)
                           │
                    ┌──────┴──────┐
                    │  Volunteer  │
                    │─────────────│
                    │ id (PK)     │
                    │ user_id (FK)│
                    │ event_id(FK)│───────┐
                    │ status      │       │
                    │ create_time │       │
                    │completion_t │       │
                    └─────────────┘       │
                           │              │
                           │              │
                           │              │
                    ┌──────┴────────┐     │
                    │ ResourceAvail │     │
                    │───────────────│     │
                    │ id (PK)       │     │
                    │ name          │     │
                    │ resource_type │     │
                    │ quantity      │     │
                    │ description   │     │
                    │ status        │     │
                    │volunteer_id(FK)     │
                    │ is_allocated  │     │
                    └───────────────┘     │
                                          │
                                          │
                    ┌─────────────┐       │
                    │   Event     │◄──────┘
                    │─────────────│
                    │ id (PK)     │
                    │ description │
                    │ priority    │
                    │ status      │
                    │ create_time │
                    │modified_time│
                    │location_id  │───────┐
                    └─────────────┘       │
                           │              │
                           │              │
                    ┌──────┴────────┐     │
                    │ResourceNeeded │     │
                    │───────────────│     │
                    │ id (PK)       │     │
                    │ name          │     │
                    │ resource_type │     │
                    │ quantity      │     │
                    │ description   │     │
                    │ is_fulfilled  │     │
                    │ event_id (FK) │     │
                    └───────────────┘     │
                                          │
                                          │
                                   ┌──────┴──────┐
                                   │  Location   │
                                   │─────────────│
                                   │ id (PK)     │
                                   │ street      │
                                   │ city        │
                                   │ postcode    │
                                   │ country     │
                                   │ latitude    │
                                   │ longitude   │
                                   └─────────────┘
```

### Core Entities

#### **User**
Represents individuals in the system (volunteers, coordinators, authorities).

- **Roles**: 
  - `SUV` - Standard User/Volunteer
  - `VC` - Volunteer Coordinator
  - `AUTHORITY` - Emergency Authority

#### **Volunteer**
Acts as a **bridge table** between Users and Events, tracking volunteer participation.

- **Key Concept**: A volunteer record is created when someone starts helping at an event
- **Status**: 
  - `active` - Currently helping at the event
  - `completed` - Finished helping
- **Duplicate Records**: The same user can have multiple volunteer records (helping at different events or multiple times at the same event)
- **Timestamps**:
  - `create_time` - When volunteer started helping
  - `completion_time` - When volunteer stopped helping (null if still active)

#### **Event**
Emergency situations requiring coordination and resources.

- **Status**: `active`, `resolved`, `pending`
- **Priority**: 1-5 (1 being highest priority)
- **Location**: Each event has exactly one location

#### **Location**
Geographic information for events.

- Contains both address components and GPS coordinates
- Used for mapping and spatial queries

#### **ResourceNeeded**
Resources required for an event.

- Tracks what resources are needed and in what quantity
- `is_fulfilled` indicates if the need has been met

#### **ResourceAvailable**
Resources offered by volunteers.

- Each resource is provided by a specific volunteer
- `is_allocated` indicates if resource has been assigned to an event
- **Status**: `available`, `in_use`, `maintenance`

### Relationship Summary

```
User 1──────┐
            │ 1:N
            ▼
        Volunteer N────┐
            │          │ N:1
            │ 1:N      ▼
            ▼       Event 1──────┐
    ResourceAvail       │        │ 1:1
                        │ 1:N    ▼
                        ▼     Location
                  ResourceNeeded
```

---

## API Endpoints

### Base URL
- Local: `http://localhost:8000`
- Docker: `http://localhost:8000`

### Authentication Endpoints

```
POST   /auth/register          # Register new user
POST   /auth/login             # Login and get JWT token
```

### User Endpoints

```
POST   /users/                 # Create a new user
GET    /users/                 # Get all users (paginated)
GET    /users/{user_id}        # Get specific user
PUT    /users/{user_id}        # Update user
DELETE /users/{user_id}        # Delete user
```

### Event Endpoints

```
POST   /events/ingest/         # Create event with location and resources
POST   /events/                # Create a new event
GET    /events/                # Get all events (paginated)
GET    /events/{event_id}      # Get specific event
PUT    /events/{event_id}      # Update event
DELETE /events/{event_id}      # Delete event
```

**Event Ingestion Example:**
```json
{
  "event": {
    "description": "Flood near residential area",
    "priority": 3,
    "status": "active",
    "location": {
      "latitude": 55.6761,
      "longitude": 12.5683,
      "address": {
        "street": "Main Street 123",
        "city": "Copenhagen",
        "postcode": "1050",
        "country": "Denmark"
      }
    },
    "resources_needed": [
      {
        "name": "Ambulance",
        "resource_type": "vehicle",
        "description": "Emergency medical vehicle",
        "quantity": 2,
        "is_fulfilled": false
      }
    ]
  }
}
```

### Volunteer Endpoints

```
POST   /volunteers/            # Create volunteer assignment
GET    /volunteers/            # Get all volunteers (paginated)
GET    /volunteers/active      # Get all active volunteers
GET    /volunteers/active?event_id={id}  # Get active volunteers for specific event
GET    /volunteers/{volunteer_id}        # Get specific volunteer
PUT    /volunteers/{volunteer_id}        # Update volunteer (e.g., mark as completed)
DELETE /volunteers/{volunteer_id}        # Delete volunteer assignment
```

**Creating a Volunteer:**
```json
{
  "user_id": 1,
  "event_id": 5,
  "status": "active"
}
```

**Marking Volunteer as Completed:**
```json
{
  "id": 123,
  "status": "completed"
}
```

### Resource Endpoints

#### Resources Needed
```
POST   /resources/needed/      # Add resource need to event
GET    /resources/needed/      # Get all needed resources (paginated)
GET    /resources/needed/{id}  # Get specific resource need
PUT    /resources/needed/{id}  # Update resource need
DELETE /resources/needed/{id}  # Delete resource need
```

#### Resources Available
```
POST   /resources/available/   # Add available resource
GET    /resources/available/   # Get all available resources (paginated)
GET    /resources/available/{id}  # Get specific available resource
PUT    /resources/available/{id}  # Update available resource
DELETE /resources/available/{id}  # Delete available resource
```

### Location Endpoints

```
POST   /locations/             # Create a location
GET    /locations/             # Get all locations (paginated)
GET    /locations/{location_id}  # Get specific location
PUT    /locations/{location_id}  # Update location
DELETE /locations/{location_id}  # Delete location
```

### Statistics Endpoints

```
GET    /stats/                 # Get system statistics
```

**Response:**
```json
{
  "activeEvents": 12,
  "totalVolunteers": 45,
  "resourcesAvailable": 78,
  "totalLocations": 30
}
```

---

## Running the Service

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the API service
python run_api_service.py

# Or use uvicorn directly
uvicorn api_service.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Using Docker Compose

```bash
# Build and start the service
docker compose up -d --build api_service

# View logs
docker compose logs -f api_service

# Stop the service
docker compose down
```

### Database Management

```bash
# Reset the database (WARNING: Deletes all data)
python api_service/scripts/reset_db.py
```

---

## Testing

### Setup

```bash
# Install test dependencies
pip install pytest pytest-cov httpx
```

### Running Tests

```bash
# Run all tests
PYTHONPATH=. pytest -v

# Run specific test file
PYTHONPATH=. pytest tests/test_volunteers.py -v

# Run with coverage
PYTHONPATH=. pytest --cov=api_service --cov-report=html

# Run specific test function
PYTHONPATH=. pytest tests/test_volunteers.py::test_get_active_volunteers -v
```

### Test Data Generation

```bash
# Generate test data (users, events, volunteers, resources)
python tests/testing_data_generator.py
```

---

## Authentication & Authorization

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication.

**Login Flow:**
```
1. User registers: POST /auth/register
2. User logs in: POST /auth/login → receives JWT token
3. Include token in subsequent requests:
   Header: Authorization: Bearer <token>
```

### Roles & Permissions

- **SUV (Standard User/Volunteer)**: Can view events, register as volunteer, manage own resources
- **VC (Volunteer Coordinator)**: Can manage volunteers, assign resources
- **AUTHORITY**: Full access to all operations

### Protected Endpoints

Most endpoints require authentication. Include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/volunteers/active
```

---

## API Request Examples

### Create a New User and Volunteer

```bash
# 1. Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phonenumber": "+1234567890",
    "password": "secure_password",
    "role": "SUV"
  }'

# Response: { "id": 1, "name": "John Doe", "email": "john@example.com", ... }

# 2. Create a volunteer assignment (assuming event #5 exists)
curl -X POST http://localhost:8000/volunteers/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": 1,
    "event_id": 5,
    "status": "active"
  }'
```

### Get Active Volunteers for an Event

```bash
# Get all active volunteers for event #5
curl http://localhost:8000/volunteers/active?event_id=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark Volunteer as Completed

```bash
curl -X PUT http://localhost:8000/volunteers/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": 123,
    "status": "completed"
  }'
```

---

## Environment Configuration

Create a `.env` file in the api_service directory:

```env
# Database
DATABASE_URL=sqlite:///./database.db

# JWT
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_HOST=0.0.0.0
API_PORT=8000
```

---

## Common Use Cases

### 1. Emergency Event Reporting
```
POST /events/ingest/
→ Creates event with location and resource needs in one request
```

### 2. Volunteer Assignment
```
User registers → Login → Create volunteer record for event
→ System tracks when they started (create_time)
```

### 3. Completing Volunteer Service
```
PUT /volunteers/{id} with status="completed"
→ System automatically sets completion_time
```

### 4. Monitoring Active Helpers
```
GET /volunteers/active?event_id={id}
→ Returns all currently active volunteers at a specific event
```

### 5. Resource Coordination
```
GET /resources/needed/ → See what's needed
GET /resources/available/ → See what's available
PUT /resources/available/{id} with is_allocated=true → Allocate resource
```

---

## Troubleshooting

### Database Locked Error
```bash
# Stop any running instances
docker compose down
# Reset database
python api_service/scripts/reset_db.py
```

### Import Errors in Tests
```bash
# Ensure you're running from project root
cd /path/to/mayday-resource-coordinator
PYTHONPATH=. pytest
```

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

---

