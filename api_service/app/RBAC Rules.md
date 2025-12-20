# API Endpoints - Role-Based Access Control

This document describes all API endpoints and which user roles can access them.

## User Roles

The system has three user roles with different permission levels:

- **AUTHORITY** (Admin) - Full access to all endpoints and operations
- **VC** (Volunteer Coordinator) - Can manage events, volunteers, resources, and view statistics
- **SUV** (Standard User/Volunteer) - Limited access for volunteers to report resources and view information

---

## Authentication Endpoints

**Prefix:** `/auth`

### POST `/auth/register`
**Description:** Register a new user account  
**Access:** Public (no authentication required)  
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phonenumber": "string",
  "password": "string"
}
```

### POST `/auth/login`
**Description:** Login and receive JWT access token  
**Access:** Public (no authentication required)  
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### GET `/auth/me`
**Description:** Get current authenticated user's information  
**Access:** All authenticated users  
**Roles:** `AUTHORITY`, `VC`, `SUV` (any authenticated user)

---

## User Management Endpoints

**Prefix:** `/users`

### GET `/users/`
**Description:** List all users with pagination and filtering  
**Access:** `AUTHORITY`, `VC`  
**Query Parameters:**
- `skip` (default: 0) - Number of records to skip
- `limit` (default: 100, max: 1000) - Maximum records to return
- `status` (optional) - Filter by status: available, assigned, unavailable

### GET `/users/{user_id}`
**Description:** Get a specific user by ID  
**Access:** `AUTHORITY`, `VC`, `SUV`  
**Note:** SUV users should only access their own profile

### PUT `/users/{user_id}`
**Description:** Update user information (name, email, phone, status)  
**Access:** `AUTHORITY`, `VC`, `SUV`  
**Note:** SUV users should only update their own profile

### PUT `/users/{user_id}/admin`
**Description:** Admin update user (including role assignment)  
**Access:** `AUTHORITY`, `VC`  
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phonenumber": "string",
  "status": "string",
  "role": "AUTHORITY | VC | SUV"
}
```

### DELETE `/users/{user_id}`
**Description:** Delete a user  
**Access:** `AUTHORITY` only

---

## Event Management Endpoints

**Prefix:** `/events`

### GET `/events/`
**Description:** Get all disaster events with optional filtering  
**Access:** `AUTHORITY`, `VC`, `SUV` (read-only for SUV)  
**Query Parameters:**
- `skip` (default: 0) - Number of events to skip
- `limit` (default: 100, max: 1000) - Maximum events to return
- `priority` (optional, 1-5) - Filter by priority level
- `status` (optional) - Filter by event status

### GET `/events/{event_id}`
**Description:** Get a specific event by ID  
**Access:** `AUTHORITY`, `VC`, `SUV` (read-only for SUV)

### POST `/events/`
**Description:** Create a new disaster event  
**Access:** `AUTHORITY` only  
**Request Body:**
```json
{
  "description": "string",
  "priority": 1-5,
  "status": "string",
  "location": {
    "street": "string",
    "city": "string",
    "postcode": "string",
    "country": "string",
    "latitude": float,
    "longitude": float
  }
}
```

### PUT `/events/{event_id}`
**Description:** Update an existing event  
**Access:** `AUTHORITY` only

### DELETE `/events/{event_id}`
**Description:** Delete an event  
**Access:** `AUTHORITY` only

### POST `/events/ingest`
**Description:** Ingest a full event with all related data  
**Access:** `AUTHORITY` only

---

## Resources Needed Endpoints

**Prefix:** `/resources/needed`

### GET `/resources/needed/`
**Description:** Get all resources needed  
**Access:** `AUTHORITY`, `VC`, `SUV` (read-only for SUV)

### GET `/resources/needed/{resource_id}`
**Description:** Get a specific resource needed by ID  
**Access:** `AUTHORITY`, `VC`, `SUV` (read-only for SUV)

### POST `/resources/needed/`
**Description:** Create a new resource needed entry  
**Access:** `AUTHORITY`, `VC`  
**Request Body:**
```json
{
  "resource_type": "string",
  "quantity": integer,
  "event_id": integer
}
```

### PUT `/resources/needed/{resource_id}`
**Description:** Update a resource needed entry  
**Access:** `AUTHORITY`, `VC`

### DELETE `/resources/needed/{resource_id}`
**Description:** Delete a resource needed entry  
**Access:** `AUTHORITY`, `VC`

---

## Resources Available Endpoints

**Prefix:** `/resources/available`

### GET `/resources/available/`
**Description:** Get all available resources  
**Access:** `AUTHORITY`, `VC`  
**Note:** SUV users cannot list all available resources

### GET `/resources/available/{resource_id}`
**Description:** Get a specific available resource by ID  
**Access:** `AUTHORITY`, `VC`, `SUV`

### POST `/resources/available/`
**Description:** Create a new available resource entry (report a resource)  
**Access:** `AUTHORITY`, `VC`, `SUV`  
**Request Body:**
```json
{
  "resource_type": "string",
  "quantity": integer,
  "volunteer_id": integer
}
```

### PUT `/resources/available/{resource_id}`
**Description:** Update an available resource entry  
**Access:** `AUTHORITY`, `VC`, `SUV`

### DELETE `/resources/available/{resource_id}`
**Description:** Delete an available resource entry  
**Access:** `AUTHORITY`, `VC`, `SUV`

---

## Volunteer Management Endpoints

**Prefix:** `/volunteers`

### GET `/volunteers/`
**Description:** Get all volunteers with optional filtering  
**Access:** `AUTHORITY`, `VC`, `SUV`  
**Query Parameters:**
- `event_id` (optional) - Filter by event ID
- `user_id` (optional) - Filter by user ID
- `status` (optional) - Filter by status: active, completed, cancelled
- `skip` (default: 0) - Number of records to skip
- `limit` (default: 100, max: 1000) - Maximum records to return

### GET `/volunteers/{volunteer_id}`
**Description:** Get a specific volunteer by ID  
**Access:** `AUTHORITY`, `VC`, `SUV`

### POST `/volunteers/`
**Description:** Create a new volunteer entry  
**Access:** `AUTHORITY`, `VC`, `SUV`  
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phonenumber": "string",
  "skills": ["string"]
}
```

### PUT `/volunteers/{volunteer_id}`
**Description:** Update a volunteer record  
**Access:** `AUTHORITY`, `VC`, `SUV`

---

## Location Management Endpoints

**Prefix:** `/locations`

### GET `/locations/`
**Description:** Get all locations  
**Access:** `AUTHORITY`, `VC`

### GET `/locations/{location_id}`
**Description:** Get a specific location by ID  
**Access:** `AUTHORITY`, `VC`

### POST `/locations/address`
**Description:** Create a location from an address  
**Access:** `AUTHORITY`, `VC`  
**Request Body:**
```json
{
  "street": "string",
  "city": "string",
  "postcode": "string",
  "country": "string"
}
```

### GET `/locations/geocode`
**Description:** Create a location from coordinates (not yet implemented)  
**Access:** `AUTHORITY`, `VC`  
**Query Parameters:**
- `latitude` (float, -90 to 90)
- `longitude` (float, -180 to 180)

### PUT `/locations/{location_id}`
**Description:** Update a location  
**Access:** `AUTHORITY`, `VC`

### DELETE `/locations/{location_id}`
**Description:** Delete a location  
**Access:** `AUTHORITY`, `VC`

---

## Statistics Endpoints

**Prefix:** `/stats`

### GET `/stats/`
**Description:** Get aggregated statistics for dashboard/monitoring  
**Access:** `AUTHORITY`, `VC`  
**Response:** Returns aggregated counts and metrics for:
- Total events
- Total volunteers
- Total resources needed/available
- Active/completed assignments

---

## Access Control Summary Table

| Resource | Operation | AUTHORITY | VC | SUV |
|----------|-----------|-----------|-----|-----|
| **Authentication** | Register/Login | ✅ | ✅ | ✅ |
| **Users** | Create | ❌ | ❌ | ❌ |
| | Read (List All) | ✅ | ✅ | ❌ |
| | Read (Single/Own) | ✅ | ✅ | ✅ |
| | Update (Own Profile) | ✅ | ✅ | ✅ |
| | Update (Admin Fields) | ✅ | ✅ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| **Events** | Create | ✅ | ❌ | ❌ |
| | Read (List/Single) | ✅ | ✅ | ✅ |
| | Update | ✅ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| | Ingest (OSM API) | ✅ | ❌ | ❌ |
| **Resources Needed** | Create | ✅ | ✅ | ❌ |
| | Read (List/Single) | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ❌ |
| | Delete | ✅ | ✅ | ❌ |
| **Resources Available** | Create | ✅ | ✅ | ✅ |
| | Read (List/Single) | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ✅ |
| | Delete | ✅ | ✅ | ✅ |
| **Volunteers** | Create | ✅ | ✅ | ✅ |
| | Read (List/Single) | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ✅ |
| | Delete | ✅ | ✅ | ✅ |
| **Locations** | Create | ✅ | ✅ | ❌ |
| | Read (List/Single) | ✅ | ✅ | ❌ |
| | Update | ✅ | ✅ | ❌ |
| | Delete | ✅ | ✅ | ❌ |
| **Statistics** | Read | ✅ | ✅ | ❌ |

---

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require authentication via JWT token.

Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained by logging in via `/auth/login` and expire after 60 minutes.

---

## Error Responses

- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Authenticated but insufficient permissions for the requested operation
- **404 Not Found** - Resource not found
- **422 Unprocessable Entity** - Validation error in request body
- **500 Internal Server Error** - Server error

---

## Example Usage

### Register and Login
```bash
# Register a new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Volunteer",
    "email": "john@example.com",
    "phonenumber": "+4512345678",
    "password": "SecurePass123"
  }'

# Login to get token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Response: {"access_token": "eyJ...", "token_type": "bearer"}
```

### Make Authenticated Requests
```bash
# Get current user info
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJ..."

# Report an available resource (SUV can do this)
curl -X POST http://localhost:8000/resources/available/ \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "resource_type": "Vehicle",
    "quantity": 1,
    "volunteer_id": 123
  }'

# View events (SUV can read)
curl -X GET http://localhost:8000/events/ \
  -H "Authorization: Bearer eyJ..."
```

---

## Notes

- **SUV users** (standard volunteers) have limited write access - they can:
  - Report available resources
  - Manage volunteer information
  - View events and resources needed (read-only)
  
- **VC users** (volunteer coordinators) have broader access but cannot:
  - Delete users
  - Create/update/delete events
  - Use event ingest endpoint

- **AUTHORITY users** (admins) have full access to all operations

- Role assignment can only be done by AUTHORITY or VC users via the `/users/{user_id}/admin` endpoint
