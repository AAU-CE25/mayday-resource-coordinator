from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import create_db_and_tables, check_database_health
from .routes import auth_router, user_router, event_router, location_router, resource_router, volunteer_router, stats_router

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
    
    # Kubernetes internal service names (for pod-to-pod communication)
    "http://api-service.mayday.svc.cluster.local",
    "http://frontend-service.mayday.svc.cluster.local",
    "http://suv-ui-service.mayday.svc.cluster.local",
]

# Add environment variable support for cloud LoadBalancer URLs
import os
frontend_url = os.getenv("FRONTEND_URL")
suv_ui_url = os.getenv("SUV_UI_URL")
api_url = os.getenv("API_URL")

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
    allow_origins=origins,      # or ["*"] for all origins (dev only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include user API router
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(event_router)
app.include_router(location_router)
app.include_router(resource_router)
app.include_router(volunteer_router)
app.include_router(stats_router)

# Health check endpoint
@app.get("/health")
def health_check():
    db_ok = check_database_health()
    return {"database": "ok" if db_ok else "error"}
