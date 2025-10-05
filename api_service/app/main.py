from fastapi import FastAPI
from app.db import create_db_and_tables, check_database_health
from app.api import user_router, event_router

create_db_and_tables()

app = FastAPI(title="API Service")

# Include user API router
app.include_router(user_router)
app.include_router(event_router)

# Health check endpoint
@app.get("/health")
def health_check():
    db_ok = check_database_health()
    return {"database": "ok" if db_ok else "error"}
