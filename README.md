# Multiplayer Casino Card Game

A real-time multiplayer implementation of the classic Casino card game. Play head-to-head matches with friends, capture cards, build combinations, and compete for the highest score!

## 🎮 Quick Start

1. **Install Dependencies**
```bash
npm run install:all
```

2. **Start the Game**
```bash
# Start backend
npm run start:backend

# Start frontend (in a new terminal)
npm start
```

3. **Play the Game**
- Open http://localhost:3000
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
- SQLite (default) or PostgreSQL

### Environment Setup
```bash
# Backend (.env)
# Default uses SQLite at ./test_casino_game.db
# For Postgres, set DATABASE_URL like below
DATABASE_URL=postgresql://user:pass@localhost:5432/casino_game
PORT=8000
HOST=0.0.0.0
```

### Testing
```bash
cd backend && python run_all_tests.py
```

## 📦 Deployment

### Production Setup
1. Clone repository
2. Install dependencies: `npm run install:all`
3. Start services:
```bash
npm run start:backend  # Start backend
npm start              # Start frontend
```

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