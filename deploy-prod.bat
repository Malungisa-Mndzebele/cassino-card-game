@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Production Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Check if we're in the right directory
if not exist "docker-compose.prod.yml" (
    echo [ERROR] docker-compose.prod.yml not found. Please run this script from the project root.
    exit /b 1
)

REM Create .env.prod if it doesn't exist
if not exist ".env.prod" (
    echo [WARNING] Creating .env.prod file with default values...
    (
        echo # Production Environment Variables
        echo # Update these values for your production environment
        echo.
        echo # Database Configuration
        echo POSTGRES_PASSWORD=casino_password_%RANDOM%
        echo.
        echo # Application Configuration
        echo PORT=8000
        echo HOST=0.0.0.0
        echo.
        echo # CORS Origins ^(comma-separated^)
        echo CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com
        echo.
        echo # Logging
        echo LOG_LEVEL=INFO
    ) > .env.prod
    echo [WARNING] Please update .env.prod with your actual values before continuing.
    echo [WARNING] Especially update POSTGRES_PASSWORD with a secure password.
    pause
)

REM Stop any existing containers
echo [INFO] Stopping any existing containers...
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>nul

REM Build and start the services
echo [INFO] Building and starting production services...
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo [INFO] Checking service status...
docker-compose -f docker-compose.prod.yml ps

REM Test the backend health endpoint
echo [INFO] Testing backend health endpoint...
set /a attempts=0
:health_check_loop
set /a attempts+=1
curl -f http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    if !attempts! lss 30 (
        echo [WARNING] Backend not ready yet, waiting... ^(attempt !attempts!/30^)
        timeout /t 2 /nobreak >nul
        goto health_check_loop
    ) else (
        echo [ERROR] Backend failed to start properly. Check logs with: docker-compose -f docker-compose.prod.yml logs backend
        exit /b 1
    )
) else (
    echo [SUCCESS] Backend is healthy and responding!
)

REM Show logs
echo [INFO] Recent backend logs:
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo.
echo 🎉 Production deployment completed successfully!
echo [INFO] Backend is running at: http://localhost:8000
echo [INFO] Health check: http://localhost:8000/health
echo.
echo [INFO] Useful commands:
echo   View logs: docker-compose -f docker-compose.prod.yml logs -f
echo   Stop services: docker-compose -f docker-compose.prod.yml down
echo   Restart backend: docker-compose -f docker-compose.prod.yml restart backend
echo   Update and redeploy: deploy-prod.bat
echo.
pause
