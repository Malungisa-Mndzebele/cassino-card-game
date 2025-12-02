# Quick Start: Run Production Tests Now

## Prerequisites Check

1. **Node.js installed?**
   ```powershell
   node --version
   ```
   Should show v18 or higher ✅

2. **In the correct directory?**
   ```powershell
   pwd
   ```
   Should be in: `C:\Home\Code\Multiplayer Card Game`

## Step 1: Install Playwright Browsers (One-time setup)

```powershell
npx playwright install chromium
```

This will download the Chromium browser for testing. Takes ~2-3 minutes.

## Step 2: Run the Production Tests

### Option A: Run Full Test Suite (Recommended)

```powershell
npm run test:production:full
```

This will:
- Test two players creating and joining a room
- Test quick match functionality
- Test error handling
- Test WebSocket connectivity
- Test the complete game flow

### Option B: Run All Production Tests

```powershell
npm run test:production:all
```

### Option C: Use the PowerShell Script

```powershell
.\run-production-tests.ps1
```

## Step 3: Watch the Tests Run

You'll see:
- Browser windows opening automatically
- Two "players" interacting with the site
- Tests creating rooms, joining, and playing
- Real-time progress in the terminal

## Step 4: View Results

After tests complete, view the detailed report:

```powershell
npx playwright show-report playwright-report/production
```

This opens an interactive HTML report in your browser showing:
- ✅ Which tests passed
- ❌ Which tests failed (if any)
- 📸 Screenshots of failures
- 🎥 Video recordings
- 📊 Performance metrics

## What the Tests Do

### Test 1: Complete Two-Player Game Flow
1. Player 1 creates a room
2. Player 2 joins using the room code
3. Both players see each other
4. Both players mark ready
5. Game starts
6. WebSocket connections verified

### Test 2: Quick Match
1. Player 1 clicks "Quick Match"
2. Player 2 clicks "Quick Match"
3. They get matched together
4. Game starts

### Test 3: Error Handling
1. Try to join with duplicate name
2. Try to join full room
3. Verify error messages display

### Test 4: Health & Performance
1. Check backend API is responding
2. Measure page load time
3. Verify it loads in <10 seconds

### Test 5: Mobile Responsive
1. Test on mobile viewport (375x667)
2. Verify UI elements are visible
3. Check touch-friendly interface

## Troubleshooting

### If tests fail:

1. **Check internet connection**
   - Tests run against live site: https://khasinogaming.com/cassino/

2. **Check if site is accessible**
   ```powershell
   curl https://khasinogaming.com/cassino/
   ```

3. **Check backend is running**
   ```powershell
   curl https://cassino-game-backend.onrender.com/health
   ```

4. **View detailed error report**
   ```powershell
   npx playwright show-report playwright-report/production
   ```

### If Playwright install fails:

```powershell
# Try installing all dependencies first
npm install

# Then install browsers
npx playwright install
```

## Expected Output

### Success:
```
✅ All production tests passed!

📊 View detailed report:
   npx playwright show-report playwright-report/production
```

### Failure:
```
❌ Some tests failed. Check the report for details.

📊 View detailed report:
   npx playwright show-report playwright-report/production
```

## Quick Commands Reference

```powershell
# Run full test suite
npm run test:production:full

# Run all production tests
npm run test:production:all

# View last test report
npx playwright show-report playwright-report/production

# Run in debug mode (step through tests)
npx playwright test --config=playwright.production.config.ts --debug

# Run in UI mode (interactive)
npx playwright test --config=playwright.production.config.ts --ui
```

## What You'll Learn

After running these tests, you'll know:
- ✅ Can two players join a room? YES/NO
- ✅ Can they see each other? YES/NO
- ✅ Does WebSocket work? YES/NO
- ✅ Does quick match work? YES/NO
- ✅ Do errors display properly? YES/NO
- ✅ Is the site fast enough? YES/NO
- ✅ Does mobile work? YES/NO

## Time Required

- First run (with browser install): ~5-10 minutes
- Subsequent runs: ~2-3 minutes

## Need Help?

1. Check the detailed report: `npx playwright show-report playwright-report/production`
2. Look at screenshots in: `playwright-report/production/screenshots/`
3. Watch video recordings in: `playwright-report/production/videos/`
4. Check console output for error messages

## Ready? Let's Go!

```powershell
# Make sure you're in the right directory
cd "C:\Home\Code\Multiplayer Card Game"

# Run the tests!
npm run test:production:full
```

🎮 Good luck! The tests will show you exactly how your game works end-to-end!
