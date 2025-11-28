from pydantic import BaseModel, EmailStr, Field
from datetime import datetime as dt
from typing import Optional

# ------------------ User ------------------
class UserCreate(BaseModel):
    name: str
    email: str
    phonenumber: str
    password: str
    role: str | None = "SUV"

class UserUpdate(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    phonenumber: str | None = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phonenumber: str | None = None
    model_config = {
        "from_attributes": True
    }
class UserLogin(BaseModel):
    email: str
    password: str

class UserToken(BaseModel):
    access_token: str
    token_type: str

# ------------------ Location ------------------
class LocationAddress(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None

class LocationCreate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: LocationAddress| None = None

class LocationUpdate(BaseModel):
    id: int
    address: LocationAddress| None = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationResponse(BaseModel):
    id: int
    address: LocationAddress| None = None
    latitude: float | None = None
    longitude: float | None = None
    model_config = {
        "from_attributes": True
    }

# ------------------ Event ------------------
class EventCreate(BaseModel):
    description: str
    priority: int = Field(ge=1, le=5)  # Add validation: 1-5 only
    status: str
    location: LocationCreate

class EventUpdate(BaseModel):
    id: int
    description: str | None = None
    priority: int | None = None
    status: str | None = None
    location: LocationCreate | None = None

class EventResponse(BaseModel):
    id: int
    description: str
    priority: int
    status: str
    create_time: dt
    modified_time: dt
    location: LocationResponse
    volunteers_count: int = 0
    model_config = {
        "from_attributes": True
    }


# ------------------ ResourceNeeded ------------------
class ResourceNeededCreate(BaseModel):
    name: str
    resource_type: str
    description: str
    quantity: int = Field(ge=1)
    is_fulfilled: bool = False
    event_id: int

class ResourceNeededUpdate(BaseModel):
    name: str | None = None
    resource_type: str | None = None
    description: str | None = None
    quantity: int = Field(None, ge=1)
    is_fulfilled: bool | None = None
    event_id: int | None = None

class ResourceNeededResponse(BaseModel):
    id: int
    name: str
    resource_type: str
    description: str
    quantity: int
    is_fulfilled: bool
    event_id: int
    model_config = {
        "from_attributes": True
    }


# ------------------ ResourceAvailable ------------------
class ResourceAvailableCreate(BaseModel):
    name: str
    resource_type: str
    quantity: int = Field(ge=1)
    description: str
    status: str
    volunteer_id: int
    event_id: int | None = None
    is_allocated: bool = False

class ResourceAvailableUpdate(BaseModel):
    name: str | None = None
    resource_type: str | None = None
    quantity: int = Field(None, ge=1)
    description: str | None = None
    status: str | None = None
    volunteer_id: int | None = None
    event_id: int | None = None
    is_allocated: bool | None = None

class ResourceAvailableResponse(BaseModel):
    id: int
    name: str
    resource_type: str
    quantity: int
    description: str
    status: str
    volunteer_id: int
    event_id: int | None = None
    is_allocated: bool
    model_config = {
        "from_attributes": True
    }


# ------------------ Volunteer ------------------
class VolunteerCreate(BaseModel):
    event_id: int | None = None
    user_id: int | None = None  # Optional - link to user account if they have one
    status: str = "active"  # active | completed

class VolunteerUpdate(BaseModel):
    id: int
    user_id: int | None = None
    event_id: int | None = None
    status: str | None = None

class VolunteerResponse(BaseModel):
    id: int
    user: UserResponse | None = None  # Optional - only if linked to a user account
    event_id: int | None = None
    status: str
    create_time: dt
    completion_time: dt | None = None
    model_config = {
        "from_attributes": True
    }


# ------------------ Stats ------------------
class StatsResponse(BaseModel):
    activeEvents: int
    totalVolunteers: int
    resourcesAvailable: int
    totalLocations: int
    model_config = {
        "from_attributes": True
    }
