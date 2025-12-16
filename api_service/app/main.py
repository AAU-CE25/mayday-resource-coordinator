from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import create_db_and_tables, check_database_health
from .routes import (
    auth_router,
    user_router,
    event_router,
    location_router,
    resource_needed_router,
    resource_available_router,
    volunteer_router,
    stats_router,
)
from .models import User
from .core.config import settings
from .auth.hashing import hash_password

# Initialize database
create_db_and_tables()

app = FastAPI(title="MDay API Service")

# Add CORS middleware before including routers
origins = [
    # Local development
    "http://localhost:3000",   # Frontend dev server
    "http://localhost:3030",   # SUV UI dev server
    "http://localhost:5173",   # React dev server (Vite default)
    "http://127.0.0.1:5173",
    "http://frontend_container:3000",   # optional - if frontend runs in Docker
    "http://suv_ui_container:3030",   # optional - if suv ui runs in Docker
]

# Add environment variable support for cloud LoadBalancer URLs
import os
frontend_url = os.getenv("FRONTEND_URL")
suv_ui_url = os.getenv("SUV_UI_URL")
api_url = os.getenv("API_URL")

# For ECS/cloud deployments with dynamic IPs, set CORS_ALLOW_ALL=true
allow_all_origins = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"

if frontend_url:
    origins.append(frontend_url)
    origins.append(frontend_url.replace("http://", "https://"))  # Support both HTTP and HTTPS
if suv_ui_url:
    origins.append(suv_ui_url)
    origins.append(suv_ui_url.replace("http://", "https://"))
if api_url:
    origins.append(api_url)
    origins.append(api_url.replace("http://", "https://"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else origins,
    allow_credentials=not allow_all_origins,  # credentials not supported with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include user API router
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(event_router)
app.include_router(location_router)
app.include_router(resource_needed_router)
app.include_router(resource_available_router)
app.include_router(volunteer_router)
app.include_router(stats_router)

# Health check endpoint
@app.get("/health")
def health_check():
    db_ok = check_database_health()
    return {"database": "ok" if db_ok else "error"}


# Seed an initial administrator account (if configured and missing)
@app.on_event("startup")
def seed_admin_user():
    admin_email = settings.ADMIN_EMAIL
    admin_password = settings.ADMIN_PASSWORD
    if not admin_email or not admin_password:
        return  # Seeding not configured

    admin_name = settings.ADMIN_NAME or "Administrator"
    admin_phone = settings.ADMIN_PHONE or ""

    # Create admin with AUTHORITY role if missing (DAO enforces unique email)
    hashed_pw = hash_password(admin_password)
    admin_user = User(
        name=admin_name,
        email=admin_email,
        phonenumber=admin_phone,
        password=hashed_pw,
        status="available",
        role="AUTHORITY",
    )
    try:
        from api_service.app.data_access import UserDAO
        UserDAO.create_user(admin_user)
        print("[startup] Created initial administrator:", admin_email)
    except Exception:
        # Likely already exists; keep startup idempotent
        pass
