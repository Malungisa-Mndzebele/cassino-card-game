# ⚠️ RESTART REQUIRED - Critical Information

## Why Issues Still Occur

The WebSocket fixes have been deployed to GitHub, but **your backend server is still running the OLD code**. You need to restart the backend to load the new fixes.

## How to Restart Properly

### Step 1: Stop the Backend

**Find the running Python process**:
```bash
netstat -ano | findstr :8000
```

**Kill all Python processes on port 8000**:
```bash
# Replace <PID> with the process IDs from above
taskkill /F /PID <PID>
```

**Or simply close the terminal** where `python main.py` is running.

### Step 2: Pull Latest Code (If Needed)

If you're testing on a different machine or the code isn't updated:
```bash
git pull origin master
```

### Step 3: Start Backend with New Code

```bash
cd backend
python main.py
```

**You should see**:
```
✅ Database initialized
⚠️  Redis not available (sessions and caching disabled)
✅ Background tasks started
ℹ️  WebSocket using local-only mode (no Redis)  ← NEW LINE
✨ Backend ready!
```

The line **"WebSocket using local-only mode (no Redis)"** confirms you're running the new code.

### Step 4: Restart Frontend

```bash
# Stop frontend (Ctrl+C in terminal)
# Start again
npm run dev
```

### Step 5: Clear Browser Cache

**Important**: Clear browser cache and localStorage:

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Refresh page

Or use Incognito/Private mode for testing.

## Verification Checklist

Before testing, verify:

- [ ] Backend shows "WebSocket using local-only mode (no Redis)"
- [ ] Frontend restarted
- [ ] Browser cache cleared
- [ ] Using fresh browser tabs/incognito mode

## Expected Behavior After Restart

### ✅ What Should Work

1. **Create Room**: Should work instantly
2. **Quick Match**: Should work instantly
3. **Player Join**: Player 1 sees Player 2 join immediately (no refresh)
4. **Ready Button**: Works and syncs between players in real-time
5. **Game Start**: Starts automatically when both ready
6. **WebSocket**: Stays connected, no disconnections

### ❌ What Won't Work (Without Restart)

Everything will fail because the old code is still running.

## Debug: Check If New Code Is Running

### Backend Terminal

Look for this line when backend starts:
```
ℹ️  WebSocket using local-only mode (no Redis)
```

If you DON'T see this line, you're running old code.

### Browser Console (F12)

After Player 2 joins, you should see:
```
Full state update received: {type: "player_joined", ...}
Updating game state from WebSocket
```

If you DON'T see these logs, the new code isn't running.

## Common Mistakes

### ❌ Mistake #1: Not Restarting Backend
**Problem**: Code changes don't apply  
**Solution**: Kill Python process and restart

### ❌ Mistake #2: Multiple Backend Instances
**Problem**: Old instance still running on port 8000  
**Solution**: Kill ALL Python processes on port 8000

### ❌ Mistake #3: Browser Cache
**Problem**: Old JavaScript code cached  
**Solution**: Clear cache or use incognito mode

### ❌ Mistake #4: Not Pulling Latest Code
**Problem**: Testing old code  
**Solution**: `git pull origin master`

## Quick Restart Script

Save this as `restart.ps1`:

```powershell
# Kill backend
Write-Host "Stopping backend..." -ForegroundColor Yellow
$processes = netstat -ano | findstr :8000
if ($processes) {
    $pids = $processes | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
    foreach ($pid in $pids) {
        taskkill /F /PID $pid 2>$null
    }
}

# Start backend
Write-Host "Starting backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"

# Wait a bit
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Servers started! Check terminals for output." -ForegroundColor Cyan
```

Run with:
```bash
.\restart.ps1
```

## Still Not Working?

If issues persist after restart:

### 1. Verify Code Version

```bash
git log --oneline -3
```

Should show:
```
871d922 docs: Add critical WebSocket fixes deployment summary
707114b fix: Critical WebSocket real-time synchronization - Works without Redis
547fe50 docs: Add comprehensive documentation for bug fixes and testing
```

### 2. Check Backend Logs

Look for these lines:
```
INFO: WebSocket connected to room ABC123
INFO: Broadcasting to room ABC123: player_joined
```

### 3. Check Browser Console

Look for:
```
WebSocket connected to room: ABC123
Full state update received: {type: "player_joined", ...}
```

### 4. Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Should see active WebSocket connection
5. Click on it to see messages

## Summary

**The fixes are deployed, but you MUST restart the backend to load them.**

1. Kill old backend process
2. Start new backend: `cd backend && python main.py`
3. Verify you see "WebSocket using local-only mode"
4. Clear browser cache
5. Test again

The game WILL work after proper restart! 🎮
