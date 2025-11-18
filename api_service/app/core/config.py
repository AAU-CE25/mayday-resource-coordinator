from enum import Enum
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env file before anything else so that local development works without
# exporting every variable manually.
load_dotenv()


class Environment(str, Enum):
    LOCAL = "local"
    DEVELOPMENT = "development"
    TEST = "test"
    PRODUCTION = "production"


DEFAULT_DEV_SECRET = "local-dev-secret"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database credentials
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None
    POSTGRES_PORT: int = 5432

    # Application settings
    SECRET_KEY: str = Field(default=DEFAULT_DEV_SECRET)
    DEBUG: bool = False
    ENVIRONMENT: Environment = Environment.LOCAL
    APP_NAME: str = "disaster-response-api"
    APP_VERSION: str = "1.0.0"

    REVERSE_GEOCODING_ENABLED: bool = False  # OSM geocoding
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    @model_validator(mode="after")
    def ensure_secure_configuration(self):
        if (
            self.ENVIRONMENT == Environment.PRODUCTION
            and self.SECRET_KEY == DEFAULT_DEV_SECRET
        ):
            raise ValueError(
                "SECRET_KEY must be provided for production deployments. "
                "Set the SECRET_KEY environment variable."
            )
        return self

    @property
    def database_url_computed(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        required_parts = {
            "POSTGRES_USER": self.POSTGRES_USER,
            "POSTGRES_PASSWORD": self.POSTGRES_PASSWORD,
            "POSTGRES_DB": self.POSTGRES_DB,
            "POSTGRES_HOST": self.POSTGRES_HOST,
        }
        missing = [name for name, value in required_parts.items() if not value]

        if missing:
            raise ValueError(
                "DATABASE_URL is not set and the following POSTGRES_* values are "
                f"missing: {', '.join(missing)}. Provide either DATABASE_URL or the "
                "individual POSTGRES_* variables."
            )

        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
