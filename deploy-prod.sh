#!/bin/bash

# Production Deployment Script for Casino Card Game
# This script deploys the backend using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found. Please run this script from the project root."
    exit 1
fi

# Create .env.prod if it doesn't exist
if [ ! -f ".env.prod" ]; then
    print_warning "Creating .env.prod file with default values..."
    cat > .env.prod << EOF
# Production Environment Variables
# Update these values for your production environment

# Database Configuration
POSTGRES_PASSWORD=casino_password_$(date +%s)

# Application Configuration
PORT=8000
HOST=0.0.0.0

# CORS Origins (comma-separated)
CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com

# Logging
LOG_LEVEL=INFO
EOF
    print_warning "Please update .env.prod with your actual values before continuing."
    print_warning "Especially update POSTGRES_PASSWORD with a secure password."
    read -p "Press Enter to continue after updating .env.prod..."
fi

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Build and start the services
print_status "Building and starting production services..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check if services are running
print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Test the backend health endpoint
print_status "Testing backend health endpoint..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is healthy and responding!"
        break
    else
        print_warning "Backend not ready yet, waiting... (attempt $i/30)"
        sleep 2
    fi
done

if [ $i -eq 30 ]; then
    print_error "Backend failed to start properly. Check logs with: docker-compose -f docker-compose.prod.yml logs backend"
    exit 1
fi

# Show logs
print_status "Recent backend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

print_success "🎉 Production deployment completed successfully!"
print_status "Backend is running at: http://localhost:8000"
print_status "Health check: http://localhost:8000/health"
print_status ""
print_status "Useful commands:"
print_status "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "  Stop services: docker-compose -f docker-compose.prod.yml down"
print_status "  Restart backend: docker-compose -f docker-compose.prod.yml restart backend"
print_status "  Update and redeploy: ./deploy-prod.sh"
