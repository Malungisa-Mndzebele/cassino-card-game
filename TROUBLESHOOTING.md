# Troubleshooting Guide

## Issue: Frontend Getting HTML Instead of JSON

**Error:** `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This means the frontend is receiving an HTML page (likely a 404 or error page) instead of JSON from the backend.

---

## 🔍 Diagnosis Steps

### Step 1: Check Browser Console

Open browser console (F12) and look for:
- `🌐 API Call: [URL]` - This shows what URL is being called
- `📍 API Base URL: [URL]` - This shows the base URL
- `❌ API Call Failed: [URL]` - Error messages

### Step 2: Verify API URL

The frontend should be calling:
```
https://cassino-game-backend.fly.dev/rooms/create
```

NOT:
```
https://khasinogaming.com/cassino/rooms/create
```

### Step 3: Check Backend Status

Test backend directly:
```bash
curl https://cassino-game-backend.fly.dev/health
```

Should return:
```json
{"status":"healthy","message":"Casino Card Game Backend is running"}
```

### Step 4: Check CORS Configuration

Backend must allow requests from `https://khasinogaming.com`:

```bash
# Check Fly.io secrets
flyctl secrets list
```

Should see:
```
CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com
```

---

## 🔧 Solutions

### Solution 1: Set CORS Origins in Fly.io

The backend must allow `khasinogaming.com`:

```bash
flyctl secrets set CORS_ORIGINS="https://khasinogaming.com,https://www.khasinogaming.com,https://cassino-game-backend.fly.dev"
```

### Solution 2: Verify API URL in Build

The frontend build must include the API URL. Check:

1. **In GitHub Actions**: Verify the build step includes `VITE_API_URL`
2. **In Build Files**: After build, check `dist/` folder for API URL

### Solution 3: Rebuild and Redeploy Frontend

If API URL is missing:

1. **Trigger Rebuild**:
   ```bash
   # Make a small change and push
   git commit --allow-empty -m "Rebuild frontend with API URL"
   git push origin main
   ```

2. **Or Deploy Manually**:
   ```bash
   # Set environment variable
   export VITE_API_URL=https://cassino-game-backend.fly.dev
   
   # Build
   npm run build
   
   # Upload dist/ to khasinogaming.com/cassino/
   ```

### Solution 4: Check Backend is Running

Verify backend is actually running:

```bash
flyctl status
flyctl logs
```

If backend is stopped:
```bash
flyctl apps restart cassino-game-backend
```

---

## 🐛 Common Issues

### Issue 1: Frontend Using Wrong URL

**Symptom**: API calls go to `khasinogaming.com` instead of `cassino-game-backend.fly.dev`

**Fix**: 
- Set `VITE_API_URL` during build
- Or ensure `apiClient.ts` defaults correctly

### Issue 2: CORS Blocking Requests

**Symptom**: Browser console shows CORS error

**Fix**:
```bash
flyctl secrets set CORS_ORIGINS="https://khasinogaming.com,https://www.khasinogaming.com"
```

### Issue 3: Backend Not Running

**Symptom**: 503 or connection errors

**Fix**:
```bash
flyctl status
flyctl apps restart cassino-game-backend
flyctl logs
```

### Issue 4: API URL Not in Build

**Symptom**: API calls go to wrong URL

**Fix**:
- Rebuild with `VITE_API_URL` set
- Or update `apiClient.ts` to use explicit URL

---

## ✅ Quick Fix Checklist

- [ ] Backend is running: `flyctl status`
- [ ] Backend health check works: `curl https://cassino-game-backend.fly.dev/health`
- [ ] CORS allows khasinogaming.com: `flyctl secrets list`
- [ ] Frontend build includes API URL: Check `dist/` folder
- [ ] Browser console shows correct API URL
- [ ] No CORS errors in browser console

---

## 🔍 Debugging Commands

### Check Backend
```bash
# Status
flyctl status

# Logs
flyctl logs

# Health check
curl https://cassino-game-backend.fly.dev/health

# Test API directly
curl -X POST https://cassino-game-backend.fly.dev/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"player_name":"test"}'
```

### Check Frontend Build
```bash
# Build with API URL
VITE_API_URL=https://cassino-game-backend.fly.dev npm run build

# Check if URL is in build
grep -r "cassino-game-backend" dist/

# Check build output
ls -la dist/
```

### Check CORS
```bash
# List secrets
flyctl secrets list

# Set CORS
flyctl secrets set CORS_ORIGINS="https://khasinogaming.com,https://www.khasinogaming.com"
```

---

## 📝 Expected Behavior

### Correct API Call Flow

1. **Frontend** (khasinogaming.com) makes request
2. **Browser** sends request to `https://cassino-game-backend.fly.dev/rooms/create`
3. **Backend** receives request, checks CORS (allows khasinogaming.com)
4. **Backend** processes request, returns JSON
5. **Frontend** receives JSON, parses successfully

### What You're Seeing (Incorrect)

1. **Frontend** makes request
2. **Browser** sends request (wrong URL or blocked)
3. **Server** returns HTML (404 or error page)
4. **Frontend** tries to parse HTML as JSON → Error

---

**Most likely fix: Set CORS_ORIGINS in Fly.io to allow khasinogaming.com!**
