from sqlmodel import SQLModel, Field
from datetime import datetime

class Event(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    location_id: int = Field(default=None, foreign_key="location.id")
    description: str
    datetime: datetime
    priority: int
    status: str

class ResourceNeeded(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    resource_type: str
    description: str
    quantity: int
    is_fulfilled: bool
    event_id: int = Field(foreign_key="event.id")

class ResourceAvailable(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    resource_type: str
    quantity: int
    description: str
    status: str
    volunteer_id: int = Field(foreign_key="volunteer.id")
    is_allocated: bool

class Volunteer(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    email: str
    phonenumber: str
    availability: str
    event_id: int = Field(default=None, foreign_key="event.id")
    location_id: int = Field(default=None, foreign_key="location.id")

class Location(SQLModel, table=True):
    id: int = Field(primary_key=True)
    region: str
    address: str
    postcode: str
    latitude: float
    longitude: float
