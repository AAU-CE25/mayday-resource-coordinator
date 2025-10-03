from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from app.database import create_db_and_tables
from app.api.routes import events, volunteers, resources, locations
from app.core.config import settings

# Enhanced FastAPI app with custom OpenAPI
app = FastAPI(
    title="Disaster Response Coordinator API",
    description="""
    ## Disaster Response Management System
    
    This API helps coordinate disaster response efforts by managing:
    
    * **Events** - Disaster events and incidents
    * **Volunteers** - People available to help
    * **Resources** - Available and needed resources
    * **Locations** - Geographic areas affected
    
    ### Key Features
    - Real-time resource tracking
    - Volunteer coordination
    - Event management
    - Location-based services
    """,
    version="1.0.0",
    terms_of_service="http://example.com/terms/",
    contact={
        "name": "Disaster Response Team",
        "url": "http://example.com/contact/",
        "email": "support@disaster-response.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    # Custom docs URLs
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Disaster Response API",
        version="1.0.0",
        description="API for coordinating disaster response efforts",
        routes=app.routes,
    )
    
    # Add custom info
    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }
    
    # Add tags metadata
    openapi_schema["tags"] = [
        {
            "name": "events",
            "description": "Manage disaster events and incidents",
        },
        {
            "name": "volunteers", 
            "description": "Coordinate volunteers and their availability",
        },
        {
            "name": "resources",
            "description": "Track available and needed resources",
        },
        {
            "name": "locations",
            "description": "Manage geographic locations and regions",
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefixes
app.include_router(events.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/", tags=["root"])
def root():
    """
    Root endpoint - returns basic API information
    """
    return {
        "message": "Disaster Response Coordinator API", 
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health", tags=["health"])
def health_check():
    """
    Health check endpoint for monitoring
    """
    return {"status": "healthy", "service": "disaster-response-api"}