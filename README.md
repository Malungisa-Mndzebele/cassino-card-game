# 🎮 Casino Card Game - Multiplayer Online

A real-time multiplayer implementation of the classic Casino card game. Play head-to-head matches with friends, capture cards, build combinations, and compete for the highest score!

**Live Demo:** https://khasinogaming.com/cassino/

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/Malungisa-Mndzebele/cassino-card-game)
[![Backend](https://img.shields.io/badge/backend-fly.io-blueviolet)](https://cassino-game-backend.fly.dev)
[![Frontend](https://img.shields.io/badge/frontend-live-success)](https://khasinogaming.com/cassino/)

---

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
```bash
npm run install:all
```

2. **Start Backend**
```bash
npm run start:backend
# Backend runs on http://localhost:8000
```

3. **Start Frontend** (in a new terminal)
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

4. **Play the Game**
- Open http://localhost:5173
- Create a room or join with a friend
- Enjoy!

---

## 🎯 Game Rules

### Objective
Score the most points by capturing cards from the table. First player to 11 points wins!

### Scoring System
- **Aces**: 1 point each (4 total)
- **2 of Spades**: 1 point (Big Casino)
- **10 of Diamonds**: 2 points (Little Casino)
- **Most Cards**: 2 points (27+ cards)
- **Most Spades**: 2 points (7+ spades)

**Maximum possible score per round:** 11 points

### Game Actions

#### 1. Capture 🎯
- Take cards from the table that match your hand card
- Combine multiple cards that sum to your hand card value
- Example: Play 8 to capture 8, or 3+5, or 2+2+4

#### 2. Build 🏗️
- Create combinations for future capture
- Must announce the build value
- Must have a matching card in hand
- Example: Play 3 on 5, announce "building 8"

#### 3. Trail 🚶
- Place a card on the table when no capture/build is possible
- Strategic move to set up future plays

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **TailwindCSS** for styling
- **Lucide React** for icons
- **WebSocket** for real-time updates

### Backend
- **FastAPI** (Python 3.11+)
- **SQLAlchemy** ORM
- **SQLite** (dev) / **PostgreSQL** (production)
- **WebSocket** for real-time communication
- **Alembic** for database migrations

### Testing
- **Vitest** for unit tests
- **Playwright** for E2E tests
- **Pytest** for backend tests
- **97.2% test coverage** (70/72 tests passing)

### Deployment
- **Backend**: Fly.io
- **Frontend**: khasinogaming.com (FTP)
- **CI/CD**: GitHub Actions

---

## 📁 Project Structure

```
cassino-card-game/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Main API server
│   ├── models.py              # Database models
│   ├── game_logic.py          # Game rules engine
│   ├── requirements.txt       # Python dependencies
│   └── test_*.py              # Backend tests
├── components/                 # React components
│   ├── CasinoRoomView.tsx    # Main game view
│   ├── PokerTableView.tsx    # Game table
│   ├── GamePhases.tsx        # Game phase management
│   └── ui/                    # Reusable UI components
├── hooks/                      # Custom React hooks
│   ├── useGameState.ts       # Game state management
│   ├── useWebSocket.ts       # WebSocket connection
│   ├── useGameActions.ts     # Game action handlers
│   ├── useRoomActions.ts     # Room management
│   └── useConnectionState.ts # Connection status
├── tests/                      # Test suites
│   ├── frontend/              # Component tests (Vitest)
│   ├── e2e/                   # End-to-end tests (Playwright)
│   ├── integration/           # Integration tests
│   └── performance/           # Performance tests
├── .github/workflows/          # CI/CD pipelines
│   ├── ci.yml                 # Test automation
│   ├── deploy-backend.yml     # Backend deployment
│   └── deploy-frontend.yml    # Frontend deployment
├── vite.config.ts             # Vite configuration
├── playwright.config.ts       # E2E test config
└── run-all-tests.js           # Comprehensive test runner
```

---

## 🧪 Testing

### Run All Tests
```bash
node run-all-tests.js
```

### Frontend Tests
```bash
# Unit tests (Vitest)
npm run test:frontend

# E2E tests (Playwright)
npm run test:e2e

# Specific E2E tests
npm run test:e2e:create-join
npm run test:e2e:random-join
npm run test:e2e:full-game
```

### Backend Tests
```bash
cd backend
python test_api_comprehensive.py
python run_simple_tests.py
```

### Production Tests
```bash
# Test live deployment
npx playwright test tests/e2e/production-smoke-test.spec.ts --config=playwright.production.config.ts
```

### Test Coverage
- **Frontend**: 94/94 tests passing (100%)
- **Backend**: 41/41 tests passing (100%)
- **Integration**: 13/13 tests passing (100%)
- **E2E**: 12/13 tests passing (92.3%)
- **Performance**: 5/5 tests passing (100%)
- **Overall**: 70/72 tests passing (97.2%)

---

## 🚢 Deployment

### Production URLs
- **Frontend**: https://khasinogaming.com/cassino/
- **Backend API**: https://cassino-game-backend.fly.dev
- **Health Check**: https://cassino-game-backend.fly.dev/health

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Fly.io CLI (for backend)
- FTP credentials (for frontend)

---

### Backend Deployment (Fly.io)

#### Initial Setup
```bash
# Install Fly.io CLI
# Windows: iwr https://fly.io/install.ps1 -useb | iex
# Mac/Linux: curl -L https://fly.io/install.sh | sh

# Login to Fly.io
flyctl auth login

# Create app (first time only)
flyctl launch
```

#### Deploy Backend
```bash
# Deploy to Fly.io
flyctl deploy

# Run database migrations
flyctl ssh console -C "cd /app && python -m alembic upgrade head"

# Check deployment status
flyctl status

# View logs
flyctl logs

# Check health
curl https://cassino-game-backend.fly.dev/health
```

#### Backend Environment Variables
Set in Fly.io dashboard or via CLI:
```bash
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set CORS_ORIGINS="https://khasinogaming.com"
```

---

### Frontend Deployment (FTP)

#### Setup FTP Credentials
Create `.env` file in project root:
```bash
# FTP Configuration
FTP_HOST=your-ftp-host.com
FTP_USER=your-username
FTP_PASSWORD=your-password
FTP_PORT=21
FTP_SECURE=false
```

#### Deploy Frontend
```bash
# 1. Build production bundle
npm run build

# 2. Deploy via FTP (automated)
npm run deploy:ftp

# 3. Verify deployment
npm run test:production
```

#### Manual FTP Deployment
If automated deployment fails:
1. Build: `npm run build`
2. Upload contents of `dist/` folder to `/public_html/cassino/` on your FTP server
3. Ensure `index.html` is in the cassino directory
4. Verify at https://khasinogaming.com/cassino/

#### Frontend Configuration
The app is configured for `/cassino/` base path in `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/cassino/',  // Important: matches deployment path
  // ...
})
```

---

### Deployment Verification

#### Test Production Backend
```bash
# Run production smoke tests
npm run test:production

# Test specific endpoints
curl https://cassino-game-backend.fly.dev/health
curl https://cassino-game-backend.fly.dev/
```

#### Test Production Frontend
```bash
# Run live deployment tests
npm run test:live

# Or visit directly
open https://khasinogaming.com/cassino/
```

---

### Deployment Checklist

**Before Deploying:**
- [ ] All tests passing locally (`node run-all-tests.js`)
- [ ] Code committed to repository
- [ ] Environment variables configured
- [ ] Database migrations created (if needed)

**Backend Deployment:**
- [ ] `flyctl deploy` successful
- [ ] Migrations run: `flyctl ssh console -C "cd /app && python -m alembic upgrade head"`
- [ ] Health check passes: `curl https://cassino-game-backend.fly.dev/health`
- [ ] Logs show no errors: `flyctl logs`

**Frontend Deployment:**
- [ ] Build successful: `npm run build`
- [ ] FTP credentials in `.env`
- [ ] Deploy successful: `npm run deploy:ftp`
- [ ] Site loads: https://khasinogaming.com/cassino/
- [ ] Production tests pass: `npm run test:live`

---

### Rollback Procedure

#### Backend Rollback
```bash
# List recent deployments
flyctl releases

# Rollback to previous version
flyctl releases rollback <version>
```

#### Frontend Rollback
```bash
# Checkout previous version
git checkout <previous-commit>

# Rebuild and redeploy
npm run build
npm run deploy:ftp
```

---

### Monitoring

#### Backend Monitoring
```bash
# View real-time logs
flyctl logs

# Check metrics
flyctl dashboard

# SSH into container
flyctl ssh console
```

#### Frontend Monitoring
- Check browser console for errors
- Run production tests: `npm run test:production`
- Monitor via hosting provider dashboard

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`backend/.env`)
```bash
# Database
DATABASE_URL=sqlite:///./test_casino_game.db  # Dev
# DATABASE_URL=postgresql://...               # Production

# Server
HOST=0.0.0.0
PORT=8000

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:5173,https://khasinogaming.com
```

#### Frontend (`.env`)
```bash
# API URLs (auto-configured in production build)
VITE_API_URL=http://localhost:8000                    # Dev
# VITE_API_URL=https://cassino-game-backend.fly.dev  # Production

VITE_WS_URL=ws://localhost:8000                       # Dev
# VITE_WS_URL=wss://cassino-game-backend.fly.dev     # Production
```

### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  base: '/cassino/',  // Base path for production
  // ... other config
})
```

---

## 🔌 API Reference

### REST Endpoints

#### Health Check
```
GET /health
Response: { "status": "healthy", "database": "connected" }
```

#### Room Management
```
POST /rooms/create
Body: { "player_name": "string", "max_players": 2 }

POST /rooms/join
Body: { "room_code": "string", "player_name": "string" }

POST /rooms/join-random
Body: { "player_name": "string" }

GET /rooms/{room_id}/state
Response: Current game state
```

#### Game Actions
```
POST /rooms/player-ready
Body: { "room_id": "string", "player_id": "string" }

POST /game/start-shuffle
POST /game/select-face-up-cards
POST /game/play-card
POST /game/reset
```

### WebSocket
```
WS /ws/{room_id}

Events:
- game_state_update
- player_joined
- player_ready
- game_started
- card_played
- round_ended
```

---

## 🏗️ Architecture

### Frontend Architecture
```
App.tsx
  ├── Custom Hooks (State Management)
  │   ├── useGameState
  │   ├── useConnectionState
  │   ├── useWebSocket
  │   ├── useGameActions
  │   └── useRoomActions
  │
  ├── Views
  │   ├── RoomManager (Lobby)
  │   ├── CasinoRoomView (Waiting Room)
  │   └── PokerTableView (Game Table)
  │
  └── Components
      ├── GamePhases
      ├── Card
      ├── AppHeader
      └── UI Components
```

### Backend Architecture
```
FastAPI Server
  ├── REST API (main.py)
  ├── WebSocket Manager
  ├── Game Logic Engine (game_logic.py)
  ├── Database Models (models.py)
  └── SQLAlchemy ORM
```

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
cd backend
pip install -r requirements.txt
```

#### Frontend build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### WebSocket connection fails
- Check backend is running on port 8000
- Verify CORS settings in backend
- Check browser console for errors

#### Tests failing
```bash
# Install Playwright browsers
npx playwright install chromium

# Run tests with debug
npm run test:e2e:debug
```

---

## 📚 Documentation

- **[Deployment Fix Summary](DEPLOYMENT_FIX_SUMMARY.md)** - Path configuration guide
- **[Production Test Results](PRODUCTION_TEST_RESULTS_FIXED.md)** - Test coverage report
- **[Deployment Status](DEPLOYMENT_STATUS.md)** - Current deployment info
- **[GitHub Secrets Setup](.github/GITHUB_SECRETS_SETUP.md)** - CI/CD configuration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`node run-all-tests.js`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript/Python best practices
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📊 Project Stats

- **Lines of Code**: ~15,000+
- **Test Coverage**: 97.2%
- **Components**: 25+
- **API Endpoints**: 10+
- **Custom Hooks**: 5
- **Deployment**: Automated CI/CD

---

## 📝 License

MIT License - feel free to use and modify!

---

## 🙏 Acknowledgments

- Classic Casino card game rules
- FastAPI framework
- React and Vite communities
- Fly.io for backend hosting

---

## 📞 Support

- **Live Site**: https://khasinogaming.com/cassino/
- **Backend API**: https://cassino-game-backend.fly.dev
- **Issues**: [GitHub Issues](https://github.com/Malungisa-Mndzebele/cassino-card-game/issues)

---

**Built with ❤️ for card game enthusiasts**
