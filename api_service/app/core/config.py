# api_service/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_ignore_empty=True,   # ignore empty values instead of raising
        extra="ignore",          # ignore extra vars not defined in Settings
    )

    # Database credentials
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str 
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432

    @property
    def database_url_computed(self) -> str:
        """Compute database URL from components or use direct URL"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        print(f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}")
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
