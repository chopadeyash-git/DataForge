import os
import sys
from flask import Flask

# Set up basic Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key'
app.config['UPLOAD_FOLDER'] = 'uploads'

# Import the main app after basic setup
try:
    from app import *
    print("Backend starting on http://localhost:8000")
    app.run(debug=True, host='0.0.0.0', port=8000)
except Exception as e:
    print(f"Error: {e}")
    # Try minimal version
    @app.route('/health')
    def health():
        return {'status': 'ok'}
    
    app.run(debug=True, host='0.0.0.0', port=8000)