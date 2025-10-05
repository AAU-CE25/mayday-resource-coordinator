from sqlmodel import Session, select

from api_service.app.models import User
from domain.schemas import UserCreate
from api_service.app.db import engine

class UserDAO:
    @staticmethod
    def create_user(user_data: UserCreate) -> User:
        """Create and persist a new user."""
        with Session(engine) as session:
            # Get current max id
            last_user = session.query(User).order_by(User.id.desc()).first()
            new_id = last_user.id + 1 if last_user else 0

            # Create new User instance
            new_user = User(
                id=new_id,
                name=user_data.name,
                email=user_data.email,
                # ... add other fields here ...
            )

            # Persist to DB
            session.add(new_user)
            session.commit()
            session.refresh(new_user)

            return new_user

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
