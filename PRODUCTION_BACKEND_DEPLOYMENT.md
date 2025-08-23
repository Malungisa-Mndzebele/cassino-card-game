# Production Backend Deployment Guide

## 🚨 Current Issue
Your frontend at `https://khasinogaming.com/cassino/` is trying to connect to `https://khasinogaming.com:8000` but the backend is only running locally.

## 🎯 Solution Options

### Option 1: Deploy to Your Server (Recommended)

### Option 2: Use Render.com (Alternative)

#### Step 1: Prepare Your Server
```bash
# On your server (khasinogaming.com)
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

#### Step 2: Clone and Deploy
```bash
# Clone your repository
git clone https://github.com/Malungisa-Mndzebele/casino-card-game.git
cd cassino-card-game

# Deploy using Docker
./deploy-prod.sh
```

#### Step 3: Configure Domain
Make sure port 8000 is accessible at `khasinogaming.com:8000`



## 🔧 Quick Fix for Testing

If you want to test locally first:

1. **Access the local frontend**: `http://localhost:3000/cassino/`
2. **Backend is already running**: `http://localhost:8000`
3. **Test the connection**

## 📋 Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database configured and running
- [ ] CORS settings updated
- [ ] Environment variables set
- [ ] Health check passing
- [ ] Frontend can connect to backend

## 🐛 Troubleshooting

### Connection Timeout
- Check if backend is running: `curl https://khasinogaming.com:8000/health`
- Verify firewall settings allow port 8000
- Check DNS configuration

### CORS Errors
- Update CORS_ORIGINS to include your domain
- Ensure HTTPS is properly configured

### Database Issues
- Verify DATABASE_URL is correct
- Check database connectivity
- Run migrations: `alembic upgrade head`

## 🎯 Recommended Action

**Deploy to your server** - This gives you full control over your infrastructure:
- ✅ Complete control over your deployment
- ✅ No third-party dependencies
- ✅ Custom domain configuration
- ✅ Full access to logs and monitoring
- ✅ Cost-effective for long-term hosting

Once deployed, your frontend will be able to connect to the backend and the game will work properly!
