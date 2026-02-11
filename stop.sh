#!/bin/bash
# Stop script for Quantum Email Backend services

echo "=================================================="
echo "Stopping Quantum Email Backend Services"
echo "=================================================="

# Read PIDs
if [ -f logs/qkd.pid ]; then
    QKD_PID=$(cat logs/qkd.pid)
    if ps -p $QKD_PID > /dev/null; then
        echo "Stopping QKD Simulator (PID: $QKD_PID)..."
        kill $QKD_PID
    fi
    rm logs/qkd.pid
fi

if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping Backend API (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm logs/backend.pid
fi

echo ""
echo "✅ Services stopped"
echo "=================================================="
