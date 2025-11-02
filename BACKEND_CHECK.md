# Backend Connection Issue Fix

## Problem
The test is failing with: "Cannot connect to backend at http://localhost:8000/rooms/join-random"

## Solution

### 1. Verify Backend is Running

Check if the backend is running:
```bash
# Check if backend is accessible
curl http://localhost:8000/health

# Or in PowerShell:
Invoke-WebRequest -Uri http://localhost:8000/health
```

### 2. Start Backend if Not Running

```bash
# Option 1: Using npm script
npm run start:backend

# Option 2: Direct Python command
cd backend
python startup.py

# Or on some systems:
python3 startup.py
```

### 3. Verify Backend Started Successfully

You should see output like:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4. Keep Backend Running

**Important**: The backend must be running in a separate terminal **while** you run the tests.

### 5. Run Tests Again

Once backend is confirmed running:
```bash
npm run test:e2e:random-join
```

## Troubleshooting

### Backend Port Already in Use
If you get a port already in use error:
```bash
# Find process using port 8000 (Windows PowerShell)
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Backend Not Starting
- Check Python version: `python --version` (should be 3.11+)
- Check dependencies: `cd backend && pip list`
- Check for errors in backend logs

### Backend Running But Test Still Fails
- Verify backend is on correct port (8000)
- Check firewall/antivirus blocking connections
- Try accessing backend directly: `http://localhost:8000/health`

