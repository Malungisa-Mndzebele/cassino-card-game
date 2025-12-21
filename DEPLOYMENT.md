# Casino Card Game - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Casino Card Game application to production. The application uses a two-tier deployment architecture:

- **Backend**: Deployed on Render with PostgreSQL and Redis managed services
- **Frontend**: Deployed via FTP to khasinogaming.com with static file hosting

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Databases     │
│ (Static Files)  │───▶│   (Render)       │───▶│ PostgreSQL +    │
│ khasinogaming   │    │ FastAPI + Redis  │    │ Redis (Render)  │
│ .com/cassino/   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Accounts
- [Render](https://render.com) account (free tier available)
- FTP access to your web hosting provider
- [GitHub](https://github.com) account (for CI/CD)

### Required Software
- **Node.js** 18+ and npm 8+
- **Python** 3.11+
- **Git** for version control
- **FTP client** (or use automated deployment)

### Environment Setup
```bash
# Clone repository
git clone <your-repo-url>
cd cassino-card-game

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

---

## Backend Deployment (Render)

### Method 1: Blueprint Deployment (Recommended)

The easiest way to deploy is using Render's Blueprint feature with the included `render.yaml` configuration.

#### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Sign Up" and choose "Sign up with GitHub"
3. Authorize Render to access your repositories

#### Step 2: Deploy via Blueprint
1. In Render dashboard, click "New +" → "Blueprint"
2. Select your GitHub repository
3. Render will detect the `render.yaml` file
4. Review the services that will be created:
   - `cassino-game-backend` (Web Service)
   - `cassino-db` (PostgreSQL Database)
   - `cassino-redis` (Redis Instance)
5. Click "Apply" to start deployment

#### Step 3: Monitor Deployment
Watch the deployment logs for these key messages:
```
🔄 Running database migrations...
✅ Migrations completed successfully
✅ Database initialized
✅ Redis connected
✅ Background tasks started
✅ WebSocket subscriber started
✨ Backend ready!
INFO: Application startup complete.
```

#### Step 4: Verify Deployment
```bash
# Test health endpoint
curl https://cassino-game-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "database": "connected", 
  "redis": "connected",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Method 2: Manual Service Creation

If Blueprint deployment fails, you can create services manually:

#### Create PostgreSQL Database
1. In Render dashboard: "New +" → "PostgreSQL"
2. Name: `cassino-db`
3. Database Name: `cassino`
4. User: `cassino_user`
5. Region: Oregon (US West)
6. Plan: Free
7. Click "Create Database"

#### Create Redis Instance
1. In Render dashboard: "New +" → "Redis"
2. Name: `cassino-redis`
3. Region: Oregon (US West)
4. Plan: Free
5. Click "Create Redis"

#### Create Web Service
1. In Render dashboard: "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `cassino-game-backend`
   - **Environment**: Python
   - **Region**: Oregon (US West)
   - **Branch**: `main` or `master`
   - **Root Directory**: Leave empty
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python backend/start_production.py`

#### Configure Environment Variables
Add these environment variables to the web service:

| Variable | Value | Source |
|----------|-------|---------|
| `PYTHON_VERSION` | `3.11.0` | Manual |
| `DATABASE_URL` | | From `cassino-db` → Info → Internal Database URL |
| `REDIS_URL` | | From `cassino-redis` → Info → Internal Redis URL |
| `CORS_ORIGINS` | `https://khasinogaming.com,http://khasinogaming.com` | Manual |
| `ENVIRONMENT` | `production` | Manual |
| `PORT` | `10000` | Manual |

### Deployment Configuration Details

The `render.yaml` file configures:

```yaml
services:
  - type: web
    name: cassino-game-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python backend/start_production.py
    healthCheckPath: /health
    autoDeploy: true  # Automatic deployment on git push
```

### Database Migrations

Migrations run automatically on deployment via `start_production.py`:

```python
def run_migrations():
    """Run database migrations before starting server"""
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        check=True
    )
```

### Monitoring and Logs

#### View Logs
1. Go to Render dashboard
2. Select `cassino-game-backend` service
3. Click "Logs" tab
4. Monitor for errors or performance issues

#### Health Monitoring
- Health check endpoint: `/health`
- Automatic restart on health check failure
- Uptime monitoring via Render dashboard

---

## Frontend Deployment (FTP)

The frontend is built as a static SvelteKit application and deployed via FTP to a web hosting provider.

### Build Configuration

The frontend is configured for static deployment in `svelte.config.js`:

```javascript
export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: true
    }),
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/cassino' : ''
    }
  }
}
```

### Manual Deployment Steps

#### Step 1: Configure Environment Variables
Create a `.env` file in the project root:

```env
VITE_API_URL=https://cassino-game-backend.onrender.com
VITE_WS_URL=wss://cassino-game-backend.onrender.com
```

#### Step 2: Build for Production
```bash
# Install dependencies
npm install

# Run tests (optional)
npm run test:frontend

# Build for production
npm run build
```

This creates a `build/` directory with static files.

#### Step 3: Deploy via FTP
```bash
# Using automated deployment script
npm run deploy:ftp

# Or manually upload build/ contents to your web server
# Upload to: /public_html/cassino/ (or equivalent path)
```

### Automated Deployment (GitHub Actions)

The repository includes a GitHub Actions workflow for automated frontend deployment:

#### Setup FTP Secrets
In your GitHub repository settings, add these secrets:
- `FTP_HOST` - Your FTP server hostname
- `FTP_USERNAME` - Your FTP username  
- `FTP_PASSWORD` - Your FTP password

#### Workflow Configuration
The workflow in `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to khasinogaming.com

on:
  push:
    branches: [main, master]
    paths: ['src/**', 'public/**', 'package.json']

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Build frontend
        env:
          VITE_API_URL: https://cassino-game-backend.onrender.com
          VITE_WS_URL: wss://cassino-game-backend.onrender.com
        run: npm run build
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.3
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./build/
          server-dir: /
```

#### Deployment Triggers
Automatic deployment occurs when:
- Code is pushed to `main` or `master` branch
- Changes are made to frontend files (`src/`, `public/`, config files)
- Manual workflow dispatch is triggered

---

## Environment Variables

### Backend Environment Variables

#### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |

#### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `ROOT_PATH` | API root path prefix | `""` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `WORKERS` | Number of workers | `1` |
| `ENVIRONMENT` | Environment name | `production` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://cassino-game-backend.onrender.com` |
| `VITE_WS_URL` | WebSocket URL | `wss://cassino-game-backend.onrender.com` |

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### Backend Deployment
- **Trigger**: Push to main/master branch
- **Platform**: Render (automatic via git integration)
- **Process**: 
  1. Render detects git push
  2. Builds using `render.yaml` configuration
  3. Runs migrations automatically
  4. Deploys to production

#### Frontend Deployment
- **Trigger**: Push to main/master branch (frontend files only)
- **Platform**: GitHub Actions → FTP
- **Process**:
  1. Install dependencies
  2. Run tests
  3. Build static files
  4. Deploy via FTP to web server

### Deployment Status Monitoring

#### Backend Status
```bash
# Check service health
curl https://cassino-game-backend.onrender.com/health

# Check API root
curl https://cassino-game-backend.onrender.com/

# Monitor logs via Render dashboard
```

#### Frontend Status
```bash
# Test production frontend
npm run test:production

# Check live site
curl https://khasinogaming.com/cassino/
```

---

## Database Management

### Migrations

#### Creating Migrations
```bash
cd backend

# Generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Review generated migration file
# Edit if needed for complex changes

# Test migration locally
alembic upgrade head
```

#### Production Migrations
Migrations run automatically on Render deployment via `start_production.py`. Manual migration:

```bash
# Connect to Render service (if needed)
# Migrations run automatically, but you can check status:

# View migration history
alembic history

# Check current revision
alembic current
```

### Database Backup and Recovery

#### Backup (via Render Dashboard)
1. Go to Render dashboard
2. Select `cassino-db` database
3. Click "Backups" tab
4. Click "Create Backup"
5. Download backup file

#### Restore from Backup
1. Create new database instance
2. Upload backup file
3. Update `DATABASE_URL` environment variable
4. Restart web service

---

## Monitoring and Maintenance

### Health Monitoring

#### Automated Health Checks
- **Endpoint**: `/health`
- **Frequency**: Every 30 seconds (Render default)
- **Timeout**: 30 seconds
- **Failure Action**: Automatic service restart

#### Manual Health Checks
```bash
# Backend health
curl https://cassino-game-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-01T12:00:00Z"
}

# Frontend health
curl -I https://khasinogaming.com/cassino/
# Expected: HTTP 200 OK
```

### Performance Monitoring

#### Key Metrics to Monitor
- **Response Time**: API endpoints should respond < 500ms
- **Database Connections**: Monitor connection pool usage
- **Redis Memory**: Monitor memory usage and eviction
- **WebSocket Connections**: Monitor active connections
- **Error Rate**: Monitor 4xx/5xx error rates

#### Monitoring Tools
- **Render Dashboard**: Built-in metrics and logs
- **Browser DevTools**: Frontend performance monitoring
- **Health Endpoint**: Custom health checks

### Log Management

#### Backend Logs (Render)
```bash
# View logs via Render dashboard:
# 1. Go to cassino-game-backend service
# 2. Click "Logs" tab
# 3. Filter by log level or search terms

# Key log messages to monitor:
# - "✨ Backend ready!" - Successful startup
# - "❌" - Error messages
# - WebSocket connection/disconnection events
# - Database query errors
```

#### Frontend Logs
```bash
# Browser console logs
# Monitor for:
# - WebSocket connection errors
# - API request failures
# - JavaScript errors
# - Performance warnings
```

---

## Troubleshooting

### Common Backend Issues

#### Build Failures
**Symptom**: Deployment fails during build phase
**Causes**: 
- Missing dependencies in `requirements.txt`
- Python version incompatibility
- Build timeout

**Solutions**:
```bash
# Check requirements.txt includes all dependencies
pip freeze > backend/requirements.txt

# Verify Python version in render.yaml
env:
  PYTHON_VERSION: 3.11.0

# Check build logs in Render dashboard
```

#### Database Connection Errors
**Symptom**: `500` errors, "database connection failed"
**Causes**:
- Incorrect `DATABASE_URL`
- Database service down
- Connection pool exhausted

**Solutions**:
```bash
# Verify DATABASE_URL format
postgresql://user:password@host:port/database

# Check database service status in Render dashboard
# Restart database service if needed
# Check connection pool settings
```

#### Redis Connection Errors
**Symptom**: Session management failures, cache misses
**Causes**:
- Incorrect `REDIS_URL`
- Redis service down
- Memory limit exceeded

**Solutions**:
```bash
# Verify REDIS_URL format
redis://host:port

# Check Redis service status
# Monitor memory usage
# Clear Redis cache if needed
```

#### Migration Failures
**Symptom**: Deployment succeeds but app crashes on startup
**Causes**:
- Migration syntax errors
- Database schema conflicts
- Missing migration dependencies

**Solutions**:
```bash
# Check migration files for syntax errors
# Test migrations locally first
# Review migration logs in Render dashboard

# Manual migration (if needed):
# 1. Connect to database
# 2. Run: alembic upgrade head
```

### Common Frontend Issues

#### Build Failures
**Symptom**: GitHub Actions workflow fails
**Causes**:
- TypeScript errors
- Missing dependencies
- Environment variable issues

**Solutions**:
```bash
# Run build locally to identify issues
npm run build

# Check TypeScript errors
npm run check

# Verify environment variables are set
echo $VITE_API_URL
```

#### FTP Deployment Failures
**Symptom**: Files not uploading or deployment timeout
**Causes**:
- Incorrect FTP credentials
- Network connectivity issues
- Server permissions

**Solutions**:
```bash
# Verify FTP credentials in GitHub secrets
# Test FTP connection manually
# Check server disk space and permissions
# Try manual FTP upload to isolate issue
```

#### API Connection Issues
**Symptom**: Frontend can't connect to backend
**Causes**:
- Incorrect API URL configuration
- CORS issues
- Backend service down

**Solutions**:
```bash
# Verify API URL in build
grep -r "cassino-game-backend" build/

# Check CORS configuration in backend
CORS_ORIGINS=https://khasinogaming.com

# Test API directly
curl https://cassino-game-backend.onrender.com/health
```

### WebSocket Issues

#### Connection Failures
**Symptom**: Real-time updates not working
**Causes**:
- WebSocket URL incorrect
- Proxy/firewall blocking WebSocket
- Backend WebSocket handler errors

**Solutions**:
```bash
# Verify WebSocket URL
wss://cassino-game-backend.onrender.com

# Test WebSocket connection in browser DevTools
# Check Network tab for WebSocket connections
# Monitor backend logs for WebSocket errors
```

---

## Security Considerations

### Backend Security

#### Environment Variables
- Never commit sensitive environment variables to git
- Use Render's environment variable management
- Rotate database passwords regularly

#### CORS Configuration
```python
# Restrict CORS to specific domains
CORS_ORIGINS=https://khasinogaming.com,http://khasinogaming.com

# Never use "*" in production
```

#### Database Security
- Use strong database passwords
- Enable SSL connections
- Restrict database access to internal networks only

### Frontend Security

#### API Keys
- Never expose backend API keys in frontend code
- Use environment variables for configuration
- Validate all user inputs

#### Content Security Policy
Consider adding CSP headers to your web server:
```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://cassino-game-backend.onrender.com wss://cassino-game-backend.onrender.com
```

---

## Performance Optimization

### Backend Optimization

#### Database Performance
- Monitor slow queries
- Add database indexes for frequently queried fields
- Use connection pooling
- Implement query caching where appropriate

#### Redis Optimization
```python
# Configure Redis memory policy
redis-cli config set maxmemory-policy allkeys-lru

# Monitor Redis memory usage
redis-cli info memory

# Set appropriate TTLs for cached data
```

#### API Performance
- Enable gzip compression
- Implement response caching
- Monitor API response times
- Use async/await for database operations

### Frontend Optimization

#### Build Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte']
        }
      }
    }
  }
})
```

#### Asset Optimization
- Compress images before deployment
- Use WebP format for images where supported
- Enable gzip compression on web server
- Implement browser caching headers

---

## Rollback Procedures

### Backend Rollback

#### Via Render Dashboard
1. Go to `cassino-game-backend` service
2. Click "Deploys" tab
3. Find previous successful deployment
4. Click "Redeploy" on that version

#### Via Git
```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Frontend Rollback

#### Via GitHub Actions
1. Go to repository Actions tab
2. Find previous successful deployment workflow
3. Click "Re-run jobs"

#### Manual Rollback
```bash
# Checkout previous version
git checkout <previous-commit>

# Build and deploy
npm run build
npm run deploy:ftp

# Return to main branch
git checkout main
```

### Database Rollback

#### Migration Rollback
```bash
# Rollback to specific migration
alembic downgrade <revision>

# Rollback one migration
alembic downgrade -1
```

#### Data Rollback
```bash
# Restore from backup (via Render dashboard)
# 1. Go to cassino-db service
# 2. Click "Backups" tab
# 3. Select backup to restore
# 4. Click "Restore"
```

---

## Deployment Checklist

### Pre-Deployment

#### Code Quality
- [ ] All tests passing locally
- [ ] No TypeScript errors
- [ ] Code reviewed and approved
- [ ] Documentation updated

#### Environment Setup
- [ ] Environment variables configured
- [ ] Database migrations created (if needed)
- [ ] Dependencies updated in requirements.txt/package.json

#### Testing
- [ ] Local development testing complete
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance testing complete

### Backend Deployment (Render)

#### Service Configuration
- [ ] Render account set up
- [ ] GitHub repository connected
- [ ] Blueprint deployment successful OR manual services created
- [ ] Environment variables configured
- [ ] Health check endpoint configured

#### Verification
- [ ] All services running (green status in dashboard)
- [ ] Health endpoint returns 200 OK
- [ ] Database migrations completed successfully
- [ ] Redis connection working
- [ ] WebSocket connections working
- [ ] API endpoints responding correctly

#### Monitoring Setup
- [ ] Log monitoring configured
- [ ] Health check alerts set up
- [ ] Performance monitoring in place
- [ ] Error tracking configured

### Frontend Deployment (FTP)

#### Build Configuration
- [ ] Environment variables set correctly
- [ ] Build configuration verified
- [ ] Static adapter configured
- [ ] Base path set correctly (/cassino)

#### Deployment
- [ ] FTP credentials configured in GitHub secrets
- [ ] GitHub Actions workflow working
- [ ] Build artifacts generated correctly
- [ ] Files uploaded to correct server path

#### Verification
- [ ] Frontend accessible at production URL
- [ ] API connections working
- [ ] WebSocket connections working
- [ ] All pages loading correctly
- [ ] Mobile responsiveness verified

### Post-Deployment

#### Functional Testing
- [ ] Create room functionality working
- [ ] Join room functionality working
- [ ] Game play working end-to-end
- [ ] Real-time synchronization working
- [ ] Session management working
- [ ] Reconnection working

#### Performance Testing
- [ ] Page load times acceptable (< 3s)
- [ ] API response times acceptable (< 500ms)
- [ ] WebSocket latency acceptable (< 100ms)
- [ ] Database query performance acceptable

#### Monitoring
- [ ] Health checks passing
- [ ] Error rates within acceptable limits
- [ ] Performance metrics within targets
- [ ] Log aggregation working

---

## Maintenance Schedule

### Daily
- [ ] Check service health status
- [ ] Monitor error rates
- [ ] Review critical logs

### Weekly
- [ ] Review performance metrics
- [ ] Check database backup status
- [ ] Update dependencies (if needed)
- [ ] Review security alerts

### Monthly
- [ ] Full backup verification
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Dependency updates
- [ ] Documentation updates

---

## Support and Resources

### Documentation
- **API Documentation**: `backend/API.md`
- **Project README**: `README.md`
- **Architecture Documentation**: `.kiro/specs/complete-app-documentation/`

### External Resources
- **Render Documentation**: https://render.com/docs
- **SvelteKit Documentation**: https://kit.svelte.dev
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Redis Documentation**: https://redis.io/docs/

### Getting Help

#### For Deployment Issues
1. Check this deployment guide
2. Review service logs in Render dashboard
3. Check GitHub Actions workflow logs
4. Test components individually (database, Redis, API, frontend)

#### For Application Issues
1. Check health endpoint: `/health`
2. Review error logs
3. Test with curl/Postman
4. Check WebSocket connections in browser DevTools

#### Emergency Contacts
- **Render Support**: https://render.com/support
- **GitHub Support**: https://support.github.com
- **Hosting Provider Support**: Contact your FTP hosting provider

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Casino Card Game application to production. The deployment architecture using Render for backend services and FTP for frontend hosting provides a reliable, scalable, and cost-effective solution.

Key benefits of this deployment approach:
- **Automated deployments** via GitHub integration
- **Managed database and Redis** services
- **Health monitoring** and automatic restarts
- **Scalable architecture** that can grow with usage
- **Cost-effective** using free tiers where possible

Follow the checklists and procedures in this guide to ensure successful deployments and maintain a stable production environment.

For questions or issues not covered in this guide, refer to the support resources or contact the development team.