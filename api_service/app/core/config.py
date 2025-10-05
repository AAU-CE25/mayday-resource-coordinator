# api_service/app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    database_url: str | None = Field(default=None, env="DATABASE_URL")

    @property
    def database_url_computed(self) -> str:
        """
        If DATABASE_URL is not set, fall back to SQLite (for local development).
        """
        if self.database_url:
            print("Using DATABASE_URL from environment")
            return self.database_url
        print("DATABASE_URL not set, falling back to SQLite")
        return "sqlite:///./local.db"

settings = Settings()
