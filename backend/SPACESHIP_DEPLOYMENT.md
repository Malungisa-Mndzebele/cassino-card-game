# Spaceship Hosting Deployment Guide

This guide will help you deploy the Casino Card Game backend to your Spaceship hosting server.

## 📋 Prerequisites

- **FTP Access**: [YOUR_FTP_USERNAME]
- **Server**: [YOUR_SERVER_HOST]
- **SSH Access**: Required (request from Spaceship if not enabled)
- **Database**: Already created and configured

## 🚀 Deployment Steps

### Step 1: Connect to Server via SSH

```bash
ssh [username]@[your-server]
# Use your SSH password
```

**Note**: If SSH is not enabled, contact Spaceship support to enable it, or use alternative methods like cPanel Terminal.

### Step 2: Navigate to Your Application Directory

```bash
cd [your-server-path]/cassino
```

If the directory doesn't exist, create it:
```bash
mkdir -p [your-server-path]/cassino
cd [your-server-path]/cassino
```

### Step 3: Upload Backend Files

**Option A: Using FTP (Recommended for first-time upload)**

1. Use an FTP client like FileZilla or WinSCP
2. Connect to: `[YOUR_SERVER_HOST]` (Port 21)
3. Username: `[YOUR_FTP_USERNAME]`
4. Password: `[YOUR_FTP_PASSWORD]`
5. Upload the entire `backend` folder to: `[YOUR_SERVER_PATH]/cassino/`

**Option B: Using Git (if available on server)**

```bash
# Clone or pull your repository
git clone <your-repo-url> .
# Or if already cloned:
git pull origin master
```

**Option C: Using SCP from your local machine**

```bash
# From your local machine (in the project directory)
scp -r backend/* [YOUR_FTP_USERNAME]@[YOUR_SERVER_HOST]:[YOUR_SERVER_PATH]/cassino/
```

### Step 4: Run Deployment Script

Once files are uploaded, SSH into the server and run:

```bash
cd [YOUR_SERVER_PATH]/cassino
chmod +x deploy_to_spaceship.sh
chmod +x start_server.sh
./deploy_to_spaceship.sh
```

This script will:
- ✅ Check Python installation
- ✅ Create virtual environment
- ✅ Install dependencies
- ✅ Set up environment variables
- ✅ Test database connection
- ✅ Run database migrations

### Step 5: Start the Backend Server

```bash
./start_server.sh
```

Or manually:
```bash
source venv/bin/activate
python start_production.py
```

### Step 6: Keep Server Running (Background Process)

**Option A: Using nohup (Simple)**
```bash
nohup python start_production.py > server.log 2>&1 &
```

**Option B: Using screen (Recommended)**
```bash
# Install screen if not available
# yum install screen  # or apt-get install screen

# Create a new screen session
screen -S casino-backend

# Start the server
python start_production.py

# Detach from screen: Press Ctrl+A, then D
# Reattach later: screen -r casino-backend
```

**Option C: Using systemd (Advanced - requires root)**
```bash
# See SYSTEMD_SERVICE.md for instructions
```

### Step 7: Verify Deployment

Test the API endpoints:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Or from outside the server (if firewall allows)
curl http://[YOUR_DOMAIN]:8000/health
```

## 🔒 Firewall & Port Configuration

**Important**: Port 8000 needs to be accessible. You may need to:

1. **Contact Spaceship Support** to open port 8000
2. **Use Apache/Nginx Reverse Proxy** (recommended for shared hosting)
3. **Use Cloudflare Tunnel** or similar service

### Recommended: Apache Reverse Proxy

Create `.htaccess` in your web root:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:8000/$1 [P,L]
```

Or create a proper Apache config (requires access):

```apache
<VirtualHost *:80>
    ServerName [YOUR_DOMAIN]
    
    ProxyPreserveHost On
    ProxyPass /api http://localhost:8000
    ProxyPassReverse /api http://localhost:8000
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/api/ws/(.*) ws://localhost:8000/ws/$1 [P,L]
</VirtualHost>
```

## 📊 Database Migrations

To run migrations manually:

```bash
cd [YOUR_SERVER_PATH]/cassino
source venv/bin/activate
alembic upgrade head
```

To create a new migration:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## 🔍 Troubleshooting

### Issue: Python not found
```bash
# Check Python installation
which python3
python3 --version

# If not installed, contact Spaceship support
```

### Issue: Permission denied
```bash
# Fix permissions
chmod +x deploy_to_spaceship.sh
chmod +x start_server.sh
chmod -R 755 [YOUR_SERVER_PATH]/cassino
```

### Issue: Database connection failed
```bash
# Test database connection
python test_db_connection.py

# Verify credentials in .env file
cat .env

# Test MySQL connection directly
mysql -u [YOUR_DB_USER] -p [YOUR_DB_NAME]
```

### Issue: Port 8000 not accessible
- Contact Spaceship support to open the port
- Or set up Apache reverse proxy (recommended)
- Or use a different allowed port (80, 443, etc.)

### View Server Logs
```bash
# If using nohup
tail -f server.log

# If using screen
screen -r casino-backend

# Check for errors
tail -f /var/log/apache2/error.log  # Apache logs
```

## 🔄 Updating the Application

To update your backend after making changes:

```bash
# Upload new files via FTP/SCP
# Then SSH into the server:

cd [YOUR_SERVER_PATH]/cassino
source venv/bin/activate

# Update dependencies if requirements.txt changed
pip install -r requirements.txt

# Run new migrations if any
alembic upgrade head

# Restart the server
# Kill old process:
pkill -f "python start_production.py"

# Start new process:
nohup python start_production.py > server.log 2>&1 &
```

## 📝 Important Notes

1. **Database**: Uses `localhost` connection (not remote)
2. **Files uploaded**: Must be owned by your user account
3. **Firewall**: Port 8000 must be accessible or use reverse proxy
4. **SSL**: Consider setting up HTTPS with Let's Encrypt
5. **Logs**: Monitor logs regularly for errors

## 🆘 Support

If you encounter issues:
1. Check the logs: `tail -f server.log`
2. Test database: `python test_db_connection.py`
3. Contact Spaceship support for server-level issues
4. Check Apache/Nginx logs if using reverse proxy

## ✅ Post-Deployment Checklist

- [ ] Files uploaded successfully
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] .env file configured correctly
- [ ] Database connection working
- [ ] Migrations run successfully
- [ ] Server starts without errors
- [ ] API endpoints responding
- [ ] CORS configured for frontend
- [ ] Process running in background
- [ ] Logs being monitored

## 🌐 Frontend Configuration

Update your frontend API URL to point to:
```javascript
const API_URL = 'http://[YOUR_DOMAIN]:8000';
// Or if using reverse proxy:
const API_URL = 'http://[YOUR_DOMAIN]/api';
```

