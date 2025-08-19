# Casino Card Game - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy Backend:**
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **Get your Railway URL** from the dashboard (e.g., `https://your-app.railway.app`)

5. **Set Environment Variable** in your frontend:
   ```bash
   # Create .env file in root directory
   echo "VITE_API_URL=https://your-app.railway.app" > .env
   ```

6. **Deploy Frontend** to your hosting service with the environment variable

### Option 2: Render

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Set build command:** `pip install -r backend/requirements.txt`
4. **Set start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. **Add environment variable:** `DATABASE_URL=your_postgresql_url`

### Option 3: Heroku

1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   heroku create your-casino-app
   ```

3. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Deploy:**
   ```bash
   git push heroku master
   ```

## 🗄️ Database Setup

### PostgreSQL (Recommended for Production)

1. **Create a PostgreSQL database** (Railway, Render, or Heroku provide this)
2. **Set DATABASE_URL environment variable**
3. **Run migrations:**
   ```bash
   cd backend
   alembic upgrade head
   ```

### SQLite (Development Only)

- Used automatically for local development
- Not recommended for production

## 🔧 Environment Variables

### Backend (.env in backend/ directory)
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Frontend (.env in root directory)
```
VITE_API_URL=https://your-backend-url.com
```

## 🚀 Frontend Deployment

### Vercel
1. **Connect your GitHub repository**
2. **Set environment variable:** `VITE_API_URL=https://your-backend-url.com`
3. **Deploy**

### Netlify
1. **Connect your GitHub repository**
2. **Set environment variable:** `VITE_API_URL=https://your-backend-url.com`
3. **Deploy**

## 🔍 Troubleshooting

### Backend Issues
- Check Railway/Render/Heroku logs
- Verify DATABASE_URL is correct
- Ensure all dependencies are in requirements.txt

### Frontend Issues
- Verify VITE_API_URL is set correctly
- Check browser console for CORS errors
- Ensure backend is running and accessible

## 📞 Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test the backend API endpoints directly