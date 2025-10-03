from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    location_id: int = Field(..., description="ID of the location")
    description: str = Field(..., min_length=1, max_length=1000, description="Event description")
    priority: int = Field(..., ge=1, le=5, description="Priority level (1-5)")
    status: str = Field(default="active", description="Event status")

class EventResponse(BaseModel):
    id: int
    location_id: int
    description: str
    datetime: datetime
    priority: int
    status: str
    
    class Config:
        from_attributes = True

class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error message")