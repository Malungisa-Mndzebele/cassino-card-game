# Technology Stack

## Frontend

- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **WebSocket API** - Real-time communication
- **Custom Hooks** - State management pattern (no Redux/Zustand)

## Backend

- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** (development) / **PostgreSQL** (production)
- **Alembic** - Database migrations
- **WebSocket** - Real-time bidirectional communication
- **Pydantic** - Data validation and schemas

## Testing

- **Vitest** - Frontend unit/component tests
- **Playwright** - E2E and integration tests
- **Pytest** - Backend tests
- **Testing Library** - React component testing utilities

## Deployment

- **Backend**: Fly.io (PostgreSQL managed database)
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
- `DATABASE_URL` - Database connection string
- `CORS_ORIGINS` - Allowed CORS origins
- `HOST` / `PORT` - Server configuration

## Key Dependencies

- Node.js >= 18.0.0
- Python >= 3.11
- npm >= 8.0.0
