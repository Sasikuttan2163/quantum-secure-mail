#!/bin/bash

# Stop all Quantum Email Client services

echo "Stopping Quantum Email Client services..."

# Kill by port
echo "Killing processes on ports 8000, 8001, 3000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Also kill by process name
pkill -f "python.*main.py" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
pkill -f "electron" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

echo "All services stopped."
echo ""
echo "Check if any processes are still running:"
echo "  lsof -ti:8000,8001,3000"
