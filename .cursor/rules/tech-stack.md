---
description: Technical stack preferences
globs:
alwaysApply: false
---

# Technical Stack

- Backend: Python 3.11+ with FastAPI, SQLAlchemy, Alembic, WebSockets (Starlette)
- Database: SQLite by default for local; MySQL via `DATABASE_URL` (mysql+pymysql://) for staging/prod
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS (base path `/cassino/`)
- UI: Radix UI primitives (shadcn/ui style) and `lucide-react` icons
- Tooling: TypeScript, ESLint, Prettier, Node 18+
- Realtime: WS endpoint `/ws/{room_id}`; on shared hosting default to HTTP polling (WebSockets may be unavailable)
- Tests: Backend custom Python runners (no pytest); frontend test harness present (vitest config)
- Environments: Local/dev with SQLite; production via FTP deploy and PHP proxy

## Deployment & Hosting

- CI/CD: GitHub Actions
  - Jobs: test (SQLite), build (Vite), deploy (FTP)
  - Deploys `dist/` (Vite output) plus `backend/` (including `backend/start.php`)
  - Uses repository `.htaccess` at project root if present
- Hosting: Shared (Spaceship/LiteSpeed)
  - PHP proxy `backend/start.php` forwards API requests to FastAPI on `localhost:8000`
  - `.htaccess` rewrites:
    - `^api/(.*)$`, `^health$`, `^rooms/(.*)$`, `^game/(.*)$` → `backend/start.php`
    - SPA fallback → `index.html`
  - Optional cron: `backend/deploy_maintenance.sh` consumes `deploy.trigger` to run Alembic and restart backend
- Backend runtime: `backend/start_server.sh` starts uvicorn (no Docker)
- Frontend base URL: Served at `/cassino/` (Vite `base`)

## Configuration

- Backend `.env` (server-only):
  - `DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/<db>` (URL-encode special chars)
  - `CORS_ORIGINS=https://khasinogaming.com`
  - `HOST=0.0.0.0`, `PORT=8000`
  - `ROOT_PATH=/cassino-api` (only if mounting behind subpath; not used with PHP proxy)
- Frontend: Prefer relative API via proxy; otherwise `VITE_API_URL` can be set
