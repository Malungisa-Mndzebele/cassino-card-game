# Render Deployment Guide

## Overview

This guide walks you through deploying the Casino Card Game backend to Render's staging environment. The deployment includes:
- PostgreSQL database
- Redis instance
- Python web service (FastAPI backend)

## Prerequisites

- GitHub repository with the code pushed
- Render account (free tier is sufficient for staging)
- Access to the repository settings

## Step-by-Step Deployment Instructions

### Step 1: Create Render Account

1. Go to https://render.com
2. Click "Get Started" or "Sign Up"
3. Sign up using your GitHub account (recommended for easier integration)
4. Verify your email address if required

### Step 2: Connect GitHub Repository

1. Once logged in, go to your Render Dashboard
2. Click on your profile icon (top right) → "Account Settings"
3. Navigate to "GitHub" in the left sidebar
4. Click "Connect GitHub Account" if not already connected
5. Authorize Render to access your GitHub repositories
6. Select the repository containing this project

### Step 3: Deploy Using render.yaml (Blueprint)

Render can automatically create all services from the `render.yaml` file:

1. From the Render Dashboard, click "New +" button (top right)
2. Select "Blueprint"
3. Connect to your GitHub repository if prompted
4. Select the repository containing this project
5. Render will detect the `render.yaml` file automatically
6. Review the services that will be created:
   - **cassino-game-backend** (Web Service)
   - **cassino-redis** (Redis)
   - **cassino-db** (PostgreSQL Database)
7. Click "Apply" to create all services

**Note**: This will create all three services at once with the correct environment variable connections.

### Step 4: Monitor Initial Deployment

After clicking "Apply", Render will:

1. **Create the PostgreSQL database** (cassino-db)
   - Database name: `cassino`
   - User: `cassino_user`
   - This takes 2-3 minutes

2. **Create the Redis instance** (cassino-redis)
   - Internal-only access (ipAllowList: [])
   - This takes 1-2 minutes

3. **Create and deploy the web service** (cassino-game-backend)
   - Install Python dependencies
   - Run database migrations automatically
   - Start the FastAPI server
   - This takes 5-10 minutes for first deployment

### Step 5: Monitor Deployment Logs

1. Click on the "cassino-game-backend" service
2. Go to the "Logs" tab
3. Watch for these key messages:
   ```
   🔄 Running database migrations...
   ✅ Migrations completed successfully
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:10000
   ```

4. If you see errors, check:
   - Database connection (DATABASE_URL should be auto-injected)
   - Redis connection (REDIS_URL should be auto-injected)
   - Python version compatibility
   - Missing dependencies in requirements.txt

### Step 6: Verify Service URLs

Once deployment completes, note these URLs:

1. **Web Service URL**: 
   - Found in the service dashboard (top of page)
   - Format: `https://cassino-game-backend.onrender.com`
   - Or: `https://cassino-game-backend-XXXX.onrender.com` (with random suffix)

2. **Database Connection String**:
   - Go to "cassino-db" service
   - Click "Info" tab
   - Copy "Internal Database URL" (starts with `postgresql://`)

3. **Redis Connection String**:
   - Go to "cassino-redis" service
   - Click "Info" tab
   - Copy "Internal Redis URL" (starts with `redis://`)

### Step 7: Test Health Endpoint

1. Copy your web service URL
2. Open a browser or use curl:
   ```bash
   curl https://cassino-game-backend.onrender.com/health
   ```

3. Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "redis": "connected"
   }
   ```

4. If you get an error:
   - Check the logs for error messages
   - Verify database and Redis are running
   - Check environment variables are set correctly

### Step 8: Verify Environment Variables

1. Go to "cassino-game-backend" service
2. Click "Environment" tab
3. Verify these variables are set:
   - ✅ `PYTHON_VERSION`: 3.11.0
   - ✅ `DATABASE_URL`: (auto-injected from cassino-db)
   - ✅ `REDIS_URL`: (auto-injected from cassino-redis)
   - ✅ `CORS_ORIGINS`: https://khasinogaming.com
   - ✅ `ENVIRONMENT`: production
   - ✅ `PORT`: 10000

### Step 9: Verify Database Migrations

1. Check the deployment logs for migration messages
2. Verify tables were created:
   - You can use Render's built-in database shell
   - Go to "cassino-db" service → "Shell" tab
   - Run: `\dt` to list tables
   - Expected tables: rooms, players, game_sessions, game_action_log, state_snapshots, alembic_version

3. Check migration version:
   ```sql
   SELECT * FROM alembic_version;
   ```
   - Should show the latest migration version

## Troubleshooting

### Deployment Fails During Build

**Symptom**: Build fails with dependency errors

**Solution**:
1. Check `backend/requirements.txt` is complete
2. Verify Python version compatibility (3.11.0)
3. Check build logs for specific error
4. Try deploying again (sometimes transient network issues)

### Database Connection Fails

**Symptom**: Logs show "could not connect to database"

**Solution**:
1. Verify database service is running (green status)
2. Check DATABASE_URL is set in environment variables
3. Ensure database and web service are in same region
4. Check database logs for errors

### Redis Connection Fails

**Symptom**: Logs show "Redis connection refused"

**Solution**:
1. Verify Redis service is running (green status)
2. Check REDIS_URL is set in environment variables
3. Note: Redis failures are non-fatal (app falls back to database)
4. Check Redis logs for errors

### Migrations Fail

**Symptom**: Logs show "Migration failed" or Alembic errors

**Solution**:
1. Check database is empty (first deployment)
2. Verify Alembic configuration in `backend/alembic.ini`
3. Check migration files in `backend/alembic/versions/`
4. Try manual migration:
   - Go to web service → "Shell" tab
   - Run: `cd backend && alembic upgrade head`

### Health Check Fails

**Symptom**: Service shows "Unhealthy" status

**Solution**:
1. Check `/health` endpoint manually
2. Verify database and Redis connections
3. Check application logs for errors
4. Increase health check timeout if needed

### Service Keeps Restarting

**Symptom**: Service restarts repeatedly

**Solution**:
1. Check logs for crash errors
2. Verify all environment variables are set
3. Check for memory issues (upgrade plan if needed)
4. Verify port 10000 is used correctly

## Alternative: Manual Service Creation

If Blueprint deployment doesn't work, you can create services manually:

### 1. Create PostgreSQL Database

1. Dashboard → "New +" → "PostgreSQL"
2. Name: `cassino-db`
3. Database: `cassino`
4. User: `cassino_user`
5. Region: `Oregon`
6. Plan: `Free`
7. Click "Create Database"

### 2. Create Redis Instance

1. Dashboard → "New +" → "Redis"
2. Name: `cassino-redis`
3. Region: `Oregon`
4. Plan: `Free`
5. Click "Create Redis"

### 3. Create Web Service

1. Dashboard → "New +" → "Web Service"
2. Connect to your GitHub repository
3. Configure:
   - Name: `cassino-game-backend`
   - Region: `Oregon`
   - Branch: `main`
   - Root Directory: (leave empty)
   - Environment: `Python 3`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `python backend/start_production.py`
4. Add environment variables:
   - `PYTHON_VERSION`: 3.11.0
   - `DATABASE_URL`: (link to cassino-db)
   - `REDIS_URL`: (link to cassino-redis)
   - `CORS_ORIGINS`: https://khasinogaming.com
   - `ENVIRONMENT`: production
   - `PORT`: 10000
5. Advanced settings:
   - Health Check Path: `/health`
   - Auto-Deploy: Yes
6. Click "Create Web Service"

## Post-Deployment Checklist

- [ ] All three services are running (green status)
- [ ] Health endpoint returns 200 OK
- [ ] Database migrations completed successfully
- [ ] Redis connection is working
- [ ] Environment variables are set correctly
- [ ] Service URL is accessible
- [ ] Logs show no errors

## Next Steps

After successful deployment:

1. Save the web service URL for frontend configuration
2. Run the deployment verification script (Task 5)
3. Test API endpoints
4. Test WebSocket connections
5. Verify session management works

## Useful Render Commands

```bash
# Install Render CLI (optional)
npm install -g render-cli

# Login to Render
render login

# View services
render services list

# View logs
render logs <service-name>

# Restart service
render restart <service-name>
```

## Support Resources

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Render Status: https://status.render.com

## Notes

- **Free Tier Limitations**:
  - Services spin down after 15 minutes of inactivity
  - First request after spin-down takes 30-60 seconds
  - 750 hours/month of runtime
  - Suitable for staging/testing

- **Upgrade Considerations**:
  - For production, consider paid plans for:
    - Always-on services (no spin-down)
    - More resources (CPU/memory)
    - Better performance
    - Priority support

