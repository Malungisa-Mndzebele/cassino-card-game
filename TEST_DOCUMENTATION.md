# Test Documentation

**Project:** Casino Card Game  
**Last Updated:** November 21, 2025  
**Status:** Backend ✅ | E2E ⚠️

---

## Quick Reference

### Run Tests
```bash
# Backend tests
cd backend && python -m pytest -v

# E2E tests (local)
npm run test:e2e

# E2E tests (production)
npx playwright test --config=playwright.production.config.ts
```

### Test Results Summary
- **Backend:** 81/81 passing (100%) ✅
- **E2E:** 4/9 passing (44%) ⚠️
- **Coverage:** 64% overall, 100% on critical modules

---

## Backend Tests

### Status: ✅ ALL PASSING

**Test Suites:**
1. `test_quick_wins.py` - 25 tests (models, schemas, database)
2. `test_session_manager_full.py` - 30 tests (session management)
3. `test_cache_manager_full.py` - 26 tests (caching)

**Coverage:**
- cache_manager.py: 100%
- session_manager.py: 100%
- models.py: 100%
- schemas.py: 94%
- Overall: 64%

**Run Command:**
```bash
cd backend
python -m pytest test_quick_wins.py test_session_manager_full.py test_cache_manager_full.py -v
```

---

## E2E Tests

### Status: ⚠️ PARTIAL (4/9 passing)

**Passing:**
- Production site accessibility ✅
- Page structure ✅
- Static assets ✅
- Metadata ✅

**Failing:**
- Room creation UI (selector mismatch) ❌
- Backend API health check (timeout) ❌
- CORS configuration (backend timeout) ❌

**Known Issues:**
1. Production backend not responding (Render possibly sleeping)
2. UI selectors need updating for production build

**Run Commands:**
```bash
# Local E2E
npm run test:e2e

# Production E2E
npx playwright test --config=playwright.production.config.ts
```

---

## Test Infrastructure

### Files
- `playwright.config.ts` - Local E2E config
- `playwright.production.config.ts` - Production E2E config
- `backend/pytest.ini` - Backend test config
- `backend/conftest.py` - Test fixtures

### Test Directories
- `backend/` - Backend unit tests
- `tests/e2e/` - E2E test suites
- `test-results/` - Test artifacts (screenshots, videos)

---

## Troubleshooting

### Backend Not Running
```bash
npm run start:backend
# Wait for: "✅ Database connection successful"
```

### Redis Not Running
```bash
npm run start:redis
```

### E2E Tests Failing
1. Check backend is running: `curl http://localhost:8000/health`
2. Check preview server: `curl http://localhost:5173/cassino/`
3. Review screenshots in `test-results/`

### Production Backend Timeout
```bash
# Check Render status
curl https://cassino-game-backend.onrender.com/health
```

---

## Next Steps

### Immediate
- [ ] Fix production backend availability
- [ ] Update UI test selectors
- [ ] Increase backend request timeouts

### Future
- [ ] Increase test coverage for game_logic.py (currently 21%)
- [ ] Add integration tests for API endpoints
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring for production backend

---

## Documentation

For detailed information, see:
- `.kiro/steering/troubleshooting.md` - Troubleshooting guide
- `.kiro/steering/development.md` - Development guidelines
- `backend/test_coverage_plan.md` - Coverage improvement plan
