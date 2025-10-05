from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

import logging
import sys
logging.basicConfig(
    level=logging.INFO,  # so info/debug messages show up
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]  # send logs to stdout
)
logger = logging.getLogger(__name__)

from app.core.config import settings
from app.api.main import api_router


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)








# # Enhanced FastAPI app with custom OpenAPI
# app = FastAPI(
#     title="Disaster Response Coordinator API",
#     description="""
#     ## Disaster Response Management System
    
#     This API helps coordinate disaster response efforts by managing:
    
#     * **Events** - Disaster events and incidents
#     * **Volunteers** - People available to help
#     * **Resources** - Available and needed resources
#     * **Locations** - Geographic areas affected
    
#     ### Key Features
#     - Real-time resource tracking
#     - Volunteer coordination
#     - Event management
#     - Location-based services
#     """,
#     version="1.0.0",
#     terms_of_service="http://example.com/terms/",
#     contact={
#         "name": "Disaster Response Team",
#         "url": "http://example.com/contact/",
#         "email": "support@disaster-response.com",
#     },
#     license_info={
#         "name": "MIT",
#         "url": "https://opensource.org/licenses/MIT",
#     },
#     # Custom docs URLs
#     docs_url="/docs",
#     redoc_url="/redoc",
#     openapi_url="/openapi.json"
# )

# # Include the lifespan (runs on startup)
# async def lifespan():
#     create_db_and_tables() 
#     yield

# # Custom OpenAPI schema
# def custom_openapi():
#     if app.openapi_schema:
#         return app.openapi_schema
    
#     openapi_schema = get_openapi(
#         title="Disaster Response API",
#         version="1.0.0",
#         description="API for coordinating disaster response efforts",
#         routes=app.routes,
#     )
    
#     # Add custom info
#     openapi_schema["info"]["x-logo"] = {
#         "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
#     }
    
#     # Add tags metadata
#     openapi_schema["tags"] = [
#         {
#             "name": "events",
#             "description": "Manage disaster events and incidents",
#         },
#         {
#             "name": "volunteers", 
#             "description": "Coordinate volunteers and their availability",
#         },
#         {
#             "name": "resources",
#             "description": "Track available and needed resources",
#         },
#         {
#             "name": "locations",
#             "description": "Manage geographic locations and regions",
#         }
#     ]
    
#     app.openapi_schema = openapi_schema
#     return app.openapi_schema

# app.openapi = custom_openapi
# app.lifespan = lifespan

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Configure for production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(events.router, prefix="/api/v1") 

# @app.get("/", tags=["root"])
# def root():
#     """
#     Root endpoint - returns basic API information
#     """
#     return {
#         "message": "Disaster Response Coordinator API", 
#         "version": "1.0.0",
#         "docs": "/docs",
#         "redoc": "/redoc"
#     }

# @app.get("/health", tags=["health"])
# def health_check():
#     """
#     Health check endpoint for monitoring
#     """
#     return {"status": "healthy", "service": "disaster-response-api"}