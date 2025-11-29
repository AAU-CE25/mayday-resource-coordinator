from sqlmodel import SQLModel, create_engine, Session
from .models import *
from .core.config import settings    

# Create engine
engine = create_engine(
    settings.database_url_computed,
    echo=settings.DB_LOGGING_ENABLED,
    pool_pre_ping=True,
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def drop_db_and_tables():
    """Drop all tables. Use with caution (destructive).

    This is useful in development or test environments when the models
    changed and the database schema needs to be rebuilt.
    """
    SQLModel.metadata.drop_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# Health check
def check_database_health():
    try:
        with Session(engine) as session:
            session.exec("SELECT 1")
        return True
    except Exception:
        return False
    