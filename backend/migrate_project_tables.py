"""
Database migration script to add project collaboration tables
Run this script to add the new tables to your existing database
"""

from app import app, db
from models.project_models import Organization, Project, ProjectMember, DatasetVersion, Operation, ProjectActivity

def migrate_database():
    """Add new project collaboration tables to existing database"""
    with app.app_context():
        try:
            print("Creating project collaboration tables...")
            
            # Create all new tables
            db.create_all()
            
            print("✅ Project collaboration tables created successfully!")
            print("New tables added:")
            print("  - organizations")
            print("  - projects") 
            print("  - project_members")
            print("  - dataset_versions")
            print("  - operations")
            print("  - project_activities")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False

if __name__ == "__main__":
    migrate_database()