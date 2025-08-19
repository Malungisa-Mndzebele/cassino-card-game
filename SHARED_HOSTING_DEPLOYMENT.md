# Shared Hosting Deployment Guide

This guide explains how to deploy the Casino Card Game to your Spaceship shared hosting server.

## Prerequisites

1. **SSH Access**: You need SSH access to your shared hosting server
2. **Python Support**: Your hosting provider must support Python 3.7+
3. **GitHub Secrets**: You need to add the following secrets to your GitHub repository

## GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### SSH Secrets
- `SSH_HOST`: Your server hostname (e.g., `server28.shared.spaceship.host`)
- `SSH_USERNAME`: Your SSH username
- `SSH_PRIVATE_KEY`: Your SSH private key (the entire key including `-----BEGIN OPENSSH PRIVATE KEY-----`)
- `SSH_PORT`: SSH port (usually `22`)

### FTP Secrets (for frontend)
- `FTP_HOST`: Your FTP hostname
- `FTP_USERNAME`: Your FTP username  
- `FTP_PASSWORD`: Your FTP password

## Deployment Process

1. **Push to GitHub**: The deployment will automatically trigger when you push to `main` or `master`

2. **Backend Deployment**: 
   - Backend will be deployed to `~/casino-backend/` on your server
   - Runs on port 8000 using `nohup`
   - Logs are saved to `backend.log`

3. **Frontend Deployment**:
   - Frontend will be deployed via FTP to your web root
   - Includes `.htaccess` for API reverse proxy

## Manual Backend Management

### Check if backend is running:
```bash
ssh your-username@your-server
ps aux | grep uvicorn
```

### Stop backend:
```bash
ssh your-username@your-server
pkill -f "uvicorn main:app"
```

### Start backend manually:
```bash
ssh your-username@your-server
cd ~/casino-backend
nohup python3 start_backend.py > backend.log 2>&1 &
```

### View backend logs:
```bash
ssh your-username@your-server
cd ~/casino-backend
tail -f backend.log
```

## Troubleshooting

### Backend not starting
1. Check if Python 3 is available: `python3 --version`
2. Check if pip is available: `pip3 --version`
3. Check logs: `cat ~/casino-backend/backend.log`

### API calls failing
1. Check if backend is running: `ps aux | grep uvicorn`
2. Test backend directly: `curl http://localhost:8000/health`
3. Check `.htaccess` is in place and mod_rewrite is enabled

### Port 8000 blocked
If your hosting provider blocks port 8000, you may need to:
1. Contact support to open the port
2. Use a different port (update the deployment scripts)
3. Set up a reverse proxy through your hosting control panel

## Alternative: Direct Port Access

If the reverse proxy doesn't work, you can access the backend directly:

1. Update `apiClient.ts` to use: `https://khasinogaming.com:8000`
2. Make sure port 8000 is accessible from the internet
3. Update CORS settings in `backend/main.py` to allow your domain

## Security Notes

- The backend runs with `--user` flag to install packages in user directory
- Backend logs are stored locally and should be monitored
- Consider setting up SSL certificates for secure API communication
- Regularly update Python dependencies for security patches
