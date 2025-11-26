# E2E Test Organization

## Test Files Overview

### 🏠 Local Tests (`local.spec.ts`)
**Purpose:** Test the localhost development environment  
**URL:** `http://localhost:5173/cassino/` (uses baseURL from playwright.config.ts)  
**Requirements:** 
- Frontend dev server running (`npm run dev`)
- Backend running (`cd backend && python start_dev.py`)

**Run with:**
```bash
npx playwright test tests/e2e/local.spec.ts
```

**Tests included:**
- Landing page loads
- All test IDs present
- Room creation
- Room code display
- Player name display
- WebSocket connection
- Join room interface
- Mobile responsiveness
- Console error checking
- Input validation

---

### 🌐 Live/Production Tests (`live.spec.ts`)
**Purpose:** Test the actual production deployment  
**URL:** `https://khasinogaming.com/cassino/`  
**Backend:** `https://cassino-game-backend.fly.dev`  
**Requirements:** Production site must be deployed

**Run with:**
```bash
npx playwright test tests/e2e/live.spec.ts
```

**Tests included:**
- All local tests (against production)
- Backend health endpoint check
- Page metadata verification

---

### 🧪 Other Test Files

#### `production-basic-check.spec.ts`
Basic production site checks (similar to live.spec.ts but more focused)

#### `production-smoke-test.spec.ts`
Comprehensive production smoke tests including API endpoint checks

#### `production-session-test.spec.ts`
Session management and token handling tests

#### `complete-game-scenarios.spec.ts`
Full game flow scenarios with two players

#### `full-game-flow.spec.ts`
Complete game from start to finish

#### `random-join.spec.ts`
Random room join functionality

#### `websocket-test.spec.ts`
WebSocket connection and messaging tests

#### `local-development.spec.ts` (deprecated)
Old local test file - use `local.spec.ts` instead

#### `live-deployment-test.spec.ts` (deprecated)
Old live test file - use `live.spec.ts` instead

---

## Quick Start

### Run Local Tests
```bash
# 1. Start backend
cd backend
python start_dev.py

# 2. Start frontend (in another terminal)
npm run dev

# 3. Run local tests (in another terminal)
npx playwright test tests/e2e/local.spec.ts
```

### Run Production Tests
```bash
# No setup needed - tests against live site
npx playwright test tests/e2e/live.spec.ts
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test
```bash
npx playwright test tests/e2e/local.spec.ts -g "should load the landing page"
```

---

## Test Configuration

Tests use the baseURL from `playwright.config.ts`:
```typescript
baseURL: 'http://localhost:5173/cassino/'
```

This means:
- `page.goto('/')` → Goes to localhost
- `page.goto('https://...')` → Goes to specific URL

---

## Debugging Tests

### Run with UI
```bash
npx playwright test tests/e2e/local.spec.ts --ui
```

### Run in headed mode
```bash
npx playwright test tests/e2e/local.spec.ts --headed
```

### Debug specific test
```bash
npx playwright test tests/e2e/local.spec.ts --debug
```

### View test report
```bash
npx playwright show-report
```

---

## Common Issues

### Backend not responding
**Symptom:** Tests timeout waiting for room creation  
**Fix:** 
1. Check backend is running: `netstat -ano | findstr :8000`
2. Try accessing: `http://localhost:8000/health`
3. Check Windows Firewall settings

### Frontend not loading
**Symptom:** Tests fail to load page  
**Fix:**
1. Check dev server is running: `npm run dev`
2. Access manually: `http://localhost:5173/cassino/`

### WebSocket connection fails
**Symptom:** WebSocket tests fail  
**Fix:**
1. Ensure backend is running
2. Check browser console for WebSocket errors
3. Verify WebSocket URL in connection store

---

## Test Status

✅ **Local Tests:** Ready to run (requires backend)  
✅ **Live Tests:** Ready to run (tests production)  
⏳ **Game Flow Tests:** Require additional debugging  

---

## Migration Notes

**Old Files → New Files:**
- `live-deployment-test.spec.ts` → `live.spec.ts` (production)
- `local-development.spec.ts` → `local.spec.ts` (localhost)

The old files can be deleted after verifying new files work correctly.
