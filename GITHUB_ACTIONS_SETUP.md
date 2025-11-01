# GitHub Actions CI/CD Setup

This guide will help you set up automated deployment for both backend (Fly.io) and frontend (khasinogaming.com).

---

## 📋 Overview

### Workflows

1. **CI (ci.yml)** - Runs tests on every PR/push
2. **Deploy Backend (deploy-backend.yml)** - Deploys to Fly.io on push to main
3. **Deploy Frontend (deploy-frontend.yml)** - Deploys to khasinogaming.com on push to main

---

## 🔐 Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### For Backend (Fly.io)

1. **FLY_API_TOKEN**
   - Get your Fly.io API token:
   ```bash
   flyctl auth token
   ```
   - Copy the token and add it to GitHub secrets

### For Frontend (FTP Deployment)

1. **FTP_HOST** - Your FTP server hostname
   - Example: `ftp.khasinogaming.com` or `khasinogaming.com`

2. **FTP_USERNAME** - Your FTP username

3. **FTP_PASSWORD** - Your FTP password

---

## 📝 How to Add GitHub Secrets

1. **Go to your GitHub repository**
2. **Click Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add each secret:**
   - Name: `FLY_API_TOKEN`
   - Value: Your Fly.io API token
   
   Repeat for:
   - `FTP_HOST`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`

---

## 🚀 Deployment Process

### Automatic Deployment

**Backend:**
- Pushes to `main` or `master` branch
- Changes to `backend/**`, `Dockerfile`, or `fly.toml`
- Runs tests
- Deploys to Fly.io
- Runs database migrations
- Verifies deployment

**Frontend:**
- Pushes to `main` or `master` branch
- Changes to frontend files (`src/**`, `components/**`, etc.)
- Runs tests
- Builds frontend with production API URL
- Deploys to `khasinogaming.com/cassino/` via FTP

### Manual Deployment

You can also trigger deployments manually:
1. Go to **Actions** tab in GitHub
2. Select the workflow (e.g., "Deploy Backend to Fly.io")
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

---

## 🔍 Workflow Details

### Backend Deployment (deploy-backend.yml)

**Triggers:**
- Push to `main`/`master` with changes to:
  - `backend/**`
  - `Dockerfile`
  - `fly.toml`
  - `.dockerignore`
- Manual trigger

**Steps:**
1. Checkout code
2. Setup Fly.io CLI
3. Run backend tests
4. Deploy to Fly.io (`flyctl deploy`)
5. Run database migrations
6. Verify deployment (health check)

### Frontend Deployment (deploy-frontend.yml)

**Triggers:**
- Push to `main`/`master` with changes to:
  - `src/**`
  - `components/**`
  - `public/**`
  - `package.json`, `vite.config.ts`, etc.
- Manual trigger

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run frontend tests
5. Build frontend (`npm run build`)
6. Deploy to FTP server
7. Verify deployment

### CI Tests (ci.yml)

**Triggers:**
- Pull requests
- Pushes to `main`/`master`

**Steps:**
1. Test backend (Python tests)
2. Test frontend (TypeScript, lint, unit tests)

---

## ⚙️ Configuration

### Frontend Build Configuration

The frontend is built with:
- **Base path**: `/cassino/` (configured in `vite.config.ts`)
- **API URL**: `https://cassino-game-backend.fly.dev` (set via `VITE_API_URL`)

### FTP Deployment

The frontend deploys to:
- **Local directory**: `./dist/`
- **Server directory**: `/cassino/`
- **Files excluded**: `.git`, `node_modules`, `.env`, markdown files

---

## 🔧 Troubleshooting

### Backend Deployment Fails

**Issue: Authentication failed**
- Check `FLY_API_TOKEN` is set correctly
- Verify token is valid: `flyctl auth token`

**Issue: Deployment timeout**
- Check Fly.io status: `flyctl status`
- Check logs: `flyctl logs`

**Issue: Migration fails**
- Migrations are run automatically, but you can run manually:
  ```bash
  flyctl ssh console
  cd /app
  python -m alembic upgrade head
  ```

### Frontend Deployment Fails

**Issue: FTP connection failed**
- Verify FTP credentials are correct
- Check FTP server is accessible
- Ensure FTP_HOST, FTP_USERNAME, FTP_PASSWORD are set

**Issue: Build fails**
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check build logs for errors

**Issue: Files not uploading**
- Verify FTP directory permissions
- Check server-dir path is correct (`/cassino/`)
- Ensure base path in vite.config.ts matches

---

## ✅ Verification

### After Backend Deployment

Check backend is running:
```bash
curl https://cassino-game-backend.fly.dev/health
```

Expected response:
```json
{"status":"healthy","message":"Casino Card Game Backend is running"}
```

### After Frontend Deployment

Visit:
```
https://khasinogaming.com/cassino/
```

**Expected:**
- Game loads correctly
- Can create/join rooms
- API calls go to Fly.io backend

---

## 📊 Workflow Status

You can monitor deployments in:
- **GitHub Actions tab** - See all workflow runs
- **Fly.io dashboard** - https://fly.io/apps/cassino-game-backend
- **FTP server** - Check `/cassino/` directory

---

## 🎯 Quick Reference

**Backend URL:** `https://cassino-game-backend.fly.dev`
**Frontend URL:** `https://khasinogaming.com/cassino/`

**Required Secrets:**
- `FLY_API_TOKEN`
- `FTP_HOST`
- `FTP_USERNAME`
- `FTP_PASSWORD`

**Manual Deployment:**
```bash
# Backend
flyctl deploy

# Frontend (local)
npm run build
# Then upload dist/ to FTP
```

---

**Your CI/CD pipeline is now set up! 🚀**

Every push to `main` will automatically:
1. ✅ Run tests
2. ✅ Deploy backend to Fly.io
3. ✅ Deploy frontend to khasinogaming.com
