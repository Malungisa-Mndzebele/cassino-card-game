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

### Quick Start (Recommended)

**For Windows:**
```bash
cd backend
install_dependencies.bat
python start_production.py
```

**For macOS/Linux:**
```bash
cd backend
chmod +x install_dependencies.sh
./install_dependencies.sh
python start_production.py
```

### Manual Setup

#### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 2. Database Setup

**Option A: Local PostgreSQL Installation (Recommended)**
1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE casino_game;
   CREATE USER casino_user WITH PASSWORD 'casino_password';
   GRANT ALL PRIVILEGES ON DATABASE casino_game TO casino_user;
   ```

**Option B: SQLite (Simple)**
```bash
# Use SQLite for development (no setup required)
# The app will automatically create test_casino_game.db
```

#### 3. Configure Environment Variables

The setup scripts will automatically create a `.env` file. You can also create it manually:

```bash
cp env.example .env
```

Edit `.env` to configure your database:

```env
# For PostgreSQL
DATABASE_URL=postgresql://casino_user:casino_password@localhost:5432/casino_game

# For SQLite
# DATABASE_URL=sqlite:///./test_casino_game.db
```

#### 4. Run the Backend

```bash
# Using production script (recommended)
python start_production.py

# Or directly with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
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

### Native Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
```sql
CREATE DATABASE casino_game;
CREATE USER casino_user WITH PASSWORD 'casino_password';
GRANT ALL PRIVILEGES ON DATABASE casino_game TO casino_user;
```

3. Run database migrations:
```bash
python -m alembic upgrade head
```

4. Start the production server:
```bash
python start_production.py
```

For complete deployment instructions, see the main `DEPLOYMENT_GUIDE.md` file.



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


