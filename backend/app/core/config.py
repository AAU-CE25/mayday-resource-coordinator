import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database settings loaded from environment variables
    database_url: Optional[str] = os.getenv("DATABASE_URL", "myuser")
    postgres_user: str = os.getenv("POSTGRES_USER", "myuser")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "mypassword")
    postgres_db: str = os.getenv("POSTGRES_DB", "mydb")
    postgres_host: str = os.getenv("POSTGRES_HOST", "db")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", 5432))

    debug: bool = False

    class Config:
        # Relative path: two folders up from this file
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"

    @property
    def database_url_computed(self) -> str:
        """Compute database URL from components or use direct URL"""
        if self.database_url:
            return self.database_url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

settings = Settings()
