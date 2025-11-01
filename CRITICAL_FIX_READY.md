# 🚨 CRITICAL FIX READY - Deploy Now!

## Problem Found

The `index.html` file has inline JavaScript that was using `/cassino/api` as the API URL for production. This was trying to proxy through khasinogaming.com, but no proxy exists, so it returns an HTML 404 page instead of JSON.

## Fix Applied

I've updated `index.html` line 318:
- **Before**: `return isLocal ? 'http://localhost:8000' : '/cassino/api';`
- **After**: `return isLocal ? 'http://localhost:8000' : 'https://cassino-game-backend.fly.dev';`

## Deploy the Fix

**Commit and push NOW:**

```bash
git add index.html apiClient.ts
git commit -m "CRITICAL FIX: Update API URL in index.html to use Fly.io backend directly"
git push origin main
```

This will trigger GitHub Actions to rebuild and deploy the frontend.

## After Deployment (3-5 minutes)

1. **Clear browser cache** (Ctrl+Shift+Del)
2. **Hard refresh** (Ctrl+F5)
3. **Test creating a room** - Should work now!

## What to Check

After deployment, open browser console (F12) and you should see:
- API calls going to: `https://cassino-game-backend.fly.dev/rooms/create`
- JSON responses (not HTML)
- Room creation works!

---

**This is the fix you need!** The `index.html` was using the wrong URL.

