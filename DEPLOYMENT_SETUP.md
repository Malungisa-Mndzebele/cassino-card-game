# 🚀 Auto-Deployment Setup for khasinogaming.com

This guide will help you set up automatic deployment from GitHub Actions to your khasinogaming.com server.

## 📋 Prerequisites

- **Server Access**: SSH access to your khasinogaming.com server
- **GitHub Repository**: Your code is in the GitHub repository
- **Server Requirements**: Node.js 18+, Python 3.11+, PostgreSQL

## 🔧 Step 1: Generate SSH Key (if needed)

If you don't have an SSH key for your server:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "deploy@khasinogaming.com"
# Save it as ~/.ssh/khasinogaming_deploy

# Copy public key to your server
ssh-copy-id -i ~/.ssh/khasinogaming_deploy.pub username@khasinogaming.com
```

## 🔑 Step 2: Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

### Required Secrets:
- **`HOST`**: `khasinogaming.com`
- **`USERNAME`**: `cassino`
- **`SSH_KEY`**: Your private SSH key content (the entire content of `~/.ssh/khasinogaming_deploy`)
- **`PORT`**: SSH port (usually `22`)

### How to get SSH Key content:
```bash
# On your local machine
cat ~/.ssh/khasinogaming_deploy
# Copy the entire output (including -----BEGIN and -----END lines)
```

## 🖥️ Step 3: Server Preparation

SSH into your server and prepare it:

```bash
# Connect to your server
ssh cassino@khasinogaming.com

# Install required software
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip postgresql git curl

# Navigate to project directory
cd /home/mawdqtvped/khasinogaming.com/cassino

# Clone the repository (if not already cloned)
git clone https://github.com/Malungisa-Mndzebele/cassino-card-game.git . || git pull origin master

# Install dependencies
npm run install:all

# Set up PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE casino_game;"
sudo -u postgres psql -c "CREATE USER casino_user WITH PASSWORD 'casino_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE casino_game TO casino_user;"

# Run database migrations
cd backend
python3 -m alembic upgrade head
cd ..
```

## ⚙️ Step 4: Update Deployment Path

Edit the GitHub Actions workflow file `.github/workflows/ci.yml` and update the deployment path:

```yaml
# The path is already updated to:
cd /home/mawdqtvped/khasinogaming.com/cassino || {
```

## 🌐 Step 5: Configure Nginx (Optional)

If you want to use a custom domain, set up Nginx:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cassino
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name khasinogaming.com www.khasinogaming.com;

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

## 🔒 Step 6: Set Up SSL (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d khasinogaming.com -d www.khasinogaming.com
```

## ✅ Step 7: Test Deployment

1. **Push a change** to your repository
2. **Check GitHub Actions** - Go to Actions tab in your repository
3. **Watch the deployment** - The workflow should automatically deploy
4. **Visit your site** - https://khasinogaming.com/cassino/

## 🔍 Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Check HOST, USERNAME, PORT secrets
   - Verify SSH key is correct
   - Test SSH connection manually

2. **Permission Denied**
   - Make sure the user has write access to the project directory
   - Check file permissions

3. **Services Not Starting**
   - Check logs: `tail -f backend.log` and `tail -f frontend.log`
   - Verify all dependencies are installed

4. **Database Connection Issues**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify database credentials

### Manual Deployment (if auto-deployment fails):

```bash
# SSH into your server
ssh cassino@khasinogaming.com

# Navigate to project
cd /home/mawdqtvped/khasinogaming.com/cassino

# Pull latest changes
git pull origin master

# Install dependencies
npm run install:all

# Restart services
pkill -f "node frontend/production-server.js"
pkill -f "python.*start_production.py"

# Start services
cd backend && nohup python3 start_production.py > backend.log 2>&1 &
cd .. && nohup node frontend/production-server.js > frontend.log 2>&1 &
```

## 🎉 Success!

Once set up, every time you push code to the `master` branch, GitHub Actions will:

1. ✅ Run tests
2. ✅ Build the project
3. ✅ Deploy to khasinogaming.com
4. ✅ Restart services
5. ✅ Verify deployment

Your Casino Card Game will be automatically updated at **https://khasinogaming.com/cassino/**! 🎮
