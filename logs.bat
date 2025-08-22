@echo off
REM Casino Card Game - View Application Logs
REM This script shows logs for the entire application stack

echo 📊 Casino Card Game Application Logs
echo =====================================

REM Determine which compose file to use
set COMPOSE_FILE=docker-compose.yml
if "%1"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
    echo 🔧 Viewing DEVELOPMENT environment logs...
) else (
    echo 🏭 Viewing PRODUCTION environment logs...
)

REM Show logs for all services
echo.
echo 🐳 Showing logs for all services...
echo Press Ctrl+C to exit
echo.

docker-compose -f %COMPOSE_FILE% logs -f
