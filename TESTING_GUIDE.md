# Testing Guide

Complete guide for running tests in the Casino Card Game project.

## Quick Start

### Run Tests Without Backend
```powershell
npm run test:quick
```
This runs:
- ✅ TypeScript type checking
- ✅ Build verification
- ✅ Backend unit tests (if Python available)

### Run All Tests (Requires Backend)
```powershell
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Run all tests
npm run test:all
```

## Test Commands

### Individual Test Suites

```powershell
# Type checking only
npm run check

# Build test
npm run build

# Backend unit tests
npm run test:backend

# E2E tests (requires backend + frontend running)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Production tests (tests live site)
npm run test:production
```

### PowerShell Scripts

```powershell
# Quick tests (no servers needed)
.\run-quick-tests.ps1

# Full comprehensive suite (servers must be running)
.\run-all-tests.ps1
```

## Test Structure

### Backend Tests (`backend/`)
- `test_quick_wins.py` - Fast unit tests for models, schemas, database
- `test_session_manager_full.py` - Session management tests
- `test_cache_manager_full.py` - Redis caching tests

**Current Status**: ✅ 25/25 passing (99% coverage)

### Frontend Tests
Currently no unit tests - only E2E tests with Playwright.

### E2E Tests (`tests/e2e/`)
- `fixed-smoke-test.spec.ts` - Basic smoke tests
- `create-join.spec.ts` - Room creation/joining
- `full-game-flow.spec.ts` - Complete game scenarios
- `complete-game-scenarios.spec.ts` - Advanced scenarios
- `production-*.spec.ts` - Production site tests
- `websocket-test.spec.ts` - WebSocket functionality
- `random-join.spec.ts` - Random room joining

**Important**: E2E tests require both backend and frontend running.

## Common Issues

### Issue: E2E Tests Fail with "Root element not found"
**Solution**: Tests have been updated to use `document.body` instead of `#root` (SvelteKit doesn't use #root).

### Issue: Backend Not Running
**Error**: `Backend is not running! Please start it with: npm run start:backend`

**Solution**:
```powershell
# Start backend in separate terminal
npm run start:backend

# Or use Python directly
cd backend
python start_production.py
```

### Issue: Redis Connection Failed
**Error**: `Redis connection refused`

**Solution**:
```powershell
# Start Redis with Docker
npm run start:redis

# Or start Redis directly
redis-server
```

### Issue: Tests Timeout
**Cause**: Frontend not building or backend not responding

**Solution**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check frontend is running: `curl http://localhost:5173`
3. Increase timeout in test if needed

## Test Configuration

### Playwright Config (`playwright.config.ts`)
- Runs on `http://localhost:5173` (dev server)
- Timeout: 60 seconds per test
- Retries: 2 on CI, 0 locally
- Browsers: Chromium, Firefox, WebKit

### Production Config (`playwright.production.config.ts`)
- Runs on `https://khasinogaming.com/cassino/`
- Tests live production site
- No retries (production should be stable)

### Vitest Config (`vitest.config.ts`)
- Environment: happy-dom (for Svelte)
- Includes: `src/**/*.{test,spec}.{js,ts}`
- Excludes: E2E and integration tests

## Writing New Tests

### Backend Test Example
```python
# backend/test_example.py
import pytest
from models import Room

def test_room_creation():
    room = Room(id="TEST01", name="Test Room")
    assert room.id == "TEST01"
    assert room.name == "Test Room"
```

### E2E Test Example
```typescript
// tests/e2e/example.spec.ts
import { test, expect } from '@playwright/test'
import { waitForSvelteKitApp } from './test-helpers'

test('example test', async ({ page }) => {
  await page.goto('/')
  await waitForSvelteKitApp(page)
  
  await expect(page.getByText('Casino Card Game')).toBeVisible()
})
```

### Using Test Helpers
```typescript
import { gotoAndWait, waitForSvelteKitApp } from './test-helpers'

// Navigate and wait for SvelteKit
await gotoAndWait(page, '/')

// Or wait after navigation
await page.goto('/')
await waitForSvelteKitApp(page)
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to master
- Pull requests
- Manual workflow dispatch

### Test Stages
1. **Type Check**: Verify TypeScript types
2. **Build**: Ensure code builds successfully
3. **Backend Tests**: Run Python unit tests
4. **E2E Tests**: Run Playwright tests (if backend available)

## Performance Testing

### Load Testing
```powershell
# Run performance tests
npm run test:e2e -- tests/performance/
```

### Metrics to Monitor
- Page load time (target: < 3s)
- API response time (target: < 500ms)
- WebSocket latency (target: < 100ms)
- Memory usage
- CPU usage

## Debugging Tests

### Run Single Test
```powershell
# Playwright
npx playwright test tests/e2e/fixed-smoke-test.spec.ts

# Pytest
cd backend
python -m pytest test_quick_wins.py::TestModelsRepr::test_room_repr -v
```

### Debug Mode
```powershell
# Playwright debug mode
npm run test:e2e:debug

# Playwright UI mode
npm run test:e2e:ui
```

### View Test Results
```powershell
# Open Playwright report
npx playwright show-report

# View screenshots
# Located in: test-results/
```

### Enable Verbose Logging
```powershell
# Playwright with trace
npx playwright test --trace on

# Pytest with verbose output
cd backend
python -m pytest -vv --tb=long
```

## Test Coverage

### Backend Coverage
```powershell
cd backend
python -m pytest --cov=. --cov-report=html
# View: backend/htmlcov/index.html
```

### Current Coverage
- Models: 100%
- Schemas: 94%
- Quick wins tests: 99%
- Overall backend: ~29% (many files not yet tested)

## Best Practices

### DO
✅ Run `npm run test:quick` before committing
✅ Write tests for new features
✅ Use descriptive test names
✅ Clean up test data after tests
✅ Mock external dependencies
✅ Test both success and error cases

### DON'T
❌ Commit failing tests
❌ Skip tests with `.skip()` without reason
❌ Use hardcoded timeouts (use waitFor instead)
❌ Test implementation details
❌ Leave console.log in tests
❌ Forget to clean up resources

## Troubleshooting

### All Tests Fail
1. Check Node.js version: `node --version` (need >= 18)
2. Check Python version: `python --version` (need >= 3.11)
3. Reinstall dependencies: `npm ci`
4. Clear caches: `npm run clean` (if available)

### Flaky Tests
1. Increase timeouts
2. Add explicit waits
3. Check for race conditions
4. Verify test isolation

### Slow Tests
1. Run tests in parallel: `npx playwright test --workers=4`
2. Use test sharding in CI
3. Mock slow operations
4. Optimize test setup/teardown

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Testing Library](https://testing-library.com/)

## Getting Help

If tests are failing:
1. Check this guide first
2. Review error messages carefully
3. Check test-results/ for screenshots
4. Review recent code changes
5. Ask team for help with context

## Summary

- **Quick tests**: `npm run test:quick` (no backend needed)
- **Full tests**: `npm run test:all` (backend + frontend required)
- **Backend tests**: ✅ 25/25 passing
- **E2E tests**: Fixed for SvelteKit (body instead of #root)
- **Production tests**: Test live site at khasinogaming.com

Keep tests green! 🟢
