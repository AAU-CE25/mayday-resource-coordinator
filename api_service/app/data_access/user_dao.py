from sqlmodel import Session, select

from api_service.app.models import User
from api_service.app.db import engine
from domain.exceptions import UserExistsException

class UserDAO:
    def create_user(user_data: User) -> User:
        """Create and persist a new user if email doesn't exist; return existing otherwise."""
        with Session(engine) as session:
            # Check if a user with the same email already exists
            query = select(User).where(User.email == user_data.email)
            existing_user = session.exec(query).first()

            if existing_user:
                raise UserExistsException("User already exists with this email.")

            # Otherwise, create and persist the new user
            session.add(user_data)
            session.commit()
            session.refresh(user_data)
            return user_data

    @staticmethod
    def get_user(user_id: int) -> User | None:
        """Retrieve a user by ID."""
        with Session(engine) as session:
            return session.get(User, user_id)

    @staticmethod
    def get_users(skip, limit, status: str | None = None) -> list[User]:
        """Retrieve all users, optionally filtered by status."""
        query = select(User)
        if status:
            query = query.where(User.status == status)

        with Session(engine) as session:
            return session.exec(query.offset(skip).limit(limit)).all()

    @staticmethod
    def update_user(user_id: int, user_update: User) -> User | None:
        """Update a user by ID."""
        with Session(engine) as session:
           # Fetch the existing record first
            existing = session.get(User, user_id)
            if not existing:
                return None  # Don't insert new row

            # Copy updated fields from input object
            for key, value in user_update.model_dump().items():
                if key != "id" and value is not None:
                    setattr(existing, key, value)

            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    @staticmethod
    def delete_user(user_id: int) -> bool:
        """Delete a user by ID."""
        with Session(engine) as session:
            user = session.get(User, user_id)
            if not user:
                return False
            session.delete(user)
            session.commit()
            return True
