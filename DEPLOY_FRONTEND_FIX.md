# Deploy Frontend Fix - Getting HTML Instead of JSON

## Issue
The frontend at https://khasinogaming.com/cassino/ is receiving HTML instead of JSON from the backend API.

## Root Cause
The deployed frontend was built before the updated `apiClient.ts` with better error handling and logging was committed. It needs to be rebuilt with the correct API URL.

## Solution

### Step 1: Commit and Push Updated Code

The `apiClient.ts` has been updated with:
- Better logging (always logs API URL in production)
- Better error handling for HTML responses
- Correct API URL: `https://cassino-game-backend.fly.dev`

**Commit the changes:**
```bash
git add apiClient.ts .github/workflows/deploy-frontend.yml
git commit -m "Fix frontend API client: Add better logging and error handling for production"
git push origin main
```

This will trigger GitHub Actions to:
1. Build frontend with `VITE_API_URL=https://cassino-game-backend.fly.dev`
2. Deploy to khasinogaming.com via FTP
3. Include updated error handling and logging

### Step 2: Wait for Deployment

GitHub Actions will:
1. Build the frontend (2-3 minutes)
2. Deploy via FTP (1-2 minutes)

Check deployment status:
- GitHub Actions tab: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- Look for "Deploy Frontend to khasinogaming.com" workflow

### Step 3: Verify Backend is Running

While waiting, verify backend is accessible:

```bash
# Health check
curl https://cassino-game-backend.fly.dev/health

# Test room creation
curl -X POST https://cassino-game-backend.fly.dev/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"player_name":"test"}'
```

Should return JSON, not HTML.

### Step 4: After Deployment

1. **Clear browser cache** (Ctrl+Shift+Del or Cmd+Shift+Del)
2. **Hard refresh** (Ctrl+F5 or Cmd+Shift+R)
3. **Open browser console** (F12)
4. **Check logs** - Should see:
   ```
   🔧 API Client Configuration: { API_BASE_URL: "https://cassino-game-backend.fly.dev", ... }
   ```
5. **Try creating a room** - Should see:
   ```
   🌐 API Call: https://cassino-game-backend.fly.dev/rooms/create
   📥 Response Status: 200
   📥 Content-Type: application/json
   ```
6. **Room should be created successfully!**

## Verification Checklist

After deployment, verify:
- [ ] Browser console shows correct API URL
- [ ] API calls go to `cassino-game-backend.fly.dev`
- [ ] Response is JSON, not HTML
- [ ] Room creation works
- [ ] Room joining works
- [ ] No CORS errors in console

## If Still Not Working

### Check 1: API URL in Console
Open browser console and check:
- `🔧 API Client Configuration:` - What does `API_BASE_URL` show?
- If it shows wrong URL, rebuild wasn't successful

### Check 2: Backend Status
```bash
flyctl status -a cassino-game-backend
flyctl logs -a cassino-game-backend --no-tail
```
Backend should be `started` and logs should show normal requests.

### Check 3: CORS Configuration
```bash
flyctl secrets list -a cassino-game-backend
```
Should see: `CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com,...`

### Check 4: Direct Backend Test
```bash
curl https://cassino-game-backend.fly.dev/health
```
Should return JSON: `{"status":"healthy","message":"...","database":"connected"}`

## Next Steps

1. **Commit and push** the updated code (see Step 1)
2. **Wait** for GitHub Actions deployment (3-5 minutes)
3. **Test** the frontend after deployment
4. **Check console** for API URL and response details
5. **Report** what you see in the console if still not working

---

**The fix is ready - just need to deploy it!**

