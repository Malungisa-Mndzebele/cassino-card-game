# E2E Test Suite for Casino Card Game

This directory contains comprehensive end-to-end tests that simulate real players interacting with the game.

## Test Files

### `comprehensive-game.spec.ts`
**Primary test file** - Simulates two players playing a complete game:
- Room creation and joining
- Ready status management
- Dealer phase transition
- Full gameplay with multiple turns
- Game completion verification
- API state verification (when backend is accessible)

### `full-game-flow.spec.ts`
Alternative comprehensive test with multiple test scenarios:
- Complete game flow test
- Explicit action test with detailed UI interactions

### `create-join.spec.ts`
Basic smoke test for landing page and room creation/joining.

### `game-play-helpers.ts`
Shared utility functions for E2E tests:
- `createRoom()` - Create a new game room
- `joinRoom()` - Join an existing room
- `setReady()` - Set player ready status
- `waitForPhase()` - Wait for specific game phase
- `playCardAction()` - Play a card (capture/build/trail)
- `verifyGameState()` - Verify game is in valid state
- `getGameState()` - Fetch game state from API

## Running Tests

### Prerequisites

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the backend server:**
   ```bash
   npm run start:backend
   ```
   The backend should be running on `http://localhost:8000`

3. **Install Playwright browsers (if first time):**
   ```bash
   npx playwright install chromium
   ```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Tests

```bash
# Run only comprehensive game test
npm run test:e2e:full-game

# Run with UI mode (visual test runner)
npm run test:e2e:ui

# Run in debug mode (step through tests)
npm run test:e2e:debug
```

### Run Individual Test File

```bash
# Run specific test file
npx playwright test tests/e2e/comprehensive-game.spec.ts

# Run with specific browser
npx playwright test tests/e2e/comprehensive-game.spec.ts --project=chromium

# Run in headed mode (see browser)
npx playwright test tests/e2e/comprehensive-game.spec.ts --headed
```

## Test Structure

Each test creates two browser contexts to simulate two separate players:

1. **Player 1** - Creates the room
2. **Player 2** - Joins the room

The tests then simulate:
- Room creation and joining
- Ready status synchronization
- Game phase transitions
- Card playing (capture, build, trail)
- Game completion

## Test Output

- **Screenshots:** Automatically captured on test failures in `test-results/`
- **Videos:** Recorded for failed tests
- **Traces:** Available for debugging (on first retry)
- **Console logs:** Captured for both players on failure

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:5173/cassino/`
- Timeout: 60 seconds per test
- Frontend server: Automatically started via `npm run preview`
- Backend: Must be started manually (not automatically started)

## Debugging Failed Tests

1. **View screenshots:**
   ```bash
   # Screenshots saved to test-results/
   ```

2. **View traces:**
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

3. **Run in debug mode:**
   ```bash
   npm run test:e2e:debug
   ```

4. **Run in UI mode:**
   ```bash
   npm run test:e2e:ui
   ```

## CI/CD Integration

For CI/CD pipelines:

1. Build frontend: `npm run build`
2. Start backend in background: `npm run start:backend &`
3. Wait for backend: `wait-on http://localhost:8000/health`
4. Run tests: `npm run test:e2e`

Example GitHub Actions workflow:
```yaml
- name: Install dependencies
  run: npm ci

- name: Build frontend
  run: npm run build

- name: Install backend dependencies
  run: npm run install:backend

- name: Start backend
  run: npm run start:backend &
  
- name: Wait for backend
  run: npx wait-on http://localhost:8000/health

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
```

## Known Limitations

1. **Backend must be running:** Tests assume backend is accessible at `http://localhost:8000`
2. **Timeouts:** Some tests may need longer timeouts for slow connections
3. **Card selection:** Automated card playing is simplified (uses first available card)
4. **API verification:** Optional - tests work even if API is not directly accessible

## Tips

- Use `--headed` flag to watch tests run in real-time
- Use `--debug` to step through tests line by line
- Check `test-results/` directory for screenshots and videos on failures
- Increase timeouts in `playwright.config.ts` if tests are flaky on slow machines

