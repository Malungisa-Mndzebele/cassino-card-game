# Casino Card Game - Docker Setup Guide

This guide explains how to run the entire Casino Card Game application using Docker containers.

## 🐳 Overview

The application is containerized with the following services:
- **Frontend**: React application
- **Backend**: FastAPI application
- **Database**: PostgreSQL
- **Database Admin**: pgAdmin
- **Reverse Proxy**: Nginx (optional)

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **Git** for version control
3. **At least 4GB RAM** available for Docker

## 🚀 Quick Start

### Production Mode
```bash
# Start the entire application
./start-app.sh

# Or on Windows
start-app.bat
```

### Development Mode (with hot reloading)
```bash
# Start in development mode
./start-app.sh dev

# Or on Windows
start-app.bat dev
```

## 📱 Application URLs

Once running, access the application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000/cassino/ | Main application |
| **Backend API** | http://localhost:8000 | API endpoints |
| **API Documentation** | http://localhost:8000/docs | Swagger UI |
| **pgAdmin** | http://localhost:8080 | Database management |
| **Nginx** | http://localhost:80 | Reverse proxy (optional) |

## 🔧 Database Information

| Setting | Value |
|---------|-------|
| **Host** | localhost |
| **Port** | 5432 |
| **Database** | casino_game |
| **Username** | casino_user |
| **Password** | casino_password |

## 🛠️ Management Commands

### Start Application
```bash
# Production mode
./start-app.sh

# Development mode (with hot reloading)
./start-app.sh dev
```

### Stop Application
```bash
# Stop all services
./stop-app.sh

# Stop development environment
./stop-app.sh dev
```

### View Logs
```bash
# View all logs
./logs.sh

# View development logs
./logs.sh dev
```

### Clean Up (Remove all data)
```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker system prune -a
```

## 🏗️ Architecture

### Production Setup
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │ PostgreSQL  │
│   (React)   │    │  (FastAPI)  │    │             │
│   Port 3000 │    │  Port 8000  │    │  Port 5432  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌─────────────┐
                    │   pgAdmin   │
                    │  Port 8080  │
                    └─────────────┘
```

### Development Setup
- **Hot Reloading**: Code changes automatically restart services
- **Volume Mounting**: Source code is mounted for live editing
- **Debug Mode**: Enhanced logging and error reporting

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -an | grep :3000
   
   # Kill the process
   lsof -ti:3000 | xargs kill
   ```

2. **Docker Not Running**
   ```bash
   # Start Docker Desktop
   # Then run the start script again
   ```

3. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # View database logs
   docker-compose logs postgres
   ```

4. **Build Failures**
   ```bash
   # Clean and rebuild
   docker-compose down
   docker system prune -f
   ./start-app.sh
   ```

### Useful Commands

```bash
# Check container status
docker-compose ps

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Access container shell
docker-compose exec backend bash
docker-compose exec postgres psql -U casino_user -d casino_game

# Restart specific service
docker-compose restart backend
```

## 🔒 Security Considerations

### Production Deployment
- Change default passwords
- Use environment variables for secrets
- Enable SSL/TLS
- Configure firewall rules
- Use Docker secrets for sensitive data

### Environment Variables
Create a `.env` file for production:
```env
POSTGRES_PASSWORD=your_secure_password
PGADMIN_PASSWORD=your_secure_password
SECRET_KEY=your_secret_key
```

## 📊 Monitoring

### Health Checks
All services include health checks:
- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:3000`
- Database: Internal PostgreSQL health check

### Logging
- Structured logging for all services
- Log aggregation available
- Error tracking and monitoring

## 🚀 Deployment

### Local Development
```bash
./start-app.sh dev
```

### Production
```bash
./start-app.sh
```

### Cloud Deployment
The Docker setup is compatible with:
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Heroku Container Registry

## 📝 Development Workflow

1. **Start Development Environment**
   ```bash
   ./start-app.sh dev
   ```

2. **Make Code Changes**
   - Frontend changes auto-reload
   - Backend changes auto-restart

3. **Test Changes**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/docs

4. **View Logs**
   ```bash
   ./logs.sh dev
   ```

5. **Stop Environment**
   ```bash
   ./stop-app.sh dev
   ```

## 🎯 Next Steps

- [ ] Add SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Implement CI/CD pipeline
- [ ] Add load balancing
- [ ] Configure caching layer
