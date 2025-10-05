from sqlmodel import Session, select
from app.models import ResourceAvailable, ResourceNeeded
from app.db import engine

class ResourceDAO:
    @staticmethod
    def create_resource_available(resource: ResourceAvailable) -> ResourceAvailable:
        """Create and persist a new available resource."""
        with Session(engine) as session:
            session.add(resource)
            session.commit()
            session.refresh(resource)
            return resource

    @staticmethod
    def get_resource_available(resource_id: int) -> ResourceAvailable | None:
        """Retrieve an available resource by ID."""
        with Session(engine) as session:
            return session.get(ResourceAvailable, resource_id)

    @staticmethod
    def get_resources_available() -> list[ResourceAvailable]:
        """Retrieve all available resources."""
        with Session(engine) as session:
            return session.exec(select(ResourceAvailable)).all()

    @staticmethod
    def update_resource_available(resource_id: int, resource_data: dict) -> ResourceAvailable | None:
        """Update an available resource by ID."""
        with Session(engine) as session:
            resource = session.get(ResourceAvailable, resource_id)
            if not resource:
                return None
            for key, value in resource_data.items():
                setattr(resource, key, value)
            session.add(resource)
            session.commit()
            session.refresh(resource)
            return resource

    @staticmethod
    def delete_resource_available(resource_id: int) -> bool:
        """Delete an available resource by ID."""
        with Session(engine) as session:
            resource = session.get(ResourceAvailable, resource_id)
            if not resource:
                return False
            session.delete(resource)
            session.commit()
            return True

    @staticmethod
    def create_resource_needed(resource: ResourceNeeded) -> ResourceNeeded:
        """Create and persist a new needed resource."""
        with Session(engine) as session:
            session.add(resource)
            session.commit()
            session.refresh(resource)
            return resource

    @staticmethod
    def get_resource_needed(resource_id: int) -> ResourceNeeded | None:
        """Retrieve a needed resource by ID."""
        with Session(engine) as session:
            return session.get(ResourceNeeded, resource_id)

    @staticmethod
    def get_resources_needed() -> list[ResourceNeeded]:
        """Retrieve all needed resources."""
        with Session(engine) as session:
            return session.exec(select(ResourceNeeded)).all()

    @staticmethod
    def update_resource_needed(resource_id: int, resource_data: dict) -> ResourceNeeded | None:
        """Update a needed resource by ID."""
        with Session(engine) as session:
            resource = session.get(ResourceNeeded, resource_id)
            if not resource:
                return None
            for key, value in resource_data.items():
                setattr(resource, key, value)
            session.add(resource)
            session.commit()
            session.refresh(resource)
            return resource

    @staticmethod
    def delete_resource_needed(resource_id: int) -> bool:
        """Delete a needed resource by ID."""
        with Session(engine) as session:
            resource = session.get(ResourceNeeded, resource_id)
            if not resource:
                return False
            session.delete(resource)
            session.commit()
            return True
