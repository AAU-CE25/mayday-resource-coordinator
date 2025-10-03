from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "sqlite:///./disaster_response.db"  # Default SQLite
    secret_key: str = "dev-secret-key-change-in-production"  # Default for development
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()