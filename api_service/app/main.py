from fastapi import FastAPI
from .db import create_db_and_tables, check_database_health
from .routes import user_router, event_router, location_router, resource_router, volunteer_router

create_db_and_tables()

app = FastAPI(title="MDay API Service V2")

# Include user API router
app.include_router(user_router)
app.include_router(event_router)
app.include_router(location_router)
app.include_router(resource_router)
app.include_router(volunteer_router)

# Health check endpoint
@app.get("/health")
def health_check():
    db_ok = check_database_health()
    return {"database": "ok" if db_ok else "error"}
