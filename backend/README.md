# Casino Card Game Backend

A FastAPI backend for the multiplayer Casino card game with PostgreSQL database.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: Python SQL toolkit and ORM
- **WebSocket Support**: Real-time communication
- **CORS Support**: Cross-origin resource sharing
- **Pydantic**: Data validation using Python type annotations

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up PostgreSQL Database

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE casino_game;
   CREATE USER casino_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE casino_game TO casino_user;
   ```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://casino_user:your_password@localhost/casino_game

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# Security
SECRET_KEY=your-secret-key-here-change-in-production
```

### 4. Run the Backend

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 5. API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Room Management
- `POST /rooms/create` - Create a new game room
- `POST /rooms/join` - Join an existing room
- `GET /rooms/{room_id}/state` - Get current game state
- `POST /rooms/player-ready` - Set player ready status

### Game Actions
- `POST /game/start-shuffle` - Start the shuffle phase
- `POST /game/select-face-up-cards` - Select face-up cards
- `POST /game/play-card` - Play a card (capture/build/trail)
- `POST /game/reset` - Reset the game

### WebSocket
- `WS /ws/{room_id}` - Real-time game updates

## Database Schema

### Rooms Table
- `id` (String, Primary Key) - 6-character room ID
- `created_at` (DateTime) - Room creation timestamp
- `status` (String) - Room status (waiting, playing, finished)
- `game_phase` (String) - Current game phase
- `current_turn` (Integer) - Current player turn
- `round_number` (Integer) - Current round number
- Game state fields (deck, hands, scores, etc.)

### Players Table
- `id` (Integer, Primary Key) - Player ID
- `room_id` (String, Foreign Key) - Room ID
- `name` (String) - Player name
- `ready` (Boolean) - Player ready status
- `joined_at` (DateTime) - Join timestamp

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Migrations
```bash
# Install Alembic
pip install alembic

# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## Production Deployment

### Using Docker

1. Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. Build and run:
```bash
docker build -t casino-backend .
docker run -p 8000:8000 casino-backend
```

### Using Docker Compose

Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: casino_game
      POSTGRES_USER: casino_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://casino_user:your_password@db/casino_game
    ports:
      - "8000:8000"
    depends_on:
      - db

volumes:
  postgres_data:
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost/casino_game` |
| `API_HOST` | API server host | `0.0.0.0` |
| `API_PORT` | API server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | `["*"]` |
| `SECRET_KEY` | Secret key for JWT tokens | `your-secret-key` |

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL is correct
   - Ensure database and user exist

2. **CORS Errors**
   - Update CORS_ORIGINS in .env
   - Check frontend URL is included

3. **Port Already in Use**
   - Change API_PORT in .env
   - Kill existing process: `lsof -ti:8000 | xargs kill`

### Logs

Check logs for debugging:
```bash
# Development
uvicorn main:app --reload --log-level debug

# Production
uvicorn main:app --log-level info
```
