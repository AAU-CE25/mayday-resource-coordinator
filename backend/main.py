from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import create_db_and_tables
from backend.api.routes import events, volunteers, resources, locations
from backend.core.config import settings

app = FastAPI(
    title="Disaster Response API",
    description="API for managing disaster response events, volunteers, and resources",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def root():
    return {"message": "Disaster Response API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}