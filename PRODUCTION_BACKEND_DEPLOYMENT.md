# Production Backend Deployment Guide

## 🚨 Current Issue
Your frontend at `https://khasinogaming.com/cassino/` is trying to connect to `https://khasinogaming.com:8000` but the backend is only running locally.

## 🎯 Solution Options

### Option 1: Hyperlift (Recommended - Easiest)

1. **Sign up at Hyperlift**: https://hyperlift.com
2. **Connect your GitHub repository**: `https://github.com/Malungisa-Mndzebele/cassino-card-game.git`
3. **Configure environment variables**:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/casino_game
   CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com
   PORT=8000
   HOST=0.0.0.0
   ```
4. **Deploy automatically** - Hyperlift will build and deploy your backend
5. **Get your backend URL** and update the frontend configuration

### Option 2: Deploy to Your Server (Manual)

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

### Option 3: Use Render.com (Alternative)

1. **Connect to Render**: https://render.com
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Use the existing `render.yaml`**
5. **Set environment variables**
6. **Deploy**

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

**Use Hyperlift** - It's the easiest solution and will automatically handle:
- ✅ Infrastructure management
- ✅ SSL/TLS certificates
- ✅ Automatic scaling
- ✅ Health monitoring
- ✅ Git-based deployments

Once deployed, your frontend will be able to connect to the backend and the game will work properly!
