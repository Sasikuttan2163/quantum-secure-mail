#!/bin/bash
# Quick start script for Quantum Email Backend
# This script starts both QKD simulator and backend in the background

echo "=================================================="
echo "Starting Quantum Email Backend Services"
echo "=================================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "❌ Dependencies not installed. Run: pip install -r requirements.txt"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Using default configuration."
    echo "   Copy .env.example to .env and configure your SMTP settings."
fi

# Start QKD Simulator
echo ""
echo "Starting QKD KME Simulator on port 8000..."
cd qkd-simulator
python3 main.py > ../logs/qkd-simulator.log 2>&1 &
QKD_PID=$!
cd ..

sleep 2

# Start Backend
echo "Starting Backend API on port 8001..."
cd backend
python3 main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# Save PIDs
mkdir -p logs
echo $QKD_PID > logs/qkd.pid
echo $BACKEND_PID > logs/backend.pid

echo ""
echo "=================================================="
echo "✅ Services Started Successfully!"
echo "=================================================="
echo "QKD Simulator: http://localhost:8000 (PID: $QKD_PID)"
echo "Backend API:   http://localhost:8001 (PID: $BACKEND_PID)"
echo ""
echo "Logs:"
echo "  - QKD Simulator: logs/qkd-simulator.log"
echo "  - Backend:       logs/backend.log"
echo ""
echo "To test the setup, run:"
echo "  python3 test_backend.py"
echo ""
echo "To stop the services, run:"
echo "  ./stop.sh"
echo "=================================================="
