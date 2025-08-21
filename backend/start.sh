#!/bin/bash

# Casino Card Game Backend Startup Script

echo "Starting Casino Card Game Backend..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if requirements are installed
if [ ! -d "Lib" ] || [ ! -f "requirements.txt" ]; then
    echo "Installing requirements..."
    pip3 install -r requirements.txt
fi

# Set environment variables
export PORT=8000
export HOST=0.0.0.0

# Start the backend
echo "Starting FastAPI server on port $PORT..."
python3 start.py
