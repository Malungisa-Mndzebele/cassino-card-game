# Fly.io Setup Instructions

## 🚀 Complete Fly.io Deployment Guide

This guide will walk you through deploying your Casino Card Game backend to Fly.io.

---

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io) (free)
2. **Fly.io CLI**: Install the command-line tool
3. **Git Repository**: Your code should be in a Git repository (GitHub recommended)

---

## Step 1: Install Fly.io CLI

### Windows (PowerShell)
```powershell
# Run as Administrator
iwr https://fly.io/install.ps1 -useb | iex
```

### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

### Verify Installation
```bash
flyctl version
```

---

## Step 2: Login to Fly.io

```bash
flyctl auth login
```

This will open your browser to authenticate. After logging in, you'll be authenticated in the CLI.

---

## Step 3: Create PostgreSQL Database

Fly.io provides two options for PostgreSQL:

### Option A: Managed Postgres (Recommended)

Managed Postgres is supported by Fly.io and handles backups, updates, etc.:

```bash
flyctl postgres create --name cassino-db --region iad --vm-size shared-cpu-1x --volume-size 3
```

**When prompted:**
- **Initial cluster size**: Enter `1` (single instance, free tier friendly)
- **Choose "Development"** or **"Production"** cluster type (Development is fine for free tier)

### Option B: Unmanaged Postgres (Simpler, but you manage it)

For a simple free tier setup:

```bash
flyctl postgres create --name cassino-db --region iad --vm-size shared-cpu-1x --volume-size 3
```

**When prompted:**
- **Initial cluster size**: Enter `1` (single instance - good for free tier)
  - *Note: 3 is for HA/High Availability, but not needed for free tier*

**Note**: This creates a PostgreSQL database with:
- **Name**: `cassino-db`
- **Region**: `iad` (Washington, D.C.)
- **VM Size**: `shared-cpu-1x` (free tier)
- **Volume Size**: 3GB (free tier)
- **Cluster Size**: 1 (single instance)

**Important**: Save the connection string that's displayed! It will look like:
```
postgres://postgres:password@host:5432/database
```

---

## Step 4: Create the Fly.io App

Navigate to your project root directory:

```bash
cd "C:\Home\Code\Multiplayer Card Game"
```

Initialize the Fly.io app (this will use the `fly.toml` file already configured):

```bash
flyctl launch --no-deploy
```

**When prompted:**
- **App name**: Choose a unique name (or press Enter for default)
- **Region**: Choose `iad` (or closest to you)
- **PostgreSQL**: Select the database you created in Step 3

This will update `fly.toml` with your app name.

---

## Step 5: Set Environment Variables

Set your environment variables in Fly.io:

```bash
# Set CORS origins (replace with your frontend URL)
flyctl secrets set CORS_ORIGINS="https://your-frontend.fly.dev,https://yourdomain.com"

# Set other environment variables if needed
flyctl secrets set ENVIRONMENT="production"
flyctl secrets set LOG_LEVEL="INFO"
```

**Note**: `DATABASE_URL` is automatically set by Fly.io when you attach the PostgreSQL database.

---

## Step 6: Attach PostgreSQL Database

Attach the database to your app (if not done automatically):

```bash
flyctl postgres attach --app cassino-game-backend cassino-db
```

This sets the `DATABASE_URL` environment variable automatically.

---

## Step 7: Run Database Migrations

Before deploying, you need to run database migrations. You can do this in two ways:

### Option A: Run Migrations Locally (before first deploy)

Create a `.env` file in the `backend` directory with your database URL:

```env
DATABASE_URL=postgres://postgres:password@host:5432/database
```

Then run migrations:

```bash
cd backend
python -m alembic upgrade head
```

### Option B: Run Migrations on Fly.io (after first deploy)

After deploying, SSH into your Fly.io app and run migrations:

```bash
# SSH into the app
flyctl ssh console

# Inside the SSH session
cd /app
python -m alembic upgrade head
exit
```

---

## Step 8: Deploy Your App

Deploy to Fly.io:

```bash
flyctl deploy
```

This will:
1. Build your Docker image
2. Push it to Fly.io
3. Deploy your app

**First deployment may take 3-5 minutes.**

---

## Step 9: Verify Deployment

Check your app status:

```bash
flyctl status
```

Check logs:

```bash
flyctl logs
```

Test the health endpoint:

```bash
curl https://cassino-game-backend.fly.dev/health
```

You should see:
```json
{"status":"healthy","message":"Casino Card Game Backend is running"}
```

---

## Step 10: Get Your App URL

Your app is now live at:
```
https://cassino-game-backend.fly.dev
```

(Replace `cassino-game-backend` with your app name)

---

## 🔧 Troubleshooting

### App Won't Start

1. **Check logs**:
   ```bash
   flyctl logs
   ```

2. **Check environment variables**:
   ```bash
   flyctl secrets list
   ```

3. **Verify DATABASE_URL is set**:
   ```bash
   flyctl ssh console
   # Then inside:
   echo $DATABASE_URL
   ```

### Database Connection Errors

1. **Verify database is attached**:
   ```bash
   flyctl postgres list
   flyctl postgres attach --app your-app-name your-db-name
   ```

2. **Check database status**:
   ```bash
   flyctl postgres status --app cassino-db
   ```

### Migration Errors

1. **SSH into app and run migrations manually**:
   ```bash
   flyctl ssh console
   cd /app
   python -m alembic upgrade head
   ```

### Port Binding Issues

The app should bind to port 8000. Verify in `fly.toml`:
```toml
[http_service]
  internal_port = 8000
```

And in `backend/start_production.py`, it reads:
```python
port = int(os.getenv("PORT", "8000"))
```

---

## 📝 Useful Commands

### View App Info
```bash
flyctl status
```

### View Logs
```bash
flyctl logs
```

### SSH into App
```bash
flyctl ssh console
```

### Scale App
```bash
# Scale up (if needed)
flyctl scale count 2

# Scale down (back to 1 for free tier)
flyctl scale count 1
```

### Update Secrets
```bash
flyctl secrets set KEY=value
```

### View Secrets
```bash
flyctl secrets list
```

### Restart App
```bash
flyctl apps restart cassino-game-backend
```

### Open App in Browser
```bash
flyctl open
```

---

## 🔄 Updating Your App

After making code changes:

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "Update code"
   git push
   ```

2. **Deploy**:
   ```bash
   flyctl deploy
   ```

That's it! Fly.io will rebuild and redeploy your app.

---

## 💰 Free Tier Limits

Fly.io free tier includes:
- ✅ **3 shared CPUs**
- ✅ **256MB RAM**
- ✅ **3GB persistent storage** (for PostgreSQL)
- ✅ **160GB outbound data transfer/month**
- ✅ **No sleep/spin down** - Always running
- ✅ **Unlimited requests**

**Cost**: $0/month (stays within free tier)

---

## 🎯 Next Steps

1. ✅ **Backend deployed** - Your FastAPI backend is live!
2. ⏭️ **Deploy frontend** - Deploy your React frontend (can also use Fly.io)
3. 🔗 **Connect frontend** - Update frontend API URL to your Fly.io backend URL
4. ✅ **Test WebSockets** - Verify WebSocket connections work correctly

---

## 📚 Additional Resources

- **Fly.io Docs**: https://fly.io/docs
- **Fly.io Python Guide**: https://fly.io/docs/languages-and-frameworks/python/
- **Fly.io PostgreSQL**: https://fly.io/docs/postgres/

---

## ✅ Quick Reference

**App URL**: `https://cassino-game-backend.fly.dev`

**Health Check**: `https://cassino-game-backend.fly.dev/health`

**API Docs**: `https://cassino-game-backend.fly.dev/docs`

**WebSocket**: `wss://cassino-game-backend.fly.dev/ws/{room_id}`

---

**Your backend is now live on Fly.io! 🎉**
