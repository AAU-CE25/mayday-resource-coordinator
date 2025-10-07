from pydantic import BaseModel
from datetime import datetime as dt
from typing import Optional

# ------------------ User ------------------
class UserCreate(BaseModel):
    name: str
    email: str

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    model_config = {
        "from_attributes": True
    }


# ------------------ Location ------------------
class LocationCreate(BaseModel):
    region: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationUpdate(BaseModel):
    id: int
    region: str | None = None
    address: str | None = None
    postcode: str | None = None
    latitude: float | None = None
    longitude: float | None = None

class LocationResponse(BaseModel):
    id: int
    region: str
    address: str
    postcode: str
    latitude: float
    longitude: float
    model_config = {
        "from_attributes": True
    }

# ------------------ Event ------------------
class EventCreate(BaseModel):
    description: str
    priority: int
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
    model_config = {
        "from_attributes": True
    }


# ------------------ ResourceNeeded ------------------
class ResourceNeededCreate(BaseModel):
    name: str
    resource_type: str
    description: str
    quantity: int
    is_fulfilled: bool = False
    event_id: int

class ResourceNeededUpdate(BaseModel):
    name: str | None = None
    resource_type: str | None = None
    description: str | None = None
    quantity: int | None = None
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
    quantity: int
    description: str
    status: str
    volunteer_id: int
    is_allocated: bool = False

class ResourceAvailableUpdate(BaseModel):
    name: str | None = None
    resource_type: str | None = None
    quantity: int | None = None
    description: str | None = None
    status: str | None = None
    volunteer_id: int | None = None
    is_allocated: bool | None = None

class ResourceAvailableResponse(BaseModel):
    id: int
    name: str
    resource_type: str
    quantity: int
    description: str
    status: str
    volunteer_id: int
    is_allocated: bool
    model_config = {
        "from_attributes": True
    }


# ------------------ Volunteer ------------------
class VolunteerCreate(BaseModel):
    name: str
    email: str
    phonenumber: str
    availability: str
    event_id: int
    location_id: int

class VolunteerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phonenumber: str | None = None
    availability: str | None = None
    event_id: int | None = None
    location_id: int | None = None

class VolunteerResponse(BaseModel):
    id: int
    name: str
    email: str
    phonenumber: str
    availability: str
    event_id: int
    location_id: int
    model_config = {
        "from_attributes": True
    }
