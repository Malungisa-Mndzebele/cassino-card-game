# Running Database Migrations on Fly.io

## Method 1: SSH and run manually (Recommended)

```bash
# Connect to the machine
flyctl ssh console -a cassino-game-backend

# Once inside, run migrations
cd /app
python -m alembic upgrade head
exit
```

## Method 2: Run command directly

```bash
flyctl ssh console -a cassino-game-backend -C "python -m alembic upgrade head"
```

## Method 3: If working directory is already /app

```bash
flyctl ssh console -a cassino-game-backend -C "sh -c 'cd /app && python -m alembic upgrade head'"
```

---

**Note**: Since the health check shows `"database":"connected"`, tables may already exist. But running migrations ensures everything is up to date.

