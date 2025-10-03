from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database settings
    database_url: Optional[str] = None
    postgres_user: str = "postgres"
    postgres_password: str = "password"
    postgres_db: str = "disaster_response"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    
    # App settings
    secret_key: str = "dev-secret-key-change-in-production"
    debug: bool = True
    environment: str = "development"
    app_name: str = "disaster-response-api"
    app_version: str = "1.0.0"
    
    class Config:
        env_file = ".env"
    
    @property
    def database_url_computed(self) -> str:
        """Compute database URL from components or use direct URL"""
        if self.database_url:
            return self.database_url
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

settings = Settings()