# 📋 Spaceship Deployment Checklist

## Pre-Deployment

- [ ] All code tested locally
- [ ] Database credentials confirmed
- [ ] FTP/SSH access verified
- [ ] Python 3.8+ available on server

## Files to Upload

Upload these files to: `/home/mawdqtvped/khasinogaming.com/cassino/`

### Core Application Files
- [ ] `main.py` - Main FastAPI application
- [ ] `database.py` - Database configuration
- [ ] `models.py` - Database models
- [ ] `schemas.py` - Pydantic schemas
- [ ] `game_logic.py` - Game logic
- [ ] `requirements.txt` - Python dependencies

### Configuration Files
- [ ] `.env.production` - Production environment config (rename to `.env` on server)
- [ ] `alembic.ini` - Database migration config
- [ ] `.htaccess` - Apache reverse proxy config (if using Apache)

### Scripts
- [ ] `deploy_to_spaceship.sh` - Deployment script
- [ ] `start_server.sh` - Server startup script
- [ ] `start_production.py` - Production server script
- [ ] `test_db_connection.py` - Database connection test

### Alembic (Database Migrations)
- [ ] `alembic/` directory (entire folder)
  - [ ] `alembic/env.py`
  - [ ] `alembic/script.py.mako`
  - [ ] `alembic/versions/` (all migration files)

## Deployment Steps

### 1. Upload Files via FTP
```
Server: server28.shared.spaceship.host
Port: 21
Username: cassino@khasinogaming.com
Password: @QWERTYasd
Directory: /home/mawdqtvped/khasinogaming.com/cassino/
```

- [ ] Connected to FTP server
- [ ] All files uploaded successfully
- [ ] File permissions set correctly (755 for .sh files)

### 2. SSH into Server
```bash
ssh cassino@khasinogaming.com
# Or use cPanel Terminal if SSH not available
```

- [ ] SSH connection successful
- [ ] Navigated to correct directory

### 3. Run Deployment Script
```bash
cd /home/mawdqtvped/khasinogaming.com/cassino
chmod +x deploy_to_spaceship.sh
chmod +x start_server.sh
./deploy_to_spaceship.sh
```

- [ ] Script executed without errors
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Database connection successful
- [ ] Migrations completed

### 4. Configure Environment
```bash
# Verify .env file
cat .env

# Edit if needed
nano .env  # or vi .env
```

- [ ] DATABASE_URL correct (using localhost)
- [ ] CORS_ORIGINS set with your domain
- [ ] PORT configured (default 8000)

### 5. Start the Server
```bash
# Test run first
./start_server.sh

# If working, run in background:
nohup python start_production.py > server.log 2>&1 &

# Or use screen:
screen -S casino-backend
python start_production.py
# Press Ctrl+A then D to detach
```

- [ ] Server starts without errors
- [ ] No database connection errors
- [ ] Process running in background

### 6. Test API Endpoints
```bash
# From the server
curl http://localhost:8000/health

# Check response
curl http://localhost:8000/

# Test database
curl http://localhost:8000/rooms/create -X POST -H "Content-Type: application/json" -d '{"player_name":"TestPlayer"}'
```

- [ ] Health endpoint returns 200 OK
- [ ] Root endpoint accessible
- [ ] Can create rooms successfully

### 7. Configure Firewall/Proxy

**Option A: Apache Reverse Proxy (Recommended)**
- [ ] Uploaded `.htaccess` to web root
- [ ] Apache mod_proxy enabled
- [ ] Tested: `http://khasinogaming.com/api/health`

**Option B: Open Port**
- [ ] Contacted Spaceship support to open port 8000
- [ ] Tested: `http://khasinogaming.com:8000/health`

### 8. Frontend Configuration
Update frontend API URL:
- [ ] Updated API endpoint in frontend code
- [ ] Tested frontend can connect to backend
- [ ] CORS working correctly

### 9. Monitoring Setup
```bash
# View logs
tail -f server.log

# Check process
ps aux | grep python

# Monitor resources
top
htop
```

- [ ] Logs being written
- [ ] Process running stable
- [ ] No memory issues

## Post-Deployment

### Verification
- [ ] API health check passing
- [ ] Database queries working
- [ ] Can create rooms
- [ ] Can join rooms
- [ ] WebSocket connections working
- [ ] Game logic functioning

### Security
- [ ] Database credentials secure
- [ ] .env file not publicly accessible
- [ ] CORS properly configured
- [ ] HTTPS enabled (recommended)

### Monitoring
- [ ] Log rotation configured
- [ ] Error alerting set up (optional)
- [ ] Performance monitoring (optional)

### Documentation
- [ ] API documentation accessible
- [ ] Deployment notes recorded
- [ ] Server credentials stored securely

## Troubleshooting Quick Reference

### Server Won't Start
```bash
# Check Python
python3 --version

# Check virtual environment
source venv/bin/activate
which python

# Check dependencies
pip list | grep fastapi

# Run with verbose logging
python start_production.py
```

### Database Connection Issues
```bash
# Test connection
python test_db_connection.py

# Check MySQL service
systemctl status mysql
# or
service mysql status

# Test MySQL directly
mysql -u mawdqtvped_cassino_user -p mawdqtvped_cassino
```

### Port Issues
```bash
# Check if port is in use
netstat -tulpn | grep 8000
# or
lsof -i :8000

# Check firewall
iptables -L
```

### Process Management
```bash
# Find process
ps aux | grep python

# Kill process
pkill -f "start_production.py"

# Restart
nohup python start_production.py > server.log 2>&1 &
```

## Maintenance

### Regular Tasks
- [ ] Monitor logs daily
- [ ] Check disk space weekly
- [ ] Update dependencies monthly
- [ ] Backup database regularly

### Update Procedure
1. Upload new files via FTP
2. SSH into server
3. Activate virtual environment
4. Update dependencies: `pip install -r requirements.txt`
5. Run migrations: `alembic upgrade head`
6. Restart server: `pkill -f start_production.py && nohup python start_production.py > server.log 2>&1 &`

## Support Contacts

- **Spaceship Support**: [Spaceship Help Center]
- **Server**: server28.shared.spaceship.host
- **Email**: cassino@khasinogaming.com

## Notes

- Production environment uses MySQL (not SQLite)
- Database connection is `localhost` on server
- Keep `.env` file secure and backed up
- Monitor logs for any security issues
- Consider setting up SSL/HTTPS for production

