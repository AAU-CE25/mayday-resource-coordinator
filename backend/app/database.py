from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings


# Create engine - use computed database URL
engine = create_engine(
    settings.database_url_computed,
    echo=settings.debug,
    pool_pre_ping=True,  # Validates connections before use
)

def create_db_and_tables():
    try:
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