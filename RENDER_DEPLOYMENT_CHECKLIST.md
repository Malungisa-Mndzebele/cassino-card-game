# Render Deployment Checklist

## Quick Reference for Task 4: Deploy to Render Staging Environment

### Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] `render.yaml` file is in repository root
- [ ] `backend/requirements.txt` is complete
- [ ] `backend/start_production.py` includes migration logic
- [ ] Render account is created

### Deployment Steps

#### 1. Create Render Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub account
- [ ] Verify email if required

#### 2. Deploy via Blueprint
- [ ] Click "New +" → "Blueprint"
- [ ] Select GitHub repository
- [ ] Render detects `render.yaml`
- [ ] Review services to be created:
  - [ ] cassino-game-backend (Web Service)
  - [ ] cassino-redis (Redis)
  - [ ] cassino-db (PostgreSQL)
- [ ] Click "Apply"

#### 3. Monitor Deployment
- [ ] PostgreSQL database created (2-3 min)
- [ ] Redis instance created (1-2 min)
- [ ] Web service building (5-10 min)
- [ ] Watch logs for migration messages
- [ ] Look for "Application startup complete"

#### 4. Verify Services
- [ ] All services show green "Running" status
- [ ] Web service URL is accessible
- [ ] Database connection string is available
- [ ] Redis connection string is available

#### 5. Test Health Endpoint
```bash
curl https://cassino-game-backend.onrender.com/health
```
- [ ] Returns HTTP 200
- [ ] Response includes: `{"status": "healthy", "database": "connected", "redis": "connected"}`

#### 6. Verify Environment Variables
Go to web service → Environment tab:
- [ ] `PYTHON_VERSION`: 3.11.0
- [ ] `DATABASE_URL`: (auto-injected)
- [ ] `REDIS_URL`: (auto-injected)
- [ ] `CORS_ORIGINS`: https://khasinogaming.com
- [ ] `ENVIRONMENT`: production
- [ ] `PORT`: 10000

#### 7. Verify Database Migrations
Check logs for:
- [ ] "🔄 Running database migrations..."
- [ ] "✅ Migrations completed successfully"
- [ ] No migration errors

#### 8. Document Service URLs
Record these for later use:
- [ ] Web Service URL: `https://cassino-game-backend.onrender.com`
- [ ] Database Internal URL: `postgresql://...`
- [ ] Redis Internal URL: `redis://...`

### Post-Deployment Verification

- [ ] Health endpoint accessible
- [ ] Database tables created
- [ ] Alembic version table shows current migration
- [ ] No errors in logs
- [ ] Service responds to requests

### Common Issues & Quick Fixes

**Build Fails**
- Check `backend/requirements.txt`
- Verify Python 3.11.0 compatibility
- Review build logs

**Database Connection Error**
- Verify database service is running
- Check DATABASE_URL is set
- Ensure same region for all services

**Redis Connection Error**
- Verify Redis service is running
- Check REDIS_URL is set
- Note: Non-fatal, app falls back to database

**Migration Fails**
- Check database is empty
- Verify migration files exist
- Try manual migration via Shell

**Health Check Fails**
- Test endpoint manually
- Check database/Redis connections
- Review application logs

### Task Completion Criteria

✅ Task 4 is complete when:
1. Render account created and connected to GitHub
2. PostgreSQL database instance running
3. Redis instance running
4. Web service deployed and running
5. Environment variables correctly linked
6. Initial deployment successful
7. Logs show no errors
8. Service URLs documented

### Next Task

After completing this checklist, proceed to:
- **Task 5**: Verify Render staging deployment

### Time Estimate

- Account setup: 5 minutes
- Blueprint deployment: 10-15 minutes
- Verification: 5 minutes
- **Total**: ~20-25 minutes

### Support

If you encounter issues:
1. Check RENDER_DEPLOYMENT_GUIDE.md for detailed troubleshooting
2. Review Render service logs
3. Check Render status page: https://status.render.com
4. Consult Render documentation: https://render.com/docs

