#!/usr/bin/env python3
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set environment to avoid unicode issues
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Import and run the main app
try:
    from app import app, init_database
    print("Starting Refinify Backend...")
    init_database()
    print("Database initialized")
    app.run(debug=True, host='0.0.0.0', port=8000)
except Exception as e:
    print(f"Error starting app: {e}")
    sys.exit(1)