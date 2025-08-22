@echo off
REM Casino Card Game - Stop Application Stack
REM This script stops the entire application stack

echo 🛑 Stopping Casino Card Game Full Stack Application...

REM Determine which compose file to use
set COMPOSE_FILE=docker-compose.yml
if "%1"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
    echo 🔧 Stopping DEVELOPMENT environment...
) else (
    echo 🏭 Stopping PRODUCTION environment...
)

REM Stop and remove containers
echo 🐳 Stopping Docker containers...
docker-compose -f %COMPOSE_FILE% down

echo ✅ Application stopped successfully!
echo.
echo 💡 To start the application again, run:
echo    start-app.bat
echo.
echo 🧹 To remove all data and start fresh, run:
echo    clean-app.bat
echo.
pause
