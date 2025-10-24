from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional

# Load .env file before anything else
load_dotenv()

class Settings(BaseSettings):
    # Appl settings
    ENVIRONMENT: str = "local"

    # Database credentials
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    APP_NAME: str = "disaster-response-api"
    APP_VERSION: str = "1.0.0"

    @property
    def database_url_computed(self) -> str:
        if self.ENVIRONMENT == "local" and self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

settings = Settings()
