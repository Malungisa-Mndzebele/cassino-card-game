# Render Deployment - Quick Start

## 🚀 Deploy in 3 Steps

### Step 1: Create Account (5 min)
```
1. Go to https://render.com
2. Click "Sign Up"
3. Choose "Sign up with GitHub"
4. Authorize Render
```

### Step 2: Deploy Blueprint (10-15 min)
```
1. Click "New +" → "Blueprint"
2. Select your GitHub repository
3. Render detects render.yaml
4. Click "Apply"
```

### Step 3: Verify (5 min)
```bash
# Test health endpoint
curl https://cassino-game-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

## ✅ What Gets Created

- **cassino-game-backend** - FastAPI web service
- **cassino-db** - PostgreSQL database
- **cassino-redis** - Redis cache

## 📋 Deployment Checklist

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Blueprint deployed
- [ ] All services running (green status)
- [ ] Health endpoint returns 200
- [ ] Migrations completed successfully
- [ ] Service URL documented

## 🔍 Monitor Deployment

Watch logs for these messages:
```
🔄 Running database migrations...
✅ Migrations completed successfully
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:10000
```

## 📝 Save These URLs

After deployment, record:
- Web Service: `https://cassino-game-backend.onrender.com`
- Database: `postgresql://...` (from cassino-db Info tab)
- Redis: `redis://...` (from cassino-redis Info tab)

## ⚠️ Common Issues

**Build fails?**
→ Check backend/requirements.txt

**Database connection error?**
→ Verify DATABASE_URL is set

**Migration fails?**
→ Check logs for specific error

**Health check fails?**
→ Test endpoint manually

## 📚 Full Documentation

- **RENDER_DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **RENDER_DEPLOYMENT_CHECKLIST.md** - Detailed checklist
- **RENDER_DEPLOYMENT_STATUS.md** - Current status and next steps

## 🆘 Need Help?

1. Check RENDER_DEPLOYMENT_GUIDE.md for troubleshooting
2. Review Render service logs
3. Visit https://render.com/docs
4. Check https://status.render.com

## ⏱️ Timeline

- Account setup: 5 minutes
- Deployment: 10-15 minutes
- Verification: 5 minutes
- **Total: ~20-25 minutes**

## 🎯 Success Criteria

Task complete when:
✅ All services running
✅ Health endpoint accessible
✅ No errors in logs
✅ URLs documented

## ➡️ Next Task

After completion:
**Task 5**: Verify Render staging deployment

---

**Ready to deploy?** Follow the steps above or see RENDER_DEPLOYMENT_GUIDE.md for detailed instructions.

