# Casino Card Game - Deployment Guide

> **⚠️ The live game is now serverless (peer-to-peer).** It ships as a static
> SvelteKit build with the game engine and networking running entirely in the
> browser — see the README's [Deployment](README.md#-deployment) and
> [Architecture](README.md#-architecture) sections. To deploy the game, you only
> need to build the static site and upload `build/` to any static host; **no
> backend is required.**
>
> The guide below documents the **legacy** client-server backend (`backend/`),
> kept for reference. You do not need any of it to run or deploy the current game.

## Overview

This guide provides comprehensive instructions for deploying the Casino Card Game application to production. The application is **host-agnostic** and uses a two-tier deployment architecture:

- **Backend**: A self-hosted FastAPI service (run it on any VPS, container host, or your own machine) backed by PostgreSQL (or SQLite for small setups) and optional Redis.
- **Frontend**: A static SvelteKit build deployable to any static host (e.g. khasinogaming.com via FTP). It resolves the backend endpoint from `VITE_API_URL`/`VITE_WS_URL`, falling back to the same origin when those are unset.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Data stores   │
│ (Static Files)  │───▶│  FastAPI /       │───▶│ PostgreSQL or   │
│ any static host │    │  Uvicorn         │    │ SQLite          │
│ (e.g. /cassino/)│    │  (self-hosted)   │    │ + optional Redis│
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        ▲
        └── VITE_API_URL / VITE_WS_URL (or same-origin via reverse proxy) ──┘
```

## Prerequisites

### Required
- A server or machine to run the backend (any OS with Python 3.11+)
- A static host / web server for the frontend build (FTP, nginx, S3, etc.)
- [GitHub](https://github.com) account (optional, for CI/CD)

### Required Software
- **Node.js** 18+ and npm 8+
- **Python** 3.11+
- **Git** for version control
- **PostgreSQL** (recommended for production) or SQLite (small setups)
- **Redis** (optional — the backend degrades gracefully without it)

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

## Backend Deployment (self-hosted)

The backend is a standard FastAPI app served by Uvicorn. Deploy it to any host
that runs Python 3.11+.

### Step 1: Provision data stores
- **PostgreSQL** (recommended): create a database and note its connection string.
- **SQLite** (small/single-server setups): no setup needed — used automatically
  when `DATABASE_URL` is unset in development.
- **Redis** (optional): improves multi-instance coordination; the app runs without it.

### Step 2: Configure environment
Create `backend/.env` (or export these in your process manager):

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/cassino` | Required in production |
| `REDIS_URL` | `redis://localhost:6379` | Optional |
| `CORS_ORIGINS` | `https://your-frontend-domain` | Comma-separated allowed origins |
| `ENVIRONMENT` | `production` | Enables production behavior |
| `PORT` | `8000` | Any port; match your reverse proxy |

### Step 3: Run migrations + start the server
`start_production.py` runs Alembic migrations automatically, then starts Uvicorn:
```bash
cd backend
python start_production.py
```
On startup you should see:
```
🔄 Running database migrations...
✅ Migrations completed successfully
✅ Database initialized
✅ Background tasks started
✨ Backend ready!
INFO: Application startup complete.
```
Alternatively, run Uvicorn directly under a process manager (systemd, pm2, supervisor):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

### Step 4: Reverse proxy (recommended)
Terminate TLS and forward both HTTP and WebSocket traffic. Serving the frontend
and API on the **same origin** means the frontend needs no `VITE_API_URL`.

nginx example:
```nginx
server {
    server_name your-domain;

    # Static frontend
    location /cassino/ { root /var/www; try_files $uri $uri/ /cassino/index.html; }

    # API
    location /rooms/  { proxy_pass http://127.0.0.1:8000; }
    location /game/   { proxy_pass http://127.0.0.1:8000; }
    location /api/    { proxy_pass http://127.0.0.1:8000; }
    location /health  { proxy_pass http://127.0.0.1:8000; }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Step 5: Verify Deployment
```bash
curl https://your-backend-host/health
# Expected:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-01T12:00:00Z"
}
```
(`redis: disconnected` with `status: degraded` is normal when Redis is not configured.)

### Docker (optional)

A `Dockerfile` and `docker-compose.yml` are included to run the backend with
PostgreSQL and Redis:
```bash
docker compose up -d      # backend + postgres + redis
docker compose logs -f backend
```

### Database Migrations

Migrations run automatically on startup via `start_production.py`:

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
Run them manually if needed: `cd backend && alembic upgrade head`.

### Monitoring and Logs

- **Logs**: follow your process manager (`journalctl -u cassino-backend -f`) or
  `docker compose logs -f backend`.
- **Health**: poll `/health`; wire it into your uptime monitor and configure your
  process manager to restart on failure.

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
VITE_API_URL=https://your-backend-host
VITE_WS_URL=wss://your-backend-host
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
          VITE_API_URL: https://your-backend-host
          VITE_WS_URL: wss://your-backend-host
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
| `VITE_API_URL` | Backend API URL | `https://your-backend-host` |
| `VITE_WS_URL` | WebSocket URL | `wss://your-backend-host` |

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### Backend Deployment
- **Trigger**: Manual, or your own CI step / server pull on push to main/master
- **Platform**: self-hosted (systemd, Docker, pm2, or your CI of choice)
- **Process**:
  1. Pull the latest code on the server (`git pull`)
  2. Install dependencies (`pip install -r backend/requirements.txt`)
  3. Restart the service — `start_production.py` runs migrations automatically
  4. Verify `/health`

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
curl https://your-backend-host/health

# Check API root
curl https://your-backend-host/

# Monitor logs via your process manager (journalctl / docker logs)
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
Migrations run automatically on startup via `start_production.py`. To run or inspect manually on the server:

```bash
cd backend

# Apply latest migrations
alembic upgrade head

# View migration history
alembic history

# Check current revision
alembic current
```

### Database Backup and Recovery

#### Backup (PostgreSQL)
```bash
# Dump the database
pg_dump "$DATABASE_URL" > cassino-backup-$(date +%F).sql
```
For SQLite, simply copy the `.db` file while the server is stopped.

#### Restore from Backup
```bash
# Restore into a fresh database, then point DATABASE_URL at it and restart
psql "$DATABASE_URL" < cassino-backup-YYYY-MM-DD.sql
```

---

## Monitoring and Maintenance

### Health Monitoring

#### Automated Health Checks
- **Endpoint**: `/health`
- **Frequency**: configure in your uptime monitor / load balancer (e.g. every 30s)
- **Failure Action**: configure your process manager to restart on failure

#### Manual Health Checks
```bash
# Backend health
curl https://your-backend-host/health

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
- **Process manager / host metrics**: CPU, memory, restarts (systemd, Docker, your VPS panel)
- **Browser DevTools**: Frontend performance monitoring
- **Health Endpoint**: Custom health checks

### Log Management

#### Backend Logs (self-hosted)
```bash
# systemd
journalctl -u cassino-backend -f

# Docker
docker compose logs -f backend

# Filter by log level or search terms with grep

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

# Verify Python version on the server
python --version   # should be 3.11+

# Check build/startup logs in your process manager
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

# Check the database is reachable and running
# Restart the database service if needed
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
# Review startup/migration logs from your process manager

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
curl https://your-backend-host/health
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
wss://your-backend-host

# Test WebSocket connection in browser DevTools
# Check Network tab for WebSocket connections
# Monitor backend logs for WebSocket errors
```

---

## Security Considerations

### Backend Security

#### Environment Variables
- Never commit sensitive environment variables to git
- Store secrets outside the repo (env file with restricted permissions, secrets manager, or CI secrets)
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
Content-Security-Policy: default-src 'self'; connect-src 'self' https://your-backend-host wss://your-backend-host
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

#### On the server
```bash
# Check out the previous known-good commit and restart
git checkout <previous-commit>
pip install -r backend/requirements.txt
# restart the service (systemd/pm2/docker) — migrations re-run on startup
```

#### Via Git history
```bash
# Revert the offending commit
git revert <commit-hash>
git push origin main
# then pull + restart on the server
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
# Restore from a database backup (see Database Backup and Recovery above)
psql "$DATABASE_URL" < cassino-backup-YYYY-MM-DD.sql
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

### Backend Deployment (self-hosted)

#### Service Configuration
- [ ] Server provisioned with Python 3.11+
- [ ] Dependencies installed (`pip install -r backend/requirements.txt`)
- [ ] Database reachable and `DATABASE_URL` set
- [ ] Environment variables configured (`CORS_ORIGINS`, `ENVIRONMENT`, `PORT`, ...)
- [ ] Process manager / service configured to auto-restart
- [ ] Reverse proxy forwards HTTP + WebSocket (`/ws/`)

#### Verification
- [ ] Service running and staying up
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
- **SvelteKit Documentation**: https://kit.svelte.dev
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **Uvicorn Deployment**: https://www.uvicorn.org/deployment/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Redis Documentation**: https://redis.io/docs/

### Getting Help

#### For Deployment Issues
1. Check this deployment guide
2. Review service logs (`journalctl` / `docker compose logs`)
3. Check your CI workflow logs (if used)
4. Test components individually (database, Redis, API, frontend)

#### For Application Issues
1. Check health endpoint: `/health`
2. Review error logs
3. Test with curl/Postman
4. Check WebSocket connections in browser DevTools

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Casino Card Game application to production. The application is self-hosted: a FastAPI backend you run on any Python 3.11+ host and a static frontend deployable to any static host or CDN.

Key characteristics of this deployment approach:
- **Host-agnostic** — no lock-in to any specific PaaS
- **Same-origin friendly** — a reverse proxy can serve app + API with zero build config
- **Graceful degradation** — runs with or without Redis
- **Automatic migrations** on startup via `start_production.py`

Follow the checklists and procedures in this guide to ensure successful deployments and maintain a stable production environment.