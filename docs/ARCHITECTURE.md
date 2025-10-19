## Architecture Overview

### Components
- Backend: FastAPI app in `backend/` with SQLAlchemy models and Alembic migrations.
- Frontend: Vite + React single-page app (`App.tsx` and `components/*`).
- Realtime: WebSocket endpoint `/ws/{room_id}` for broadcast nudges; clients refetch on message.
- Persistence: SQLite by default (`test_casino_game.db`) or `DATABASE_URL` via env; JSON columns store game state snapshots.

### Backend
- Entrypoint: `backend/main.py` defines API routes and websocket.
- Models: `backend/models.py` has `Room`, `Player`, `GameSession` schemas.
- Game Logic: `backend/game_logic.py` implements Cassino rules (deal, capture, build, trail, scoring).
- Schemas: `backend/schemas.py` defines request/response Pydantic models.
- DB: `backend/database.py` configures engine/session; Alembic under `backend/alembic/`.

### Frontend
- Root: `App.tsx` manages connection, room/player identity, websocket, and state syncing.
- UI: `components/GamePhases.tsx`, `components/GameActions.tsx`, `components/Dealer.tsx`, and `components/ui/*` for primitives.
- API client: `apiClient.ts` wraps fetch, normalizes keys to camelCase, and provides simple polling hooks.

### Game Flow
1) Create/Join room → backend creates `Room` and `Player` rows.
2) Both players set ready → phase moves to `dealer`.
3) Player 1 selects face-up cards (currently empty selection auto-advances) → backend shuffles/deals, sets `round1`.
4) Turns: `play-card` validates action (capture/build/trail) and updates JSON state, switching `current_turn`.
5) Round end: if hands empty and deck remains, deal round 2; else score and set winner.
6) WebSocket message prompts clients to refetch `/rooms/{room_id}/state`.

### Notable Decisions
- JSON state in `rooms` keeps endpoints idempotent and simple.
- Websocket carries no state, used only to signal clients to fetch.
- Tests run without pytest via simple runners to ease execution in constrained environments.


