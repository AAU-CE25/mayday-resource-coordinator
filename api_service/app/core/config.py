from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional

# Load .env file before anything else
load_dotenv()

class Settings(BaseSettings):
    # Database credentials
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None
    POSTGRES_PORT: int = 5432

    # Application settings
    SECRET_KEY: str
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    APP_NAME: str = "disaster-response-api"
    APP_VERSION: str = "1.0.0"

    REVERSE_GEOCODING_ENABLED: bool = False # OSM geocoding
    CORS_ORIGINS: list[str] = ["http://localhost:3000"] # CORS frontend origins

    @property
    def database_url_computed(self) -> str:
        if self.ENVIRONMENT == "local" and self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

settings = Settings()
