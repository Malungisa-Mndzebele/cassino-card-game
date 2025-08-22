# PostgreSQL Setup Guide

This guide explains how to set up PostgreSQL for the Casino Card Game backend.

## Overview

The application has been configured to use PostgreSQL in production while maintaining SQLite for local development.

## Database Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database_name`
  - Example: `postgresql://myuser:mypassword@localhost:5432/casino_game`

### Local Development

For local development, you can continue using SQLite:
```bash
export DATABASE_URL="sqlite:///./test_casino_game.db"
```

### Production (Render.com)

The `render.yaml` file is configured to:
1. Create a PostgreSQL service named `casino-postgres`
2. Automatically connect the web service to the database
3. Use the database connection string from the PostgreSQL service

## Database Migrations

The project uses Alembic for database migrations.

### Running Migrations

```bash
# Navigate to backend directory
cd backend

# Run all pending migrations
alembic upgrade head

# Create a new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Check current migration status
alembic current

# Check migration history
alembic history
```

### Migration Files

- `alembic.ini`: Alembic configuration
- `alembic/env.py`: Migration environment setup
- `alembic/versions/`: Migration files

## Database Schema

The database includes three main tables:

### Rooms Table
- Stores game room information
- Contains game state (deck, hands, table cards, etc.)
- Tracks game progress and player status

### Players Table
- Stores player information
- Links players to rooms
- Tracks player readiness

### Game Sessions Table
- Tracks active game sessions
- Manages WebSocket connections
- Stores connection timestamps

## Deployment

### Render.com Deployment

1. Push your code to GitHub
2. Connect your repository to Render.com
3. The `render.yaml` file will automatically:
   - Create a PostgreSQL database
   - Deploy the web service
   - Run database migrations on startup

### Manual Deployment

1. Set up a PostgreSQL database
2. Set the `DATABASE_URL` environment variable
3. Run migrations: `alembic upgrade head`
4. Start the application: `python startup.py`

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify your `DATABASE_URL` is correct
2. **Migration Errors**: Check that all migration files are present
3. **Permission Errors**: Ensure the database user has proper permissions

### Logs

Check application logs for database-related errors:
```bash
# View migration logs
alembic upgrade head --verbose

# View application logs
tail -f logs/app.log
```

## Backup and Restore

### Backup
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

## Performance Considerations

- PostgreSQL provides better performance for concurrent users
- Consider connection pooling for high-traffic applications
- Monitor database performance with tools like pg_stat_statements
