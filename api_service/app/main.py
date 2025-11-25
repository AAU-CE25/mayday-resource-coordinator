from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from .db import create_db_and_tables, check_database_health
from .routes import auth_router, user_router, event_router, location_router, resource_router, volunteer_router, stats_router, ws_router
from .core.config import settings
print("event_router type:", type(event_router))

import asyncio
import asyncpg

create_db_and_tables()

app = FastAPI(title="MDay API Service")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://frontend_container:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(event_router)
app.include_router(location_router)
app.include_router(resource_router)
app.include_router(volunteer_router)
app.include_router(stats_router)
app.include_router(ws_router)


@app.get("/health")
def health_check():
    db_ok = check_database_health()
    return {"database": "ok" if db_ok else "error"}

