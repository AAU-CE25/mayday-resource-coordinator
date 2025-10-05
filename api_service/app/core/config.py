from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url_computed: str = "sqlite:///./test.db"  # Replace with your DB URL

settings = Settings()