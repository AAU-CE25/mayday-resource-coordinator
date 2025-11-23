from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import create_db_and_tables, check_database_health
from .routes import auth_router, user_router, event_router, location_router, resource_router, volunteer_router, stats_router

# Initialize database
create_db_and_tables()

app = FastAPI(title="MDay API Service")

# Add CORS middleware before including routers
origins = [
    "http://localhost:3000",   # Frontend dev server
    "http://localhost:3030",   # SUV UI dev server
    "http://localhost:5173",   # React dev server (Vite default)
    "http://127.0.0.1:5173",
    "http://frontend_container:3000",   # optional - if frontend runs in Docker
    "http://suv_ui_container:3030",   # optional - if suv ui runs in Docker
]

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
