from pydantic import BaseModel
from datetime import datetime as dt

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

    class Config:
        from_attributes = True


# ------------------ Location ------------------
class LocationCreate(BaseModel):
    region: str
    address: str
    postcode: str
    latitude: float
    longitude: float

class LocationUpdate(BaseModel):
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

    class Config:
        from_attributes = True


# ------------------ Event ------------------
class EventCreate(BaseModel):
    location_id: int
    description: str
    datetime: dt
    priority: int
    status: str = "active"

class EventUpdate(BaseModel):
    location_id: int | None = None
    description: str | None = None
    datetime: dt | None = None
    priority: int | None = None
    status: str | None = None

class EventResponse(BaseModel):
    id: int
    location_id: int
    description: str
    datetime: dt
    priority: int
    status: str

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True
