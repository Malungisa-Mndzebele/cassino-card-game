@echo off
REM Casino Card Game - Full Stack Docker Application
REM This script starts the entire application stack

echo 🚀 Starting Casino Card Game Full Stack Application...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Determine which compose file to use
set COMPOSE_FILE=docker-compose.yml
if "%1"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
    echo 🔧 Starting in DEVELOPMENT mode with hot reloading...
) else (
    echo 🏭 Starting in PRODUCTION mode...
)

REM Build and start the services
echo 🐳 Building and starting Docker containers...
docker-compose -f %COMPOSE_FILE% up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...

REM Wait for PostgreSQL
echo 📊 Waiting for PostgreSQL...
:wait_postgres
docker-compose -f %COMPOSE_FILE% exec -T postgres pg_isready -U casino_user -d casino_game >nul 2>&1
if errorlevel 1 (
    echo    Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo ✅ PostgreSQL is ready!

REM Wait for Backend
echo 🔧 Waiting for Backend API...
:wait_backend
curl -f http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo    Waiting for Backend API...
    timeout /t 2 /nobreak >nul
    goto wait_backend
)
echo ✅ Backend API is ready!

REM Wait for Frontend
echo 🎨 Waiting for Frontend...
:wait_frontend
curl -f http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo    Waiting for Frontend...
    timeout /t 2 /nobreak >nul
    goto wait_frontend
)
echo ✅ Frontend is ready!

echo.
echo 🎉 Casino Card Game is now running!
echo.
echo 📱 Application URLs:
echo    Frontend:     http://localhost:3000
echo    Backend API:  http://localhost:8000
echo    API Docs:     http://localhost:8000/docs
echo    pgAdmin:      http://localhost:8080
echo.
echo 🔧 Database Information:
echo    Host:         localhost
echo    Port:         5432
echo    Database:     casino_game
echo    Username:     casino_user
echo    Password:     casino_password
echo.
echo 🛑 To stop the application, run:
echo    stop-app.bat
echo.
echo 📊 To view logs, run:
echo    logs.bat
echo.
pause
