from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    create_time: datetime = Field(default=None)
    modified_time: datetime = Field(default=None)
    priority: int
    status: str
    location_id: int = Field(default=None, foreign_key="location.id")

class ResourceNeeded(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    resource_type: str
    description: str
    quantity: int
    is_fulfilled: bool
    event_id: int = Field(foreign_key="event.id")

class ResourceAvailable(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    resource_type: str
    quantity: int
    description: str
    status: str
    volunteer_id: int = Field(foreign_key="volunteer.id")
    is_allocated: bool

class Volunteer(SQLModel, table=True):
    id: int = Field(primary_key=True) 
    phonenumber: str
    availability: str
    location_id: Optional[int] = Field(default=None, foreign_key="location.id") # added as OPTIONAL
    user_id: int = Field(default=None, foreign_key="user.id")  

class Location(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # full_address: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float

class User(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    email: str
    password: str
    role: str = Field(default="SUV")  # SUV | VC | AUTHORITY