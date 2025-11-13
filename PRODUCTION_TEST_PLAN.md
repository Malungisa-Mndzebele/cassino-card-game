# Production Test Plan

## Test Environment
- **Frontend URL:** https://khasinogaming.com/cassino/
- **Backend API:** https://cassino-game-backend.fly.dev
- **WebSocket:** wss://cassino-game-backend.fly.dev

## Database Status
✅ Migrations applied: 0003_add_game_action_log (head)
✅ Session management tables created
✅ Action logging tables created

## Critical Features to Test

### 1. Basic Functionality
- [ ] Landing page loads
- [ ] Create room works
- [ ] Join room works
- [ ] Room code display
- [ ] Player names display

### 2. WebSocket Connection
- [ ] WebSocket connects successfully
- [ ] Real-time updates work
- [ ] Connection status indicators

### 3. Session Management (NEW)
- [ ] Session tokens generated on join
- [ ] Session tokens stored in localStorage
- [ ] Reconnection works after refresh
- [ ] Heartbeat keeps session alive
- [ ] Session cleanup after disconnect

### 4. Game Flow
- [ ] Card dealing works
- [ ] Player turns work
- [ ] Captures work
- [ ] Builds work
- [ ] Trailing works
- [ ] Scoring works
- [ ] Game completion works

### 5. Action Logging (NEW)
- [ ] Actions are logged to database
- [ ] Sequence numbers are correct
- [ ] Action replay works on reconnect
- [ ] Missed actions are recovered

### 6. Error Handling
- [ ] Invalid room codes handled
- [ ] Network errors handled gracefully
- [ ] Reconnection after disconnect
- [ ] Concurrent connection detection

## Known Issues to Check

1. **Frontend Deployment**
   - Verify latest build is deployed
   - Check API URLs are correct
   - Verify WebSocket URL is correct

2. **Backend Health**
   - Check /health endpoint
   - Verify database connection
   - Check WebSocket endpoint

3. **Session Management**
   - Verify session tokens work
   - Check heartbeat mechanism
   - Test reconnection flow

## Test Execution

### Quick Smoke Test
```bash
npx playwright test test-production-quick.spec.ts
```

### Full Test Suite
```bash
npx playwright test --config=playwright.production.config.ts tests/e2e/live-deployment-test.spec.ts
```

### Manual Testing Checklist
1. Open https://khasinogaming.com/cassino/
2. Create a room
3. Open in incognito/another browser
4. Join the room
5. Play a full game
6. Refresh during game (test reconnection)
7. Check browser console for errors
8. Check Network tab for WebSocket

## Expected Results

### Successful Test Indicators
- ✅ All Playwright tests pass
- ✅ No console errors (except favicon)
- ✅ WebSocket connection established
- ✅ Session tokens in localStorage
- ✅ Game completes successfully
- ✅ Reconnection works after refresh

### Failure Indicators
- ❌ Page doesn't load
- ❌ WebSocket fails to connect
- ❌ Session tokens not generated
- ❌ Game state lost on refresh
- ❌ Actions not logged
- ❌ Console errors present

## Debugging Steps

If tests fail:

1. **Check Frontend Deployment**
   ```bash
   curl -I https://khasinogaming.com/cassino/
   ```

2. **Check Backend Health**
   ```bash
   curl https://cassino-game-backend.fly.dev/health
   ```

3. **Check WebSocket**
   - Open browser DevTools
   - Go to Network tab → WS filter
   - Look for WebSocket connection

4. **Check Database**
   ```bash
   flyctl ssh console -C "python -m alembic current"
   ```

5. **Check Logs**
   ```bash
   flyctl logs
   ```

## Next Steps After Testing

1. Document any failures
2. Fix critical issues
3. Re-run tests
4. Update documentation
5. Monitor production for 24 hours
