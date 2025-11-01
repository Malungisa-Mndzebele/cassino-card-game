# Fix: Backend Crashing (Max Restart Count)

Your backend is crashing repeatedly. Here's how to fix it.

---

## 🔍 Step 1: Check Logs

Run this to see the actual error:

```bash
flyctl logs -a cassino-game-backend --lines 100
```

**Look for:**
- `table "rooms" does not exist` → Migrations needed
- `could not connect to server` → Database connection issue
- `ModuleNotFoundError` → Missing dependency
- `ImportError` → Import issue

---

## 🔧 Step 2: Most Likely Fix - Run Migrations

**The app is probably crashing because database tables don't exist.**

Run migrations via SSH:

```bash
flyctl ssh console -a cassino-game-backend -C "cd /app && python -m alembic upgrade head"
```

This creates all necessary tables in the database.

---

## 🔧 Step 3: Verify Database is Running

Check database status:

```bash
flyctl postgres status --app cassino-db
```

Should show "running" or "healthy".

---

## 🔧 Step 4: Restart Backend

After migrations, restart:

```bash
flyctl apps restart cassino-game-backend
```

Wait a few seconds, then check status:

```bash
flyctl status -a cassino-game-backend
```

Machine should show `started` instead of `stopped`.

---

## 🔧 Step 5: Verify Health Check

Test the backend:

```bash
curl https://cassino-game-backend.fly.dev/health
```

Should return:
```json
{"status":"healthy","message":"Casino Card Game Backend is running","database":"connected"}
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Tables Don't Exist

**Symptom**: Logs show `table "rooms" does not exist`

**Fix**:
```bash
flyctl ssh console -a cassino-game-backend -C "cd /app && python -m alembic upgrade head"
```

### Issue 2: Database Connection Failed

**Symptom**: Logs show `could not connect to server`

**Fix**:
```bash
# Re-attach database (even if already attached, this refreshes connection)
flyctl postgres connect --app cassino-db

# Then restart app
flyctl apps restart cassino-game-backend
```

### Issue 3: Import Errors

**Symptom**: Logs show `ModuleNotFoundError` or `ImportError`

**Fix**:
- Check `requirements.txt` has all dependencies
- Rebuild and redeploy:
  ```bash
  flyctl deploy --no-cache
  ```

### Issue 4: App Keeps Crashing

**Symptom**: Machine reaches max restart count

**Fix**:
1. **Check logs first** (Step 1)
2. **Run migrations** (Step 2)
3. **Start manually**:
   ```bash
   flyctl machine start e829394b2de378 -a cassino-game-backend
   ```
4. **Check logs again** to see if it stays running

---

## ✅ Quick Fix Checklist

1. [ ] Check logs: `flyctl logs -a cassino-game-backend --lines 100`
2. [ ] Run migrations: `flyctl ssh console -a cassino-game-backend -C "cd /app && python -m alembic upgrade head"`
3. [ ] Verify database: `flyctl postgres status --app cassino-db`
4. [ ] Restart app: `flyctl apps restart cassino-game-backend`
5. [ ] Check status: `flyctl status -a cassino-game-backend`
6. [ ] Test health: `curl https://cassino-game-backend.fly.dev/health`

---

## 📝 After Fixing

Once the backend is running:

1. **Test frontend**: https://khasinogaming.com/cassino/
2. **Check console**: Should see API calls to `cassino-game-backend.fly.dev`
3. **Create room**: Should work without HTML errors

---

**Most likely fix: Run database migrations!** The app crashes because it tries to query tables that don't exist yet.

