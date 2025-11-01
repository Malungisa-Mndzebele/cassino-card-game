# Check Fly.io Backend Logs

The secrets are set, but the backend is still crashing. Let's check the logs to see the actual error.

## Check Recent Logs

```bash
flyctl logs -a cassino-game-backend --recent
```

Or check live logs:

```bash
flyctl logs -a cassino-game-backend
```

## What to Look For

The updated startup script will show detailed errors:

1. **✅ Database connection successful** - Database is OK
2. **✅ App import successful** - Code is OK
3. **❌ ERROR: DATABASE_URL is not set** - (But you have it set)
4. **❌ Database connection failed: <error>** - Connection issue
5. **❌ Failed to import app: <error>** - Code/import issue

## Common Issues After Secrets Are Set

### 1. Database Connection Failure
The DATABASE_URL might be incorrect or database is not accessible.

**Fix:**
```bash
# Verify the DATABASE_URL is correct
flyctl secrets set DATABASE_URL="postgresql://user:password@host:5432/database" -a cassino-game-backend
```

### 2. Missing Database Tables (Migrations Not Run)
The database might exist but tables don't.

**Fix:**
```bash
# Run migrations
flyctl ssh console -a cassino-game-backend -C "cd /app && python -m alembic upgrade head"
```

### 3. Import Errors
Code might have syntax errors or missing dependencies.

**Check:**
```bash
# SSH and test import
flyctl ssh console -a cassino-game-backend -C "python -c 'from main import app; print(\"Import OK\")'"
```

### 4. Dependency Issues
Missing Python packages.

**Fix:**
```bash
# Rebuild the app (this will reinstall dependencies)
flyctl deploy -a cassino-game-backend
```

## Quick Diagnostic

Run this sequence:

```bash
# 1. Check logs for errors
flyctl logs -a cassino-game-backend --recent

# 2. Check if machine is running
flyctl status -a cassino-game-backend

# 3. Test database connection
flyctl ssh console -a cassino-game-backend -C "python -c 'from database import engine; engine.connect(); print(\"DB OK\")'"

# 4. Run migrations if needed
flyctl ssh console -a cassino-game-backend -C "cd /app && python -m alembic upgrade head"
```

