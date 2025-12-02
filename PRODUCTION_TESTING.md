# Production Testing Guide

## Overview

This guide explains how to run end-to-end tests against the live production deployment at https://khasinogaming.com/cassino/

## Test Suite

### Production Game Flow Test (`tests/e2e/production-game-flow.spec.ts`)

Comprehensive end-to-end test covering:

1. **Two-Player Game Flow**
   - Player 1 creates a room
   - Player 2 joins the room
   - Both players see each other
   - Players mark ready
   - Game starts successfully
   - WebSocket connectivity verified

2. **Quick Match Functionality**
   - Player 1 uses quick match
   - Player 2 uses quick match
   - Players are matched together

3. **Error Handling**
   - Duplicate player names
   - Full rooms
   - Invalid room codes

4. **Health Check**
   - Backend API connectivity
   - Health endpoint verification

5. **Performance**
   - Page load time measurement
   - Should load within 10 seconds

6. **Responsive Design**
   - Mobile viewport testing
   - UI element visibility

## Running Tests

### Option 1: PowerShell Script (Recommended)

```powershell
.\run-production-tests.ps1
```

This script will:
- Check Playwright installation
- Install browsers if needed
- Run all production tests
- Display results
- Show report command

### Option 2: NPM Scripts

```bash
# Run full game flow test
npm run test:production:full

# Run all production tests
npm run test:production:all

# Run specific smoke test
npm run test:production
```

### Option 3: Direct Playwright Command

```bash
# Run all production tests
npx playwright test --config=playwright.production.config.ts

# Run specific test file
npx playwright test tests/e2e/production-game-flow.spec.ts --config=playwright.production.config.ts

# Run with UI mode
npx playwright test --config=playwright.production.config.ts --ui

# Run in debug mode
npx playwright test --config=playwright.production.config.ts --debug
```

## Test Configuration

The production tests use `playwright.production.config.ts`:

- **Base URL**: https://khasinogaming.com/cassino/
- **Retries**: 2 (for flaky network conditions)
- **Workers**: 1 (sequential execution)
- **Timeout**: 120 seconds per test
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Trace**: On first retry

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Playwright** installed
   ```bash
   npm install
   ```

3. **Playwright Browsers**
   ```bash
   npx playwright install chromium
   ```

## Test Results

### Success Output

```
✅ All production tests passed!

📊 View detailed report:
   npx playwright show-report playwright-report/production
```

### Failure Output

```
❌ Some tests failed. Check the report for details.

📊 View detailed report:
   npx playwright show-report playwright-report/production
```

## Viewing Reports

After running tests, view the HTML report:

```bash
npx playwright show-report playwright-report/production
```

This opens an interactive report showing:
- Test results
- Screenshots of failures
- Video recordings
- Execution traces
- Network activity

## Test Scenarios

### Scenario 1: Complete Game Flow

```typescript
// Creates room → Joins room → Both ready → Game starts
test('complete two-player game flow', async ({ browser }) => {
  // Test implementation
});
```

**What it tests:**
- Room creation
- Room joining
- Player visibility
- Ready status
- Game initialization
- WebSocket connectivity

### Scenario 2: Quick Match

```typescript
// Two players use quick match and get paired
test('quick match functionality', async ({ browser }) => {
  // Test implementation
});
```

**What it tests:**
- Quick match button
- Automatic room matching
- Player pairing

### Scenario 3: Error Handling

```typescript
// Tests error scenarios
test.step('Test error handling', async () => {
  // Test implementation
});
```

**What it tests:**
- Duplicate player names (auto-deduplication)
- Full room errors
- Error message display

### Scenario 4: Health & Performance

```typescript
// Checks backend health and page performance
test('health check and API connectivity', async ({ request }) => {
  // Test implementation
});
```

**What it tests:**
- Backend API availability
- Health endpoint response
- Page load performance (<10s)

### Scenario 5: Responsive Design

```typescript
// Tests mobile viewport
test('responsive design', async ({ browser }) => {
  // Test implementation
});
```

**What it tests:**
- Mobile viewport (375x667)
- UI element visibility
- Touch-friendly interface

## Debugging Failed Tests

### 1. View Screenshots

Screenshots are automatically captured on failure:
```
playwright-report/production/screenshots/
```

### 2. Watch Video Recordings

Videos are retained on failure:
```
playwright-report/production/videos/
```

### 3. Inspect Traces

Traces include network activity, console logs, and DOM snapshots:
```bash
npx playwright show-trace trace.zip
```

### 4. Run in Debug Mode

```bash
npx playwright test --config=playwright.production.config.ts --debug
```

This opens Playwright Inspector for step-by-step debugging.

### 5. Run in UI Mode

```bash
npx playwright test --config=playwright.production.config.ts --ui
```

Interactive UI for running and debugging tests.

## Common Issues

### Issue: Tests timeout

**Solution:**
- Check internet connection
- Verify production site is accessible
- Increase timeout in config if needed

### Issue: WebSocket connection fails

**Solution:**
- Check backend deployment status
- Verify WebSocket URL is correct
- Check CORS configuration

### Issue: Players can't see each other

**Solution:**
- Verify WebSocket broadcast is working
- Check backend logs for errors
- Ensure database migrations are applied

### Issue: Room code not found

**Solution:**
- Check database connectivity
- Verify room creation endpoint
- Check Redis cache status

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/production-tests.yml`:

```yaml
name: Production E2E Tests

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install chromium
      - run: npm run test:production:all
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Run before major releases** - Verify production is working
2. **Run after deployments** - Smoke test new changes
3. **Schedule regular runs** - Catch issues early
4. **Monitor test results** - Track trends over time
5. **Update tests** - Keep in sync with features

## Test Maintenance

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Use production config
3. Follow existing patterns
4. Add to this documentation

### Updating Tests

1. Keep tests in sync with UI changes
2. Update selectors if needed
3. Adjust timeouts for slow networks
4. Test on multiple browsers

## Support

For issues or questions:
1. Check test output and reports
2. Review backend logs on Render
3. Check frontend deployment status
4. Verify database and Redis connectivity

## Summary

The production test suite provides confidence that:
- ✅ The live site is accessible
- ✅ Core game flow works end-to-end
- ✅ Multiple players can connect
- ✅ WebSocket communication works
- ✅ Error handling is functional
- ✅ Performance is acceptable
- ✅ Mobile experience works

Run these tests regularly to ensure production quality!
