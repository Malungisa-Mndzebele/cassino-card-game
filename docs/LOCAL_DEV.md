## Local Development

### Prerequisites
- Node 18+ (for frontend)
- Python 3.11+ (for backend)

### Backend
1) Install deps:
   - Windows: `cd backend && .\install_dependencies.bat`
   - Unix: `cd backend && ./install_dependencies.sh`
2) Run server:
   - `python backend/main.py` or `uvicorn backend.main:app --reload`
3) Database:
   - Default: SQLite `./test_casino_game.db`
   - Postgres: set `DATABASE_URL` (postgresql://...) in `.env`
4) Migrations:
   - `alembic upgrade head`

### Frontend
1) Install deps: `npm install`
2) Dev server: `npm run dev` (if configured) or open `index.html` directly (project has minimal build)
3) Configure backend URL:
   - `.env`: `VITE_API_URL=http://localhost:8000`

### Realtime
- Frontend opens `ws://localhost:8000/ws/{roomId}` in dev.
- On any WS message, the client refetches `/rooms/{roomId}/state`.


