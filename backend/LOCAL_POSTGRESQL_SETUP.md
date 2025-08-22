# Local PostgreSQL Setup Guide

This guide explains how to set up PostgreSQL locally for development using Docker.

## Prerequisites

1. **Docker Desktop** installed and running
2. **Python 3.11+** installed
3. **Git** for version control

## Quick Start

### 1. Start Local PostgreSQL Environment

**On Windows:**
```bash
cd backend
start_local.bat
```

**On macOS/Linux:**
```bash
cd backend
chmod +x start_local.sh
./start_local.sh
```

### 2. Start the Application

```bash
cd backend
python startup.py
```

## Manual Setup

If you prefer to set up PostgreSQL manually:

### 1. Install PostgreSQL Locally

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE casino_game;
CREATE USER casino_user WITH PASSWORD 'casino_password';
GRANT ALL PRIVILEGES ON DATABASE casino_game TO casino_user;
\q
```

### 3. Configure Environment

Create a `.env` file in the `backend` directory:

```bash
# Copy the example file
cp env.example .env
```

Edit `.env` to use your local PostgreSQL:

```env
DATABASE_URL=postgresql://casino_user:casino_password@localhost:5432/casino_game
```

### 4. Run Migrations

```bash
cd backend
alembic upgrade head
```

### 5. Start Application

```bash
python startup.py
```

## Docker Setup (Recommended)

### 1. Start PostgreSQL Container

```bash
cd backend
docker-compose up -d postgres
```

### 2. Verify Database is Running

```bash
docker-compose ps
```

### 3. Connect to Database

```bash
docker-compose exec postgres psql -U casino_user -d casino_game
```

### 4. Start pgAdmin (Optional)

```bash
docker-compose up -d pgadmin
```

Access pgAdmin at: http://localhost:8080
- Email: admin@casino.com
- Password: admin123

## Database Management

### View Database Logs

```bash
docker-compose logs postgres
```

### Reset Database

```bash
# Stop containers
docker-compose down

# Remove volumes (this will delete all data)
docker-compose down -v

# Start fresh
docker-compose up -d postgres
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U casino_user casino_game > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U casino_user casino_game < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port 5432 already in use**
   ```bash
   # Check what's using the port
   netstat -an | grep 5432
   
   # Stop existing PostgreSQL service
   sudo systemctl stop postgresql
   ```

2. **Docker permission issues**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Database connection refused**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # Check logs
   docker-compose logs postgres
   ```

4. **Migration errors**
   ```bash
   # Check current migration status
   alembic current
   
   # Reset migrations (WARNING: This will delete data)
   alembic downgrade base
   alembic upgrade head
   ```

### Environment Variables

Key environment variables in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Application port (default: 8000)
- `HOST`: Application host (default: 0.0.0.0)
- `CORS_ORIGINS`: Allowed CORS origins
- `LOG_LEVEL`: Logging level

### Useful Commands

```bash
# Check database status
docker-compose exec postgres pg_isready -U casino_user -d casino_game

# View database tables
docker-compose exec postgres psql -U casino_user -d casino_game -c "\dt"

# View table structure
docker-compose exec postgres psql -U casino_user -d casino_game -c "\d rooms"

# Run SQL query
docker-compose exec postgres psql -U casino_user -d casino_game -c "SELECT * FROM rooms;"
```

## Development Workflow

1. **Start environment**: `./start_local.sh` (or `start_local.bat`)
2. **Make code changes**
3. **Create migration** (if model changes): `alembic revision --autogenerate -m "Description"`
4. **Apply migration**: `alembic upgrade head`
5. **Start application**: `python startup.py`
6. **Test changes**
7. **Stop environment**: `docker-compose down`

## Performance Tips

- Use connection pooling for high-traffic development
- Monitor query performance with `EXPLAIN ANALYZE`
- Use indexes for frequently queried columns
- Consider using `pg_stat_statements` for query analysis
