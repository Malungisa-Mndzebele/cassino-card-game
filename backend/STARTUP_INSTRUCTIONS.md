# Casino Card Game Backend - Startup Instructions

## Quick Start

The backend needs to be running on your server for the frontend to work. Here are the steps to start it:

### Option 1: Using the startup script (Recommended)

**On Linux/Mac:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**On Windows:**
```cmd
cd backend
start.bat
```

### Option 2: Manual startup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already installed):
   ```bash
   pip3 install -r requirements.txt
   ```

3. Start the server:
   ```bash
   python3 start.py
   ```

## Server Configuration

The backend will start on:
- **Host**: 0.0.0.0 (accessible from any IP)
- **Port**: 8000
- **API Base URL**: http://your-server:8000/api

## Environment Variables

You can customize the startup by setting these environment variables:

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)

Example:
```bash
export PORT=8080
export HOST=127.0.0.1
python3 start.py
```

## Testing the Backend

Once the backend is running, you can test it:

1. **Health Check**: http://your-server:8000/api/health
2. **API Root**: http://your-server:8000/api/

## Troubleshooting

### Port already in use
If port 8000 is already in use, change the PORT environment variable:
```bash
export PORT=8080
python3 start.py
```

### Permission denied
Make sure the startup script is executable:
```bash
chmod +x start.sh
```

### Python not found
Make sure Python 3 is installed and in your PATH:
```bash
python3 --version
```

## Production Deployment

For production, consider using:
- **Gunicorn** with uvicorn workers
- **Systemd** service for auto-restart
- **Nginx** as a reverse proxy

Example with Gunicorn:
```bash
pip3 install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
