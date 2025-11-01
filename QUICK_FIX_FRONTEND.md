# Quick Fix: Frontend Getting HTML Instead of JSON

## Problem
Frontend is receiving HTML (`<!DOCTYPE`) instead of JSON from the backend API.

## Diagnosis

### Step 1: Check Browser Console
1. Go to: https://khasinogaming.com/cassino/
2. Open browser console (F12)
3. Look for these logs:
   - `🔧 API Client Configuration:` - Shows what API URL is being used
   - `🌐 API Call: [URL]` - Shows the exact URL being called
   - `❌ API Call Failed: [URL]` - Shows the error

### Step 2: Verify URL
The frontend should be calling:
```
https://cassino-game-backend.fly.dev/rooms/create
```

NOT:
```
https://khasinogaming.com/cassino/rooms/create
```
or
```
/cassino/api/rooms/create
```

## Solution: Rebuild and Redeploy Frontend

The frontend needs to be rebuilt with the updated `apiClient.ts` code and correct API URL.

### Option 1: Trigger GitHub Actions Rebuild (Recommended)

```bash
# Make an empty commit to trigger rebuild
git add apiClient.ts
git commit -m "Rebuild frontend with updated API client and correct backend URL"
git push origin main
```

This will:
1. Build frontend with `VITE_API_URL=https://cassino-game-backend.fly.dev`
2. Deploy to khasinogaming.com via FTP
3. Include updated logging in `apiClient.ts`

### Option 2: Manual Rebuild and Deploy

If you have FTP access:

```bash
# Set API URL
export VITE_API_URL=https://cassino-game-backend.fly.dev

# Build
npm run build

# Upload dist/ folder to khasinogaming.com/cassino/ via FTP
```

## After Rebuild

1. **Clear browser cache** (Ctrl+Shift+Del or Cmd+Shift+Del)
2. **Hard refresh** (Ctrl+F5 or Cmd+Shift+R)
3. **Check console** - Should see:
   - `🔧 API Client Configuration: { API_BASE_URL: "https://cassino-game-backend.fly.dev", ... }`
   - `🌐 API Call: https://cassino-game-backend.fly.dev/rooms/create`
   - `📥 Response Status: 200`
   - `📥 Content-Type: application/json`
4. **Try creating a room** - Should work now!

## If Still Not Working

### Check Backend is Running
```bash
curl https://cassino-game-backend.fly.dev/health
```
Should return: `{"status":"healthy","message":"Casino Card Game Backend is running","database":"connected"}`

### Check CORS
```bash
flyctl secrets list -a cassino-game-backend
```
Should see: `CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com,...`

### Test Backend Directly
```bash
curl -X POST https://cassino-game-backend.fly.dev/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"player_name":"test"}'
```

Should return JSON with `room_id` and `player_id`.

## Common Issues

### Issue 1: Frontend Using Wrong URL
**Symptom**: Console shows URL like `/cassino/api/rooms/create` or `khasinogaming.com/rooms/create`

**Fix**: Frontend wasn't built with `VITE_API_URL` set. Rebuild with the environment variable.

### Issue 2: CORS Error
**Symptom**: Browser console shows CORS error

**Fix**: 
```bash
flyctl secrets set CORS_ORIGINS="https://khasinogaming.com,https://www.khasinogaming.com,https://cassino-game-backend.fly.dev" -a cassino-game-backend
```

### Issue 3: Old Frontend Cache
**Symptom**: Even after rebuild, still seeing old behavior

**Fix**: Clear browser cache and hard refresh (Ctrl+F5)

