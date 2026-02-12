#!/bin/bash

# Quantum Email Client - Full Stack Integration Test
# This script starts all services and verifies the integration

echo "======================================"
echo "Quantum Email Client Integration Test"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

echo "Step 1: Checking ports..."
check_port 8000 || echo "  QKD Simulator port 8000 in use"
check_port 8001 || echo "  Backend port 8001 in use"
check_port 3000 || echo "  Frontend port 3000 in use"
echo ""

echo "Step 2: Starting QKD Simulator (port 8000)..."
cd qkd-simulator
python main.py > ../logs/qkd.log 2>&1 &
QKD_PID=$!
echo -e "${GREEN}  Started with PID: $QKD_PID${NC}"
cd ..

sleep 2

echo ""
echo "Step 3: Testing QKD Simulator..."
curl -s http://127.0.0.1:8000/api/v1/keys/enc_keys > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ QKD Simulator responding${NC}"
else
    echo -e "${RED}  ✗ QKD Simulator not responding${NC}"
fi

echo ""
echo "Step 4: Starting Backend (port 8001)..."
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8001 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}  Started with PID: $BACKEND_PID${NC}"
cd ..

sleep 3

echo ""
echo "Step 5: Testing Backend..."
curl -s http://127.0.0.1:8001/health > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Backend responding${NC}"
else
    echo -e "${RED}  ✗ Backend not responding${NC}"
fi

echo ""
echo "Step 6: Starting Frontend (port 3000)..."
cd quantum-mail-frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}  Started with PID: $FRONTEND_PID${NC}"
cd ..

echo ""
echo "======================================"
echo "Services Started:"
echo "  QKD Simulator: http://localhost:8000 (PID: $QKD_PID)"
echo "  Backend API:   http://localhost:8001 (PID: $BACKEND_PID)"
echo "  Frontend:      http://localhost:3000 (PID: $FRONTEND_PID)"
echo "======================================"
echo ""
echo "Logs are being written to:"
echo "  logs/qkd.log"
echo "  logs/backend.log"
echo "  logs/frontend.log"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo "  kill $QKD_PID $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or save this to a file:"
echo "  echo '$QKD_PID $BACKEND_PID $FRONTEND_PID' > .pids"
echo "  # Later: kill \$(cat .pids)"
echo ""
echo -e "${GREEN}Integration test complete!${NC}"
echo "Wait about 10 seconds for frontend to fully load, then check:"
echo "  - Electron app should open automatically"
echo "  - Try sending an encrypted email"
echo "  - Try fetching and decrypting emails"
