# 🚀 Server Startup Guide

## Quick Start (Without Redis)

The backend will work without Redis - sessions and caching will be disabled but the game will still function.

### Terminal 1: Backend
```bash
cd backend
python main.py
```

**Expected Output:**
```
✅ Database initialized
⚠️  Redis not available (sessions and caching disabled)
✅ Background tasks started
✨ Backend ready!
```

### Terminal 2: Frontend
```bash
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Full Setup (With Redis)

For full functionality including session management and caching:

### 1. Install Redis (Windows)

**Option A: Using Chocolatey**
```bash
choco install redis-64
```

**Option B: Using WSL**
```bash
wsl --install
# After WSL is installed:
wsl
sudo apt update
sudo apt install redis-server
redis-server
```

**Option C: Using Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

### 2. Start Redis

**If installed via Chocolatey:**
```bash
redis-server
```

**If using WSL:**
```bash
wsl
redis-server
```

**If using Docker:**
```bash
docker start <container-id>
```

### 3. Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### 4. Start Backend
```bash
cd backend
python main.py
```

**Expected Output (with Redis):**
```
✅ Database initialized
✅ Redis connected
✅ Background tasks started
✨ Backend ready!
```

### 5. Start Frontend
```bash
npm run dev
```

## Troubleshooting

### Port 8000 Already in Use

**Check what's using port 8000:**
```bash
netstat -ano | findstr :8000
```

**Kill the process:**
```bash
taskkill /F /PID <process-id>
```

**Or use a different port:**
```bash
# In backend/.env
PORT=8001

# In frontend/.env
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001
```

### Redis Connection Failed

**Check if Redis is running:**
```bash
redis-cli ping
```

**If not running:**
- Start Redis server (see installation steps above)
- Or continue without Redis (sessions/caching disabled)

**Check Redis URL in backend/.env:**
```
REDIS_URL=redis://localhost:6379
```

### Frontend Can't Connect to Backend

**Verify backend is running:**
```bash
curl http://localhost:8000/health
```

**Check frontend .env:**
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Testing Without Redis

The game will work without Redis, but with limitations:

✅ **Works:**
- Creating and joining rooms
- Playing the game
- Real-time WebSocket updates
- All game mechanics

⚠️ **Limited:**
- No session persistence (refresh = new session)
- No caching (slightly slower API responses)
- No automatic session cleanup

For testing the bug fixes, **Redis is not required**. The real-time synchronization fixes will work without it.

## Quick Test Commands

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if frontend is running
curl http://localhost:5173

# Check if Redis is running
redis-cli ping

# View backend logs
# (Check the terminal where you ran python main.py)

# View frontend logs
# (Check browser console - F12)
```

## Production Notes

For production deployment:
- Redis is **required** for session management
- Use managed Redis service (e.g., Render Redis, AWS ElastiCache)
- Configure Redis URL in environment variables
- Enable Redis persistence (RDB or AOF)

## Summary

**Minimum to test bug fixes:**
1. Start backend: `cd backend && python main.py`
2. Start frontend: `npm run dev`
3. Open two browsers and test!

**For full functionality:**
1. Install and start Redis
2. Start backend
3. Start frontend
4. Test with full session management

Redis is optional for testing but recommended for production.
