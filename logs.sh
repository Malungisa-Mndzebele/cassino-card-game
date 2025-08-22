#!/bin/bash

# Casino Card Game - View Application Logs
# This script shows logs for the entire application stack

echo "📊 Casino Card Game Application Logs"
echo "====================================="

# Determine which compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ "$1" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Viewing DEVELOPMENT environment logs..."
else
    echo "🏭 Viewing PRODUCTION environment logs..."
fi

# Show logs for all services
echo ""
echo "🐳 Showing logs for all services..."
echo "Press Ctrl+C to exit"
echo ""

docker-compose -f $COMPOSE_FILE logs -f
