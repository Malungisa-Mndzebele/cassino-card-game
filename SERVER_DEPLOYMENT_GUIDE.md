# Server Deployment Guide for khasinogaming.com

## 🎯 Goal
Deploy the Casino Card Game backend to your server at `khasinogaming.com:8000` so the production frontend can connect to it.

## 📋 Prerequisites
- SSH access to your server (khasinogaming.com)
- Root or sudo access on the server
- Git installed on the server

## 🚀 Step-by-Step Deployment

### Step 1: Connect to Your Server
```bash
ssh cassino@khasinogaming.com
```

### Step 2: Install Docker and Docker Compose
```bash
# Update package list
sudo apt update

# Install Docker
sudo apt install -y docker.io docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, for non-root access)
sudo usermod -aG docker $USER
```

### Step 3: Clone Your Repository
```bash
# Navigate to a suitable directory
cd /opt
# or
cd /home/your-username

# Clone your repository
git clone https://github.com/Malungisa-Mndzebele/casino-card-game.git
cd casino-card-game
```

### Step 4: Configure Environment Variables
```bash
# Create production environment file
cat > .env.prod << EOF
# Production Environment Variables
POSTGRES_PASSWORD=casino_secure_password_2025
DATABASE_URL=postgresql://casino_user:casino_secure_password_2025@postgres:5432/casino_game
CORS_ORIGINS=https://khasinogaming.com,https://www.khasinogaming.com
PORT=8000
HOST=0.0.0.0
EOF
```

### Step 5: Deploy Using Docker
```bash
# Make deployment script executable
chmod +x deploy-prod.sh

# Deploy the application
./deploy-prod.sh
```

### Step 6: Verify Deployment
```bash
# Check if containers are running
docker ps

# Test the health endpoint
curl http://localhost:8000/health

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 7: Configure Firewall (if needed)
```bash
# Allow port 8000 through firewall
sudo ufw allow 8000

# Check firewall status
sudo ufw status
```

### Step 8: Test from Production Frontend
Once deployed, your frontend at `https://khasinogaming.com/cassino/` should be able to connect to the backend at `https://khasinogaming.com:8000`.

## 🔧 Management Commands

### View Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Update and Redeploy
```bash
# Pull latest changes
git pull origin master

# Redeploy
./deploy-prod.sh
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check if port 8000 is listening
netstat -tlnp | grep 8000

# Check if Docker containers are running
docker ps

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

### Database Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker exec -it casino-postgres-prod psql -U casino_user -d casino_game
```

### Backend Issues
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

## 📊 Monitoring

### Health Check
```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","message":"Casino Card Game Backend is running"}
```

### Resource Usage
```bash
# Check container resource usage
docker stats

# Check disk usage
df -h
```

## 🔒 Security Considerations

1. **Change Default Passwords**: Update the PostgreSQL password in `.env.prod`
2. **Firewall Configuration**: Ensure only necessary ports are open
3. **SSL/TLS**: Consider setting up HTTPS for the backend
4. **Regular Updates**: Keep Docker and system packages updated

## ✅ Success Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned successfully
- [ ] Environment variables configured
- [ ] Deployment script executed without errors
- [ ] Containers running and healthy
- [ ] Health endpoint responding
- [ ] Port 8000 accessible
- [ ] Frontend can connect to backend
- [ ] Game functionality working

## 🎮 Testing the Deployment

1. **Health Check**: `curl http://khasinogaming.com:8000/health`
2. **Frontend Connection**: Visit `https://khasinogaming.com/cassino/`
3. **Create Room**: Try creating a new game room
4. **Join Room**: Test joining with a second browser/device

Once completed, your Casino Card Game will be fully self-hosted and operational! 🎯
