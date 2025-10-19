---
description: Technical stack preferences
globs:
alwaysApply: false
---

# Technical Stack

- Backend: Python 3.11+ with FastAPI, SQLAlchemy, Alembic, WebSockets (Starlette)
- Database: SQLite by default for local; MySQL via `DATABASE_URL` (mysql+pymysql://) for staging/prod
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- UI: Radix UI primitives (shadcn/ui style) and `lucide-react` icons
- Tooling: TypeScript, ESLint, Prettier, Node 18+
- Realtime: WS endpoint `/ws/{room_id}`; client refetches state on nudge
- Tests: Backend custom Python runners (no pytest); frontend test harness present (vitest config)
- Environments: Local/dev with SQLite; production behind reverse proxy with WS passthrough
