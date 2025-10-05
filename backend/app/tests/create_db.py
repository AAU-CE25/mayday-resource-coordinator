from sqlalchemy import Engine
from sqlmodel import Session, select
from sqlmodel import SQLModel, create_engine, Session

from models import models


engine = create_engine(
    "postgresql://user:password@172.20.0.2:5432/database",
    echo=True
)

def init(db_engine: Engine) -> None:
    try:
        with Session(db_engine) as session:
            # Try to create session to check if DB is awake
            session.exec(select(1))
    except Exception as e:
        raise e
    

init(engine)

try:
    SQLModel.metadata.create_all(engine)
except Exception as e:
    raise