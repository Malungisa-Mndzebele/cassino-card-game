# Testing Guide - Bug Fixes for Two-Player Game

## Quick Start Testing

### Prerequisites
1. Backend running on `http://localhost:8000`
2. Frontend running on `http://localhost:5173`
3. Two browser tabs or windows (or one normal + one incognito)

---

## Test Scenario 1: Player Join Synchronization ✅

**Objective**: Verify that when Player 2 joins, Player 1's UI updates immediately.

### Steps:
1. **Tab 1**: Open `http://localhost:5173`
2. **Tab 1**: Enter name "Player1" and click "Create Room"
3. **Tab 1**: Note the 6-character room code (e.g., "ABC123")
4. **Tab 1**: Verify you see "Waiting for Opponent..." screen
5. **Tab 2**: Open `http://localhost:5173` (use incognito or different browser)
6. **Tab 2**: Enter name "Player2" and the room code
7. **Tab 2**: Click "Join Room"

### Expected Results:
- ✅ **Tab 1** should immediately transition from "Waiting for Opponent..." to "Get Ready!" screen
- ✅ **Tab 1** should show both players: "Player1" and "Player2"
- ✅ **Tab 2** should show "Get Ready!" screen with both players
- ✅ Both tabs should show "🟢 Connected" status
- ✅ Both players should show "⏳ Not Ready" status initially

### What Was Fixed:
- WebSocket `game_state_update` now triggers API fetch for latest state
- Frontend properly updates when new player joins

---

## Test Scenario 2: Session Persistence (F5 Refresh) ✅

**Objective**: Verify that refreshing the page maintains the session.

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. **Tab 1**: Press **F5** to refresh the page
3. Wait 2-3 seconds for reconnection

### Expected Results:
- ✅ **Tab 1** should automatically reconnect to the same room
- ✅ **Tab 1** should show "Get Ready!" screen with both players
- ✅ Room code should be the same
- ✅ Player names should be preserved
- ✅ WebSocket should reconnect (shows "🟢 Connected")

### What Was Fixed:
- `roomId` and `playerId` now saved to localStorage
- Page mount automatically attempts reconnection
- Game state fetched and restored on reconnect

---

## Test Scenario 3: Hard Refresh (Ctrl+F5) ✅

**Objective**: Verify that even a hard refresh maintains the session.

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. **Tab 1**: Press **Ctrl+F5** (or Cmd+Shift+R on Mac) for hard refresh
3. Wait 2-3 seconds for reconnection

### Expected Results:
- ✅ **Tab 1** should automatically reconnect to the same room
- ✅ All game state should be restored
- ✅ Both players visible
- ✅ WebSocket reconnected

### What Was Fixed:
- localStorage persists across hard refreshes
- Reconnection logic handles cache-cleared scenarios

---

## Test Scenario 4: Ready Status Synchronization ✅

**Objective**: Verify that ready status changes sync between players.

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. **Tab 1**: Click the "Ready" button
3. Observe both tabs
4. **Tab 2**: Click the "Ready" button
5. Observe both tabs

### Expected Results:
- ✅ When Player 1 clicks "Ready", both tabs show Player 1 as "✓ Ready"
- ✅ When Player 2 clicks "Ready", both tabs show Player 2 as "✓ Ready"
- ✅ Button text toggles between "Ready" and "Not Ready"
- ✅ Changes appear in real-time (< 1 second delay)

### What Was Fixed:
- Ready status API call now properly transforms response
- WebSocket broadcasts trigger state refresh
- UI reactively updates based on game state

---

## Test Scenario 5: Leave Room Functionality ✅

**Objective**: Verify that leaving a room properly cleans up the session.

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. **Tab 1**: Click "Leave Room" button
3. Check localStorage in browser DevTools

### Expected Results:
- ✅ **Tab 1** returns to home screen (room creation/join form)
- ✅ localStorage cleared (`cassino_room_id` and `cassino_player_id` removed)
- ✅ WebSocket disconnected
- ✅ Player name still saved for convenience
- ✅ Can create or join a new room immediately

### What Was Fixed:
- `gameStore.reset()` now clears localStorage
- WebSocket properly disconnected
- Clean state for next session

---

## Test Scenario 6: Multiple Refreshes ✅

**Objective**: Verify session persistence across multiple refreshes.

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. **Tab 1**: Press F5 (refresh)
3. Wait for reconnection
4. **Tab 1**: Press F5 again
5. Wait for reconnection
6. **Tab 1**: Press F5 a third time

### Expected Results:
- ✅ Each refresh should successfully reconnect
- ✅ Game state maintained across all refreshes
- ✅ No errors in console
- ✅ WebSocket reconnects each time

---

## Test Scenario 7: Data Format Verification ✅

**Objective**: Verify that all game data displays correctly (no undefined values).

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. Open browser DevTools Console
3. Type: `localStorage.getItem('cassino_room_id')`
4. Observe the game state in the UI

### Expected Results:
- ✅ Room code displays correctly (6 characters)
- ✅ Player names display correctly
- ✅ Scores show as "0 - 0"
- ✅ Ready status shows correctly
- ✅ No "undefined" or "null" text in UI
- ✅ No console errors about missing properties

### What Was Fixed:
- Added `transformGameState()` function to convert snake_case to camelCase
- All API responses now properly transformed
- Frontend receives data in expected format

---

## Test Scenario 8: Network Interruption Recovery 🔄

**Objective**: Verify that temporary network issues are handled gracefully.

### Steps:
1. Complete Test Scenario 1 (both players in room)
2. Open browser DevTools → Network tab
3. Set throttling to "Offline"
4. Wait 5 seconds
5. Set throttling back to "No throttling"

### Expected Results:
- ✅ WebSocket shows "🔴 Disconnected" during offline period
- ✅ WebSocket automatically reconnects when back online
- ✅ Game state syncs after reconnection
- ✅ No data loss

### Note:
This test verifies the existing reconnection logic still works with the new changes.

---

## Debugging Tips

### Check localStorage:
```javascript
// In browser console
console.log('Room ID:', localStorage.getItem('cassino_room_id'));
console.log('Player ID:', localStorage.getItem('cassino_player_id'));
console.log('Player Name:', localStorage.getItem('cassino_player_name'));
```

### Check WebSocket Connection:
```javascript
// In browser console (after opening DevTools → Network → WS tab)
// You should see WebSocket connection to ws://localhost:8000/ws/{room_id}
```

### Check Game State:
```javascript
// In browser console
// Open Svelte DevTools extension to inspect store values
```

### Clear Session (if needed):
```javascript
// In browser console
localStorage.removeItem('cassino_room_id');
localStorage.removeItem('cassino_player_id');
location.reload();
```

---

## Common Issues & Solutions

### Issue: "Room not found" after refresh
**Solution**: Room may have expired. Create a new room.

### Issue: WebSocket won't connect
**Solution**: 
1. Check backend is running on port 8000
2. Check browser console for errors
3. Verify CORS settings in backend

### Issue: Player 1 still doesn't see Player 2
**Solution**:
1. Check browser console for errors
2. Verify WebSocket is connected (🟢 Connected)
3. Try refreshing Player 1's tab
4. Check backend logs for broadcast messages

### Issue: Ready button doesn't work
**Solution**:
1. Check browser console for API errors
2. Verify player ID is correct
3. Check backend logs for validation errors

---

## Success Criteria Checklist

Before considering testing complete, verify:

- [ ] Player 1 sees Player 2 join in real-time
- [ ] Player 2 sees Player 1 already in room
- [ ] F5 refresh maintains session
- [ ] Ctrl+F5 hard refresh maintains session
- [ ] Ready status syncs between players
- [ ] Leave room clears session properly
- [ ] No undefined/null values in UI
- [ ] No console errors during normal flow
- [ ] WebSocket reconnects after disconnect
- [ ] Multiple refreshes work correctly

---

## Performance Expectations

- **Player join sync**: < 1 second
- **Ready status sync**: < 1 second
- **Page refresh reconnection**: < 3 seconds
- **WebSocket reconnection**: < 5 seconds (with exponential backoff)

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Commit changes to git
2. ✅ Deploy to staging environment
3. ✅ Run tests again on staging
4. ✅ Deploy to production
5. 🔄 Implement next game phase (dealer → round1)

---

**Testing Status**: Ready for manual testing
**Estimated Testing Time**: 15-20 minutes for complete test suite
