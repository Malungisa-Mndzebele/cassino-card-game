# Multiplayer Casino Card Game

A real-time multiplayer implementation of the classic Casino card game. Play head-to-head matches with friends, capture cards, build combinations, and compete for the highest score!

## 🎮 Quick Start

1. **Install Dependencies**
```bash
npm run install:all
```

2. **Start the Game (Dev)**
```bash
# Start backend
npm run start:backend

# Start frontend (in a new terminal)
npm start
```

3. **Play the Game**
- Open http://localhost:3000/cassino/
- Create a room or join with a friend
- Have fun!

## 🎯 Game Rules

### Objective
Score the most points by capturing cards from the table. First player to 11 points wins!

### Scoring
- Aces: 1 point each
- 2 of Spades: 1 point
- 10 of Diamonds: 2 points
- Most Cards: 2 points
- Most Spades: 2 points

### Actions
1. **Capture**
   - Take cards that match your hand card
   - Combine multiple cards that sum to your hand card

2. **Build**
   - Create combinations that can be captured later
   - Must have a matching card in hand to build

3. **Trail**
   - Place a card on the table when no moves are possible

## 🛠️ Development

### Requirements
- Python 3.11+
- Node.js 18+
- SQLite (local dev) or PostgreSQL (production on Fly.io)

### Environment Setup
```bash
# Backend (.env)
# Local development uses SQLite
DATABASE_URL=sqlite:///./test_casino_game.db
PORT=8000
HOST=0.0.0.0

# Frontend (.env) - optional in dev
VITE_API_URL=http://localhost:8000
# Production: https://cassino-game-backend.fly.dev
```

### Testing
```bash
# Backend
python backend/run_all_tests.py

# Frontend unit (Vitest)
npm run test:frontend

# Frontend E2E (Playwright)
npm run build && npm run test:e2e
```

## 📦 Deployment

### Automated CI/CD

The project uses GitHub Actions for automated deployment:

- **Backend**: Automatically deploys to Fly.io on push to `main`/`master`
- **Frontend**: Automatically deploys to `https://khasinogaming.com/cassino/` on push to `main`/`master`

See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) for setup instructions.

### Backend Deployment (Fly.io)

The backend is deployed on Fly.io. See [FLYIO_SETUP.md](FLYIO_SETUP.md) for complete deployment instructions.

**Backend URL:** `https://cassino-game-backend.fly.dev`

**Manual Deploy:**
```bash
flyctl deploy
flyctl ssh console -C "cd /app && python -m alembic upgrade head"
```

### Frontend Deployment (khasinogaming.com)

The frontend is automatically deployed to `https://khasinogaming.com/cassino/` via FTP when you push to `main`/`master`.

**Manual Deploy:**
```bash
npm run build
# Then upload dist/ to your FTP server at /cassino/
```

**Configuration:**
- Base path: `/cassino/` (configured in `vite.config.ts`)
- API URL: `https://cassino-game-backend.fly.dev` (set automatically in build)

### API Endpoints
- `/health` - Health check
- `/rooms/*` - Room management
- `/game/*` - Game actions
- `/ws/{room_id}` - WebSocket updates

## 📚 Documentation
- Architecture: docs/ARCHITECTURE.md
- API Reference: docs/API.md
- Local Development: docs/LOCAL_DEV.md
- Testing Guide: docs/TESTING.md

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

MIT License - feel free to use and modify!