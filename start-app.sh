#!/bin/bash

# Casino Card Game - Full Stack Docker Application
# This script starts the entire application stack

set -e

echo "🚀 Starting Casino Card Game Full Stack Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use. Please stop the service using this port."
        return 1
    fi
    return 0
}

# Check if required ports are available
echo "🔍 Checking port availability..."
check_port 3000 || exit 1
check_port 8000 || exit 1
check_port 5432 || exit 1
check_port 8080 || exit 1

# Determine which compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ "$1" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Starting in DEVELOPMENT mode with hot reloading..."
else
    echo "🏭 Starting in PRODUCTION mode..."
fi

# Build and start the services
echo "🐳 Building and starting Docker containers..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL
echo "📊 Waiting for PostgreSQL..."
until docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U casino_user -d casino_game > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Backend
echo "🔧 Waiting for Backend API..."
until curl -f http://localhost:8000/health > /dev/null 2>&1; do
    echo "   Waiting for Backend API..."
    sleep 2
done
echo "✅ Backend API is ready!"

# Wait for Frontend
echo "🎨 Waiting for Frontend..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo "   Waiting for Frontend..."
    sleep 2
done
echo "✅ Frontend is ready!"

echo ""
echo "🎉 Casino Card Game is now running!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo "   pgAdmin:      http://localhost:8080"
echo ""
echo "🔧 Database Information:"
echo "   Host:         localhost"
echo "   Port:         5432"
echo "   Database:     casino_game"
echo "   Username:     casino_user"
echo "   Password:     casino_password"
echo ""
echo "🛑 To stop the application, run:"
echo "   ./stop-app.sh"
echo ""
echo "📊 To view logs, run:"
echo "   ./logs.sh"
