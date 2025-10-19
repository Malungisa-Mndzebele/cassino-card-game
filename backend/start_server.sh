#!/usr/bin/env bash
set -e

# Navigate to backend directory if not already
cd "$(dirname "$0")"

# Prefer python3/pip3; fallback to python/pip via -m
PY=$(command -v python3 || true)
if [ -z "$PY" ]; then PY=$(command -v python || echo python); fi

# Install dependencies to user site-packages when requirements.txt exists
if [ -f requirements.txt ]; then
  "$PY" -m pip install --user --upgrade pip wheel || true
  "$PY" -m pip install --user -r requirements.txt || true
fi

# Run Alembic migrations if configured
if [ -f alembic.ini ] || [ -d alembic ]; then
  "$PY" -m alembic upgrade head || true
fi

# Restart backend using detected python
pkill -f "start_production.py" || true
nohup "$PY" start_production.py > server.log 2>&1 &

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

