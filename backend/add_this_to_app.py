# Add this code to your app.py file after the existing imports and before if __name__ == '__main__':

# Project Collaboration Integration
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
    
    # Add JWT token creation endpoint
    @app.route('/api/auth/token', methods=['POST'])
    @login_required
    def create_jwt_token():
        access_token = create_access_token(identity=current_user.id)
        return jsonify({'access_token': access_token})
    
    print("✅ Project collaboration system integrated!")
    
except ImportError as e:
    print(f"⚠️ Project collaboration not available: {e}")
    print("Install flask-jwt-extended to enable project features")