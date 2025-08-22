# Production Deployment Guide

## Backend Deployment

The backend needs to be running on your production server for the frontend to work. Here's how to deploy it:

### Option 1: Deploy to Render.com (Recommended)

1. **Push your code to GitHub** (if not already done)
2. **Connect your repository to Render.com**:
   - Go to [render.com](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository
   - The `render.yaml` file will automatically configure the deployment

3. **Get the Render URL**:
   - After deployment, Render will provide a URL like `https://casino-backend-xxxx.onrender.com`
   - Update the frontend build with this URL

### Option 2: Deploy to Your Server

If you want to deploy the backend to the same server as your frontend:

1. **Upload backend files to your server**:
   ```bash
   # Upload the backend directory to your server
   scp -r backend/ user@your-server:/path/to/backend/
   ```

2. **Install Python dependencies**:
   ```bash
   cd /path/to/backend
   pip3 install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/casino_game"
   export CORS_ORIGINS="https://khasinogaming.com,https://www.khasinogaming.com"
   ```

4. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Start the backend server**:
   ```bash
   # For development
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   
   # For production
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

6. **Set up a process manager** (recommended):
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'casino-backend',
       script: 'uvicorn',
       args: 'main:app --host 0.0.0.0 --port 8000',
       cwd: '/path/to/backend',
       env: {
         DATABASE_URL: 'postgresql://username:password@localhost:5432/casino_game',
         CORS_ORIGINS: 'https://khasinogaming.com,https://www.khasinogaming.com'
       }
     }]
   }
   EOF
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 3: Use Docker (Recommended for Production)

1. **Build and run with Docker**:
   ```bash
   # Build the image
   docker build -t casino-backend ./backend
   
   # Run the container
   docker run -d \
     --name casino-backend \
     -p 8000:8000 \
     -e DATABASE_URL="postgresql://username:password@host:5432/casino_game" \
     -e CORS_ORIGINS="https://khasinogaming.com,https://www.khasinogaming.com" \
     casino-backend
   ```

2. **Or use Docker Compose**:
   ```bash
   docker-compose up -d
   ```

## Frontend Configuration

After deploying the backend, update the frontend to use the correct API URL:

1. **Set the environment variable**:
   ```bash
   export VITE_API_URL="https://your-backend-url.com"
   ```

2. **Rebuild the frontend**:
   ```bash
   npm run build
   ```

3. **Deploy the updated frontend**

## Testing the Deployment

1. **Test the backend health endpoint**:
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Test the API endpoints**:
   ```bash
   curl https://your-backend-url.com/
   ```

3. **Test from the frontend**:
   - Open your frontend in a browser
   - Try to create a room
   - Check the browser console for any errors

## Troubleshooting

### Common Issues

1. **Connection timeout**:
   - Check if the backend is running
   - Verify the port is accessible
   - Check firewall settings

2. **CORS errors**:
   - Update CORS_ORIGINS in backend environment
   - Ensure the frontend domain is included

3. **Database connection errors**:
   - Verify DATABASE_URL is correct
   - Check if PostgreSQL is running
   - Run database migrations

4. **Port already in use**:
   - Change the port in the backend configuration
   - Update the frontend API URL accordingly

### Logs

Check backend logs for debugging:
```bash
# If using PM2
pm2 logs casino-backend

# If using Docker
docker logs casino-backend

# If running directly
tail -f /path/to/backend/logs/app.log
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://khasinogaming.com` |
| `PORT` | Backend port | `8000` |
| `HOST` | Backend host | `0.0.0.0` |

## Security Considerations

1. **Use HTTPS** in production
2. **Set up proper CORS** origins
3. **Use environment variables** for sensitive data
4. **Set up rate limiting** if needed
5. **Monitor logs** for suspicious activity
