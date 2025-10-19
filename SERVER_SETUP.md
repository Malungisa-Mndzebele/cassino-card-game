# 🚀 Quick Server Setup for khasinogaming.com

## 📋 Your Server Details:
- **Host**: khasinogaming.com
- **Username**: cassino
- **Path**: /home/mawdqtvped/khasinogaming.com/cassino
- **Password**: [YOUR_FTP_PASSWORD]

## 🔧 Step 1: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
- **`HOST`**: `khasinogaming.com`
- **`USERNAME`**: `cassino`
- **`SSH_KEY`**: Your private SSH key content
- **`PORT`**: `22`

## 🔑 Step 2: Generate SSH Key (if needed)

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "[YOUR_EMAIL]"
# Save it as ~/.ssh/khasinogaming_deploy

# Copy public key to your server
ssh-copy-id -i ~/.ssh/khasinogaming_deploy.pub [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]
```

## 🖥️ Step 3: Prepare Your Server

SSH into your server:

```bash
ssh [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]
# Password: [YOUR_FTP_PASSWORD]
```

Once connected, run these commands:

```bash
# Navigate to your project directory
cd /home/mawdqtvped/khasinogaming.com/cassino

# Install required software
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip postgresql git curl

# Clone the repository
git clone https://github.com/Malungisa-Mndzebele/cassino-card-game.git .

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

# Test the setup
npm start
```

## ✅ Step 4: Test Auto-Deployment

1. **Push a change** to your repository
2. **Check GitHub Actions** - Go to Actions tab
3. **Watch the deployment** - Should automatically deploy to your server
4. **Visit your site** - https://khasinogaming.com/cassino/

## 🔍 Troubleshooting

### If SSH connection fails:
```bash
# Test SSH connection
ssh [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]

# Check if SSH key is working
ssh -i ~/.ssh/khasinogaming_deploy [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]
```

### If deployment fails:
```bash
# SSH into your server
ssh [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]

# Check the project directory
cd /home/mawdqtvped/khasinogaming.com/cassino
ls -la

# Pull latest changes manually
git pull origin master

# Restart services
pkill -f "node frontend/production-server.js"
pkill -f "python.*start_production.py"

# Start services
cd backend && nohup python3 start_production.py > backend.log 2>&1 &
cd .. && nohup node frontend/production-server.js > frontend.log 2>&1 &
```

## 🎉 Success!

Once set up, every push to `master` will automatically:
1. ✅ Run tests
2. ✅ Build the project  
3. ✅ Deploy to khasinogaming.com
4. ✅ Restart services
5. ✅ Update https://khasinogaming.com/cassino/

Your Casino Card Game will be live and automatically updated! 🎮
