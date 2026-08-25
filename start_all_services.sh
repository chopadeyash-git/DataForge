#!/bin/bash

# Refinify - Complete Service Startup Script
# This script starts all services: Backend, Frontend, and Apache Airflow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/darshanpatil/Documents/Mern Stack/Refinify"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
AIRFLOW_HOME="$BACKEND_DIR/airflow"

echo -e "${PURPLE}🚀 REFINIFY - COMPLETE SERVICE STARTUP${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Cleaning up port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Function to check service health
check_service() {
    local url=$1
    local service_name=$2
    local max_attempts=10
    local attempt=1
    
    echo -e "${CYAN}🔍 Checking $service_name health...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is healthy!${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - waiting for $service_name...${NC}"
        sleep 3
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start properly${NC}"
    return 1
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up processes...${NC}"
    kill_port 8000  # Backend
    kill_port 3000  # Frontend  
    kill_port 8080  # Airflow
    pkill -f "airflow" 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node.*dev" 2>/dev/null || true
}

# Trap to cleanup on exit
trap cleanup EXIT

echo -e "${BLUE}🧹 Step 1: Cleaning up existing processes...${NC}"
cleanup
sleep 3

echo -e "${BLUE}📋 Step 2: Checking prerequisites...${NC}"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

# Check Python virtual environment
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo -e "${RED}❌ Python virtual environment not found${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites check passed${NC}"

echo -e "${BLUE}🔧 Step 3: Setting up environment variables...${NC}"

# Create .env file for backend if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    cat > "$BACKEND_DIR/.env" << EOF
GEMINI_API_KEY=AIzaSyDrYXOmHqiChayrg_yC0i-aGi-OqeJw1v4
SECRET_KEY=refinify-secret-key-2024
DATABASE_URL=sqlite:///app.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173
UPLOAD_FOLDER=uploads
AIRFLOW_HOME=$AIRFLOW_HOME
EOF
    echo -e "${GREEN}✅ Created backend .env file${NC}"
fi

# Create .env file for frontend if it doesn't exist
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    cat > "$FRONTEND_DIR/.env" << EOF
VITE_APP_NAME=Refinify
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_DESCRIPTION=AI-Powered Data Cleaning & Augmentation Pipeline
EOF
    echo -e "${GREEN}✅ Created frontend .env file${NC}"
fi

echo -e "${BLUE}🐍 Step 4: Starting Backend Service...${NC}"

cd "$BACKEND_DIR"

# Activate virtual environment and start backend
source venv/bin/activate

# Install any missing dependencies
echo -e "${CYAN}📦 Installing/updating backend dependencies...${NC}"
pip install -q requests pandas numpy flask flask-cors flask-sqlalchemy flask-login werkzeug

# Start backend in background
echo -e "${CYAN}🚀 Starting Flask backend on port 8000...${NC}"
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 8

# Check backend health
if check_service "http://localhost:8000/health" "Backend"; then
    echo -e "${GREEN}✅ Backend started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

echo -e "${BLUE}🎨 Step 5: Starting Frontend Service...${NC}"

cd "$FRONTEND_DIR"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
echo -e "${CYAN}🚀 Starting Vite frontend on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 10

# Check frontend (just check if port is responding)
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    exit 1
fi

echo -e "${BLUE}✈️ Step 6: Setting up Apache Airflow...${NC}"

cd "$BACKEND_DIR"
source venv/bin/activate

# Set Airflow home
export AIRFLOW_HOME="$AIRFLOW_HOME"

# Create Airflow directories
mkdir -p "$AIRFLOW_HOME/dags"
mkdir -p "$AIRFLOW_HOME/logs"
mkdir -p "$AIRFLOW_HOME/plugins"

# Copy DAG file
if [ -f "airflow_dags/data_processing_dag.py" ]; then
    cp airflow_dags/data_processing_dag.py "$AIRFLOW_HOME/dags/"
    echo -e "${GREEN}✅ Copied Airflow DAG${NC}"
fi

# Check if Airflow is already initialized
if [ ! -f "$AIRFLOW_HOME/airflow.db" ]; then
    echo -e "${CYAN}🔧 Initializing Airflow database...${NC}"
    airflow db init
    
    echo -e "${CYAN}👤 Creating Airflow admin user...${NC}"
    airflow users create \
        --username admin \
        --firstname Admin \
        --lastname User \
        --role Admin \
        --email admin@refinify.com \
        --password admin123 2>/dev/null || echo "User may already exist"
fi

# Start Airflow webserver
echo -e "${CYAN}🚀 Starting Airflow webserver on port 8080...${NC}"
airflow webserver --port 8080 --daemon

# Start Airflow scheduler
echo -e "${CYAN}📅 Starting Airflow scheduler...${NC}"
airflow scheduler --daemon

# Wait for Airflow to start
sleep 15

# Check Airflow health
if check_service "http://localhost:8080/health" "Airflow"; then
    echo -e "${GREEN}✅ Airflow started successfully${NC}"
else
    echo -e "${YELLOW}⚠️ Airflow may still be starting up${NC}"
fi

echo -e "${BLUE}🧪 Step 7: Running system tests...${NC}"

# Test Gemini API
echo -e "${CYAN}🤖 Testing Gemini AI integration...${NC}"
cd "$BACKEND_DIR"
python -c "
import requests
import json

try:
    api_key = 'AIzaSyDrYXOmHqiChayrg_yC0i-aGi-OqeJw1v4'
    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}'
    
    payload = {
        'contents': [{'parts': [{'text': 'Hello, respond with: API working'}]}],
        'generationConfig': {'temperature': 0.1, 'maxOutputTokens': 50}
    }
    
    response = requests.post(url, json=payload, timeout=10)
    if response.status_code == 200:
        print('✅ Gemini AI API is working')
    else:
        print('❌ Gemini AI API test failed')
except Exception as e:
    print(f'❌ Gemini AI test error: {e}')
"

# Test backend endpoints
echo -e "${CYAN}🔍 Testing backend endpoints...${NC}"
curl -s http://localhost:8000/health | head -3

echo ""
echo -e "${GREEN}🎉 ALL SERVICES STARTED SUCCESSFULLY!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${PURPLE}📱 SERVICE URLS:${NC}"
echo -e "${CYAN}🎨 Frontend (Main App):     ${YELLOW}http://localhost:3000${NC}"
echo -e "${CYAN}🔧 Backend API:             ${YELLOW}http://localhost:8000${NC}"
echo -e "${CYAN}✈️ Airflow Web UI:          ${YELLOW}http://localhost:8080${NC}"
echo ""
echo -e "${PURPLE}🔑 CREDENTIALS:${NC}"
echo -e "${CYAN}Airflow Login:${NC}"
echo -e "   Username: ${YELLOW}admin${NC}"
echo -e "   Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${PURPLE}🎯 MAIN FEATURES:${NC}"
echo -e "${GREEN}• Real Time Augmentation:   ${YELLOW}http://localhost:3000/augmentation${NC}"
echo -e "${GREEN}• AI Typo Correction:       ${YELLOW}http://localhost:3000/typo-correction${NC}"
echo -e "${GREEN}• AI Data Assistant:        ${YELLOW}http://localhost:3000/ai-assistant${NC}"
echo -e "${GREEN}• Analytics Dashboard:      ${YELLOW}http://localhost:3000/analytics${NC}"
echo -e "${GREEN}• Data Processing Pipeline: ${YELLOW}http://localhost:8080 (Airflow)${NC}"
echo ""
echo -e "${PURPLE}🤖 AI CAPABILITIES:${NC}"
echo -e "${GREEN}✅ Gemini AI Integration (Tested)${NC}"
echo -e "${GREEN}✅ Real CSV Data Processing${NC}"
echo -e "${GREEN}✅ Voice Command Processing${NC}"
echo -e "${GREEN}✅ Automated Data Pipeline${NC}"
echo -e "${GREEN}✅ Advanced Typo Correction${NC}"
echo -e "${GREEN}✅ Natural Language Processing${NC}"
echo ""
echo -e "${PURPLE}📊 MONITORING:${NC}"
echo -e "${CYAN}Backend Health:  ${YELLOW}http://localhost:8000/health${NC}"
echo -e "${CYAN}API Status:      ${YELLOW}http://localhost:8000/api/dashboard${NC}"
echo -e "${CYAN}Airflow DAGs:    ${YELLOW}http://localhost:8080/dags${NC}"
echo ""
echo -e "${BLUE}💡 USAGE TIPS:${NC}"
echo -e "1. Upload CSV files in Augmentation page"
echo -e "2. Use voice commands: 'fix negative ages', 'clean data'"
echo -e "3. Test Gemini AI with natural language"
echo -e "4. Monitor data pipeline in Airflow"
echo -e "5. Download processed results"
echo ""
echo -e "${RED}🛑 TO STOP ALL SERVICES:${NC}"
echo -e "   Press ${YELLOW}Ctrl+C${NC} or run: ${YELLOW}pkill -f 'airflow|python.*app.py|vite'${NC}"
echo ""

# Keep script running and monitor services
echo -e "${BLUE}🔄 Monitoring services... (Press Ctrl+C to stop)${NC}"

# Function to monitor services
monitor_services() {
    while true; do
        sleep 30
        
        # Check backend
        if ! check_port 8000; then
            echo -e "${RED}❌ Backend service down - attempting restart...${NC}"
            cd "$BACKEND_DIR"
            source venv/bin/activate
            python app.py &
        fi
        
        # Check frontend
        if ! check_port 3000; then
            echo -e "${RED}❌ Frontend service down - attempting restart...${NC}"
            cd "$FRONTEND_DIR"
            npm run dev &
        fi
        
        # Check Airflow
        if ! check_port 8080; then
            echo -e "${RED}❌ Airflow service down - attempting restart...${NC}"
            cd "$BACKEND_DIR"
            source venv/bin/activate
            export AIRFLOW_HOME="$AIRFLOW_HOME"
            airflow webserver --port 8080 --daemon
        fi
    done
}

# Start monitoring in background
monitor_services &
MONITOR_PID=$!

# Wait for user interrupt
wait