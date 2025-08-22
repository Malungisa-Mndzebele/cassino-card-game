@echo off
REM Local PostgreSQL Development Setup Script for Windows

echo 🚀 Starting Casino Card Game Local Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if .env file exists, if not create from example
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ✅ .env file created. You can modify it if needed.
)

REM Start PostgreSQL and pgAdmin
echo 🐘 Starting PostgreSQL database...
docker-compose up -d postgres

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
:wait_loop
docker-compose exec -T postgres pg_isready -U casino_user -d casino_game >nul 2>&1
if errorlevel 1 (
    echo Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo ✅ PostgreSQL is ready!

REM Start pgAdmin
echo 🖥️ Starting pgAdmin...
docker-compose up -d pgadmin

echo ✅ Local development environment is ready!
echo.
echo 📊 Database Information:
echo    Host: localhost
echo    Port: 5432
echo    Database: casino_game
echo    Username: casino_user
echo    Password: casino_password
echo.
echo 🖥️ pgAdmin Information:
echo    URL: http://localhost:8080
echo    Email: admin@casino.com
echo    Password: admin123
echo.
echo 🚀 To start the application, run:
echo    python startup.py
echo.
echo 🛑 To stop the environment, run:
echo    docker-compose down
echo.
pause
