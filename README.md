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
- SQLite (default) or MySQL

### Environment Setup
```bash
# Backend (.env)
# Default uses SQLite at ./test_casino_game.db
# For MySQL in prod/staging, set DATABASE_URL like below
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/casino_game
PORT=8000
HOST=0.0.0.0

# Frontend (.env) - optional in dev
VITE_API_URL=http://localhost:8000
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

### Production Setup (Shared Hosting)
1. Clone repository
2. Install dependencies: `npm run install:all`
3. Configure backend `.env` on server (not committed):
```
DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/<db>   # URL-encode special chars
CORS_ORIGINS=https://khasinogaming.com
HOST=0.0.0.0
PORT=8000
```
4. Start services:
```bash
npm run start:backend  # Start backend
npm start              # Start frontend
```

### CI/CD (GitHub Actions)
- On push to master/main:
  - Runs backend tests (SQLite)
  - Runs frontend unit (Vitest) and E2E (Playwright)
  - Builds frontend with Vite (base=/cassino/)
  - Deploys built `dist/` + `backend/` via FTP
  - Uses repo `.htaccess` for SPA + API proxy

### PHP Proxy
- `backend/start.php` forwards `/cassino/{health|rooms|game|api/*}` to FastAPI at `http://localhost:8000`
- `.htaccess` rewrites API routes to the proxy; SPA routes fall back to `index.html`

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