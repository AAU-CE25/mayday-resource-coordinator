"""
Migration script to add event_id column to resourceavailable table
"""
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent.parent))

from api_service.app.db import get_session
from sqlmodel import text

def migrate():
    """Add event_id column to resourceavailable table"""
    session = next(get_session())
    
    try:
        # Check if column already exists
        result = session.exec(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='resourceavailable' AND column_name='event_id'
        """))
        
        if result.first():
            print("✓ Column 'event_id' already exists in resourceavailable table")
            return
        
        # Add the column
        print("Adding event_id column to resourceavailable table...")
        session.exec(text("""
            ALTER TABLE resourceavailable 
            ADD COLUMN event_id INTEGER REFERENCES event(id)
        """))
        session.commit()
        print("✓ Successfully added event_id column to resourceavailable table")
        
    except Exception as e:
        session.rollback()
        print(f"✗ Error during migration: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
