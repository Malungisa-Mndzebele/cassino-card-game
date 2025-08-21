@echo off
REM Casino Card Game Backend Startup Script for Windows

echo Starting Casino Card Game Backend...

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Set environment variables
set PORT=8000
set HOST=0.0.0.0

REM Start the backend
echo Starting FastAPI server on port %PORT%...
python start.py

pause
