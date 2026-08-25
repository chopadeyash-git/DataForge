"""
Add project collaboration to existing app.py
Add these lines to your app.py file after the existing route definitions
"""

# Add these imports at the top of app.py (after existing imports)
try:
    from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
    from routes.project_routes import project_bp
    
    # Configure JWT
    app.config['JWT_SECRET_KEY'] = app.config.get('SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
    
    jwt = JWTManager(app)
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return user.id if hasattr(user, 'id') else user
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.filter_by(id=identity).one_or_none()
    
    # Register project routes
    app.register_blueprint(project_bp)
    
    print("✅ Project collaboration system integrated successfully!")
    print("New endpoints available:")
    print("  POST /api/v2/projects/create")
    print("  POST /api/v2/projects/add-member")
    print("  POST /api/v2/projects/{id}/datasets/add")
    print("  POST /api/v2/projects/{id}/operations/apply")
    print("  GET  /api/v2/projects/{id}/datasets")
    print("  GET  /api/v2/projects/{id}/operations")
    print("  GET  /api/v2/projects/{id}/versions")
    print("  GET  /api/v2/projects/{id}/activity")
    
    # Add JWT token creation endpoint
    @app.route('/api/auth/token', methods=['POST'])
    @login_required
    def create_jwt_token():
        access_token = create_access_token(identity=current_user.id)
        return jsonify({'access_token': access_token})
    
except ImportError as e:
    print(f"⚠️ Project collaboration not available: {e}")
    print("Install flask-jwt-extended to enable project features")

print("Integration script completed. Add the above code to your app.py file.")