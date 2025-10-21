---
description: Coding pattern preferences
globs:
alwaysApply: true
---

# Coding Pattern Preferences

- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don't have duplicate logic
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200–300 lines of code. Refactor at that point
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments

## React/TypeScript specifics
- Prefer useCallback/useMemo only when necessary; avoid premature memoization.
- Keep hooks stable: put functions in useCallback or compute scalars with useMemo when used in deps.
- Use functional state updates in effects to satisfy exhaustive-deps without extra re-renders.
- Type props and function signatures; avoid `any` in exported APIs.
- Gate debug logs behind dev checks; avoid noisy logs in production.
- Build with Vite; set `base` to `/cassino/`; rely on `.htaccess` SPA fallback.
- Prefer relative API paths via proxy; avoid hardcoding :8000.

## Backend (FastAPI)
- Centralize common DB/entity lookups (e.g., get_room_or_404) to avoid duplication.
- Keep request/response schemas in `schemas.py` and models in `models.py`.
- Use Alembic for schema changes; never create tables ad-hoc in code.
- Support shared hosting via PHP proxy (`backend/start.php`); map HEAD→GET in proxy for health checks.
- Provide `ROOT_PATH` support for subpath hosting; default unset when using proxy.