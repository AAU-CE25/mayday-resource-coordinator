from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import (
    AnyUrl,
    BeforeValidator,
    computed_field,
)
from typing import Optional
from typing import Annotated, Literal, Any

def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # env_file="../.env",      # <--- tells Pydantic where to look
        env_ignore_empty=True,   # ignore empty values instead of raising
        extra="ignore",          # ignore extra vars not defined in Settings
    )
    
    PROJECT_NAME: str = "Disaster Response Coordinator"

    # Database settings
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str 
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    
    # App settings
    SECRET_KEY: str
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Disaster Response Coordinator API"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]
    
    @property
    def database_url_computed(self) -> str:
        """Compute database URL from components or use direct URL"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
