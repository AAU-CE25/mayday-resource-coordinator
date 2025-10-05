from sqlmodel import Session, select
from app.models import User
from app.db import engine

class UserDAO:
    @staticmethod
    def create_user(user: User) -> User:
        """Create and persist a new user."""
        with Session(engine) as session:
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    @staticmethod
    def get_user(user_id: int) -> User | None:
        """Retrieve a user by ID."""
        with Session(engine) as session:
            return session.get(User, user_id)

    @staticmethod
    def get_users() -> list[User]:
        """Retrieve all users."""
        with Session(engine) as session:
            return session.exec(select(User)).all()

    @staticmethod
    def update_user(user_id: int, user_data: dict) -> User | None:
        """Update a user by ID."""
        with Session(engine) as session:
            user = session.get(User, user_id)
            if not user:
                return None
            for key, value in user_data.items():
                setattr(user, key, value)
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    @staticmethod
    def delete_user(user_id: int) -> bool:
        """Delete a user by ID."""
        with Session(engine) as session:
            user = session.get(User, user_id)
            if not user:
                return False
            session.delete(user)
            session.commit()
            return {"ok": True}
