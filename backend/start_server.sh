#!/usr/bin/env bash
set -e

# Navigate to backend directory if not already
cd "$(dirname "$0")"

# Create virtualenv if missing
python3 -m venv venv || true
source venv/bin/activate || true

# Install dependencies if requirements.txt exists
if [ -f requirements.txt ]; then
  pip install --upgrade pip wheel || true
  pip install -r requirements.txt || true
fi

# Run Alembic migrations if configured
if [ -f alembic.ini ] || [ -d alembic ]; then
  python -m alembic upgrade head || true
fi

# Restart backend
pkill -f "python start_production.py" || true
nohup python start_production.py > server.log 2>&1 &

echo "Backend started (or restarted)."

#!/bin/bash
# Start the Casino Card Game Backend Server

# Get the directory where the script is located
BACKEND_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BACKEND_DIR"

echo "🚀 Starting Casino Card Game Backend..."
echo "📁 Directory: $BACKEND_DIR"
echo ""

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found!"
    echo "   Please run ./deploy_to_spaceship.sh first"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Please create .env file with your configuration"
    exit 1
fi

# Start the server
echo "🎮 Starting server on port 8000..."
python start_production.py

