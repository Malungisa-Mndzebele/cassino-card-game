# Clean Local Setup - Match Production

This guide ensures your local development environment matches the deployed version exactly.

## Step 1: Stop All Running Servers

**Close any terminal windows running:**
- Backend server (Ctrl+C)
- Frontend dev server (Ctrl+C)
- Any other Node.js or Python processes

## Step 2: Clean Build Artifacts

```powershell
# Remove build directory
if (Test-Path dist) { Remove-Item dist -Recurse -Force }

# Remove node_modules (optional, only if you want a fresh install)
# if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }
```

## Step 3: Recreate Database (if backend is stopped)

```powershell
cd backend
# Stop backend if running, then:
if (Test-Path test_casino_game.db) { Remove-Item test_casino_game.db -Force }
python -c "from database import engine, Base; from models import Room, Player, GameSession; Base.metadata.create_all(engine); print('Database recreated successfully')"
```

## Step 4: Start Fresh

**Terminal 1 - Backend:**
```powershell
cd backend
python start_production.py
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

## Step 5: Access the Application

Open your browser and navigate to:
**http://localhost:5173/cassino/**

**Important:** Notice the `/cassino/` path - this matches production!

## Troubleshooting

### If styles don't load:
1. Hard refresh: `Ctrl+Shift+R` or `Ctrl+F5`
2. Clear browser cache
3. Check browser console for 404 errors

### If backend doesn't connect:
1. Verify backend is running on `http://localhost:8000`
2. Check backend health: `http://localhost:8000/health`
3. Verify CORS settings in `backend/main.py`

### If you see 404 errors:
- Make sure you're accessing `http://localhost:5173/cassino/` not `http://localhost:5173/`
- The base path is `/cassino/` to match production deployment

