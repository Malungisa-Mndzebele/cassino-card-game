# Technology Stack

## Frontend

- **SvelteKit** - Full-stack framework
- **Svelte 5** - Component framework with runes for reactivity
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Lucide Svelte** - Icon library
- **WebSocket API** - Real-time communication
- **Svelte Stores** - State management pattern (using runes)

## Backend

- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** (development) / **PostgreSQL** (production)
- **Redis** - Session storage and caching
- **Alembic** - Database migrations
- **WebSocket** - Real-time bidirectional communication
- **Pydantic** - Data validation and schemas

## Backend Services

- **SessionManager** - Redis-based session lifecycle management
- **StateRecoveryService** - Game state recovery for reconnections
- **ActionLogger** - Complete audit trail of game actions
- **CacheManager** - Redis caching for performance optimization
- **BackgroundTaskManager** - Automated cleanup and monitoring
- **WebSocketManager** - Real-time connection handling

## Testing

- **Vitest** - Frontend unit/component tests
- **Svelte Testing Library** - Svelte component testing utilities
- **Playwright** - E2E and integration tests
- **Pytest** - Backend tests

## Deployment

- **Backend**: Fly.io with PostgreSQL and Redis managed instances
- **Frontend**: FTP deployment to khasinogaming.com
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Base Path**: Frontend deployed at `/cassino/` subdirectory

## Common Commands

### Development
```bash
# Install all dependencies
npm run install:all

# Start backend (port 8000)
npm run start:backend

# Start frontend dev server (port 5173)
npm run dev

# Type checking
npm run type-check
```

### Testing
```bash
# Run all tests
npm run test:all

# Frontend unit tests
npm run test:frontend

# E2E tests
npm run test:e2e

# Backend tests
cd backend && python test_api_comprehensive.py

# Production smoke tests
npm run test:production
```

### Building
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Backend Operations
```bash
# Run database migrations
cd backend && alembic upgrade head

# Create new migration
cd backend && alembic revision --autogenerate -m "description"

# Start backend (production mode)
cd backend && python start_production.py
```

### Deployment
```bash
# Deploy backend to Fly.io
flyctl deploy

# Deploy frontend via FTP
npm run deploy:ftp

# Check deployment security
npm run deploy:check
```

## Environment Configuration

### Frontend (.env)
- `VITE_API_URL` - Backend API endpoint
- `VITE_WS_URL` - WebSocket endpoint

### Backend (backend/.env)
- `DATABASE_URL` - Database connection string (PostgreSQL in production)
- `REDIS_URL` - Redis connection string (default: redis://localhost:6379)
- `CORS_ORIGINS` - Allowed CORS origins
- `HOST` / `PORT` - Server configuration

## Key Dependencies

- Node.js >= 18.0.0
- Python >= 3.11
- npm >= 8.0.0
- Redis >= 6.0 (for session management and caching)

## Important Notes

### Property Naming Convention
- **Backend**: Uses snake_case (e.g., `player1_hand`, `table_cards`)
- **Frontend**: Uses camelCase (e.g., `player1Hand`, `tableCards`)
- **Transformation**: Happens at API boundary in hooks

### Redis Usage
- Session tokens stored with 30-minute TTL (sliding window)
- Game state cached with 5-minute TTL
- Player data cached with 30-minute TTL
- Automatic fallback to database if Redis unavailable

### Background Tasks
- Heartbeat monitor: Runs every 30 seconds
- Session cleanup: Runs every 5 minutes
- Abandoned game checker: Runs every 10 minutes
