"""
Utility script to drop and recreate database tables for development/testing.
Run with:

    python -m api_service.scripts.reset_db

Warning: this will delete all data in the database referenced by your config.
"""
from api_service.app.db import drop_db_and_tables, create_db_and_tables

if __name__ == "__main__":
    print("Dropping all tables...")
    drop_db_and_tables()
    print("Creating tables...")
    create_db_and_tables()
    print("Done.")
