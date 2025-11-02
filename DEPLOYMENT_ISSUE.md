# Deployment Health Check Timeout

The deployment built successfully but failed health checks. This means either:
1. The app is still crashing (bug not fixed in deployed code)
2. Health check is failing for another reason
3. Machine is taking too long to start

## Check Current Logs

After deployment, check the logs to see if the app is actually running or still crashing:

```bash
flyctl logs -a cassino-game-backend -n
```

## Possible Issues

### 1. Code Not Committed/Pushed
The GitHub Actions deployment might be using old code if the fix wasn't committed and pushed.

**Fix:**
```bash
git add .
git commit -m "Fix indentation error in main.py"
git push
```

Then wait for GitHub Actions to redeploy, or deploy manually:
```bash
flyctl deploy -a cassino-game-backend
```

### 2. Health Check Too Strict
The health check might be timing out before the app fully starts.

**Check health check config:**
```toml
[[http_service.checks]]
  interval = '30s'
  timeout = '10s'
  grace_period = '30s'  # Might need to be longer
```

### 3. Database Connection Failing
Even if code is fixed, database connection might be failing during health check.

**Check:**
```bash
flyctl logs -a cassino-game-backend -n
```

Look for:
- `✅ Database connection successful`
- `❌ Database connection failed: <error>`

### 4. Missing Migrations
Database tables might not exist.

**Fix:**
```bash
flyctl ssh console -a cassino-game-backend -C "cd /app && python -m alembic upgrade head"
```

## Next Steps

1. **Check logs first** to see actual error:
   ```bash
   flyctl logs -a cassino-game-backend -n
   ```

2. **Verify code is committed and pushed:**
   ```bash
   git status
   git log --oneline -5
   ```

3. **Manually deploy if needed:**
   ```bash
   flyctl deploy -a cassino-game-backend
   ```

4. **Check machine status:**
   ```bash
   flyctl status -a cassino-game-backend
   ```

5. **If health checks keep failing, increase grace_period in fly.toml:**
   ```toml
   grace_period = '60s'  # Increase from 30s to 60s
   ```

