#!/bin/bash

# Local PostgreSQL Development Setup Script

echo "🚀 Starting Casino Card Game Local Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. You can modify it if needed."
fi

# Start PostgreSQL and pgAdmin
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U casino_user -d casino_game; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Start pgAdmin
echo "🖥️  Starting pgAdmin..."
docker-compose up -d pgadmin

echo "✅ Local development environment is ready!"
echo ""
echo "📊 Database Information:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: casino_game"
echo "   Username: casino_user"
echo "   Password: casino_password"
echo ""
echo "🖥️  pgAdmin Information:"
echo "   URL: http://localhost:8080"
echo "   Email: admin@casino.com"
echo "   Password: admin123"
echo ""
echo "🚀 To start the application, run:"
echo "   python startup.py"
echo ""
echo "🛑 To stop the environment, run:"
echo "   docker-compose down"
