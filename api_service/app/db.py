from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Create engine
engine = create_engine(
    settings.database_url_computed,
    echo=True,
    pool_pre_ping=True,
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

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
