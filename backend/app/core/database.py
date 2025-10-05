from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from app.models.models import *

# Create engine - use computed database URL
engine = create_engine(
    settings.database_url_computed,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # Validates connections before use
)

def init_db():
    try:
        print(settings.database_url_computed)
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        raise

def get_session():
    with Session(engine) as session:
        yield session

# Health check function
def check_database_health():
    try:
        with Session(engine) as session:
            session.exec("SELECT 1")
        return True
    except Exception as e:
        return False