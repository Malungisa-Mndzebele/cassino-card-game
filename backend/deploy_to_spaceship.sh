#!/bin/bash
# Deployment script for Spaceship server
# This script should be run ON THE SERVER via SSH

echo "=========================================="
echo "Casino Card Game Backend Deployment"
echo "=========================================="
echo ""

# Get the directory where the script is located
BACKEND_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BACKEND_DIR"

echo "📁 Current directory: $BACKEND_DIR"
echo ""

# Step 1: Check Python version
echo "1️⃣  Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Python not found! Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
echo "✅ Found: $PYTHON_VERSION"
echo ""

# Step 2: Create virtual environment
echo "2️⃣  Setting up virtual environment..."
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Step 3: Activate virtual environment
echo "3️⃣  Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Step 4: Upgrade pip
echo "4️⃣  Upgrading pip..."
pip install --upgrade pip
echo ""

# Step 5: Install dependencies
echo "5️⃣  Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Step 6: Setup environment file
echo "6️⃣  Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo "✅ Created .env from .env.production"
    else
        echo "⚠️  Warning: .env.production not found"
        echo "   Please create .env file manually with database credentials"
    fi
else
    echo "✅ .env file already exists"
fi
echo ""

# Step 7: Test database connection
echo "7️⃣  Testing database connection..."
$PYTHON_CMD test_db_connection.py
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Warning: Database connection test failed"
    echo "   Please check your database credentials in .env"
fi
echo ""

# Step 8: Run database migrations
echo "8️⃣  Running database migrations..."
alembic upgrade head
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed"
else
    echo "⚠️  Warning: Database migrations had issues"
fi
echo ""

echo "=========================================="
echo "✅ Deployment completed!"
echo "=========================================="
echo ""
echo "To start the server, run:"
echo "  source venv/bin/activate"
echo "  python start_production.py"
echo ""
echo "Or use the startup script:"
echo "  ./start_server.sh"
echo ""

