"""
Integration file to add project collaboration to existing Refinify app
Add this to your main app.py file
"""

# Add these imports to your existing app.py
from routes.project_routes import project_bp
from models.project_models import db as project_db

# Register the project blueprint (add this after your existing route registrations)
def register_project_routes(app):
    """Register project collaboration routes"""
    try:
        # Register the project blueprint
        app.register_blueprint(project_bp)
        print("✅ Project collaboration routes registered successfully")
        
        # Ensure project models use the same db instance
        from models.project_models import Organization, Project, ProjectMember, DatasetVersion, Operation, ProjectActivity
        print("✅ Project models imported successfully")
        
        return True
    except Exception as e:
        print(f"❌ Error registering project routes: {e}")
        return False

# Add JWT support for project routes (if not already present)
def setup_jwt_auth(app):
    """Setup JWT authentication for project routes"""
    try:
        from flask_jwt_extended import JWTManager
        
        # Configure JWT
        app.config['JWT_SECRET_KEY'] = app.config.get('SECRET_KEY', 'your-secret-key')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire
        
        jwt = JWTManager(app)
        
        @jwt.user_identity_loader
        def user_identity_lookup(user):
            return user.id if hasattr(user, 'id') else user
        
        @jwt.user_lookup_loader
        def user_lookup_callback(_jwt_header, jwt_data):
            from app import User  # Import your existing User model
            identity = jwt_data["sub"]
            return User.query.filter_by(id=identity).one_or_none()
        
        print("✅ JWT authentication configured for project routes")
        return True
        
    except ImportError:
        print("⚠️ flask-jwt-extended not installed. Install with: pip install flask-jwt-extended")
        return False
    except Exception as e:
        print(f"❌ Error setting up JWT: {e}")
        return False

# Integration function to call from your main app
def integrate_project_collaboration(app, db):
    """Integrate project collaboration system with existing app"""
    
    print("🚀 Integrating project collaboration system...")
    
    # Setup JWT authentication
    jwt_success = setup_jwt_auth(app)
    
    # Register project routes
    routes_success = register_project_routes(app)
    
    # Create project tables
    try:
        with app.app_context():
            db.create_all()
        print("✅ Project database tables created")
        tables_success = True
    except Exception as e:
        print(f"❌ Error creating project tables: {e}")
        tables_success = False
    
    if routes_success and tables_success:
        print("✅ Project collaboration system integrated successfully!")
        print("\nNew API endpoints available:")
        print("  POST /api/v2/projects/create")
        print("  POST /api/v2/projects/add-member") 
        print("  POST /api/v2/projects/{id}/datasets/add")
        print("  POST /api/v2/projects/{id}/operations/apply")
        print("  GET  /api/v2/projects/{id}/datasets")
        print("  GET  /api/v2/projects/{id}/operations")
        print("  GET  /api/v2/projects/{id}/versions")
        print("  GET  /api/v2/projects/{id}/activity")
        
        if not jwt_success:
            print("\n⚠️ JWT authentication not configured - some features may not work")
            print("   Install flask-jwt-extended and restart the application")
        
        return True
    else:
        print("❌ Project collaboration integration failed")
        return False

# Example usage in your main app.py:
"""
# Add this to your existing app.py file:

from project_integration import integrate_project_collaboration

# After your existing app setup, add:
integrate_project_collaboration(app, db)
"""