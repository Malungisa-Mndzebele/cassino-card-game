# 🚀 Casino Card Game - Production Deployment Guide

Deploy your Casino Card Game to **khasinogaming.com/cassino/** without Docker.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or Windows Server
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB free space
- **Network**: Public IP with ports 80, 443, 8000 open

### Software Requirements
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 13+**
- **Nginx** (for reverse proxy and SSL)

## 🏗️ Deployment Steps

### 1. Server Setup

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y git curl wget unzip
```

#### Windows Server:
- Install Git for Windows
- Install Python 3.11+ from python.org
- Install Node.js 18+ from nodejs.org
- Install PostgreSQL from postgresql.org

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/Malungisa-Mndzebele/cassino-card-game.git
cd cassino-card-game
```

### 3. Backend Deployment

#### Ubuntu/Debian:
```bash
cd backend
chmod +x install_dependencies.sh
./install_dependencies.sh
```

#### Windows:
```cmd
cd backend
install_dependencies.bat
```

#### Manual Backend Setup:
```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE casino_game;"
sudo -u postgres psql -c "CREATE USER casino_user WITH PASSWORD 'casino_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE casino_game TO casino_user;"

# Run migrations
python -m alembic upgrade head

# Start backend
python start_production.py
```

### 4. Frontend Deployment

#### Ubuntu/Debian:
```bash
cd frontend
chmod +x install_dependencies.sh
./install_dependencies.sh
```

#### Windows:
```cmd
cd frontend
install_dependencies.bat
```

#### Manual Frontend Setup:
```bash
# Install dependencies
npm install

# Start frontend server
node production-server.js
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/cassino`:

```nginx
server {
    listen 80;
    server_name khasinogaming.com www.khasinogaming.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name khasinogaming.com www.khasinogaming.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/khasinogaming.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khasinogaming.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cassino /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d khasinogaming.com -d www.khasinogaming.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. System Services (Ubuntu)

Create systemd services for auto-start:

#### Backend Service (`/etc/systemd/system/cassino-backend.service`):
```ini
[Unit]
Description=Casino Card Game Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/cassino-card-game/backend
Environment=PATH=/path/to/cassino-card-game/backend/venv/bin
ExecStart=/path/to/cassino-card-game/backend/venv/bin/python start_production.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Frontend Service (`/etc/systemd/system/cassino-frontend.service`):
```ini
[Unit]
Description=Casino Card Game Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/cassino-card-game/frontend
Environment=NODE_ENV=production
Environment=BACKEND_URL=http://localhost:8000
ExecStart=/usr/bin/node production-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cassino-backend cassino-frontend
sudo systemctl start cassino-backend cassino-frontend
```

## 🔧 Environment Variables

### Backend (`.env` in backend directory):
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://casino_user:casino_password@localhost:5432/casino_game
HOST=0.0.0.0
PORT=8000
WORKERS=1
```

### Frontend (`.env` in frontend directory):
```env
NODE_ENV=production
BACKEND_URL=http://localhost:8000
PORT=3000
```

## 🚀 Final URLs

After deployment, your game will be available at:
- **Main Game**: `https://khasinogaming.com/cassino/`
- **Backend API**: `https://khasinogaming.com/api/`
- **Health Check**: `https://khasinogaming.com/api/health`

## 🔍 Troubleshooting

### Check Services:
```bash
# Backend
sudo systemctl status cassino-backend
sudo journalctl -u cassino-backend -f

# Frontend
sudo systemctl status cassino-frontend
sudo journalctl -u cassino-frontend -f

# Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Test Endpoints:
```bash
# Health check
curl https://khasinogaming.com/api/health

# Frontend
curl https://khasinogaming.com/
```

## 📝 Maintenance

### Update Application:
```bash
cd /path/to/cassino-card-game
git pull origin master
sudo systemctl restart cassino-backend cassino-frontend
```

### Database Backup:
```bash
pg_dump casino_game > backup_$(date +%Y%m%d_%H%M%S).sql
```

## ✅ Success!

Your Casino Card Game is now live at **https://khasinogaming.com/cassino/**! 🎉

Players can:
- Create rooms
- Join games
- Play the complete Casino card game
- Enjoy real-time multiplayer action
