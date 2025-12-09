# Quick Testing Guide - Real-time Sync Fixes

## 🚀 Quick 2-Player Test (5 minutes)

### Setup
1. Start backend: `cd backend && python main.py`
2. Start frontend: `npm run dev`
3. Open two browser windows side-by-side

### Test Flow

#### Step 1: Create Room (Player 1)
- Window 1: Enter name "Player1", click "Create Room"
- **✅ Expected**: Room code displayed (e.g., "ABC123")

#### Step 2: Join Room (Player 2)
- Window 2: Enter name "Player2", enter room code, click "Join Room"
- **✅ Expected**: Window 1 immediately shows "Player2 has joined" (no refresh)
- **✅ Expected**: Both windows show both player names correctly

#### Step 3: Ready Up (Player 1)
- Window 1: Click "Ready" button
- **✅ Expected**: Window 1 shows "✓ Ready" for Player1 immediately
- **✅ Expected**: Window 2 shows "✓ Ready" for Player1 immediately (no refresh)

#### Step 4: Ready Up (Player 2)
- Window 2: Click "Ready" button
- **✅ Expected**: Both windows show "✓ Ready" for both players
- **✅ Expected**: Game automatically transitions to "dealer" phase
- **✅ Expected**: Both windows show the game board (no refresh)

### If Something Fails

**Open Browser Console (F12)** and look for:
- Error messages (red text)
- "Ready button clicked" log
- "Full state update received" log
- "Updating game state from WebSocket" log

**Check Backend Terminal** for:
- WebSocket connection messages
- Broadcast messages
- Any error stack traces

## 🔍 Session Isolation Test (2 minutes)

1. Window 1: Create a room, note the room code
2. Open new tab (Window 3)
3. **✅ Expected**: Window 3 shows lobby (not the room from Window 1)
4. **✅ Expected**: Window 1 still shows the room

## ⏰ Session Expiry Test (1 minute)

1. Create a room
2. Open Browser Console (F12)
3. Run: `localStorage.setItem('cassino_session_timestamp', (Date.now() - 25*60*60*1000).toString())`
4. Refresh page
5. **✅ Expected**: Lobby is shown, session cleared
6. **✅ Expected**: Console shows "Session expired, clearing localStorage"

## 🐛 Common Issues & Solutions

### Issue: Player 2 join not visible to Player 1
**Check**: 
- Browser console for WebSocket messages
- Backend terminal for broadcast messages
- Network tab → WS for WebSocket connection

**Solution**: Refresh both windows and try again

### Issue: Ready button doesn't work
**Check**:
- Console for "Ready button clicked" log
- Console for API response
- Backend terminal for player ready messages

**Solution**: Check backend is running on port 8000

### Issue: Game doesn't start after both ready
**Check**:
- Console for "game_state_update" messages
- Backend terminal for phase transition logs
- Both players actually clicked ready

**Solution**: Check WebSocket connection is active

## 📊 Success Criteria

All of these should work without page refresh:

✅ Player 2 joins → Player 1 sees immediately
✅ Player 1 ready → Player 2 sees immediately  
✅ Player 2 ready → Both see game start immediately
✅ Player names display correctly everywhere
✅ New tabs show lobby (not previous room)
✅ Sessions expire after 24 hours

## 🎯 Quick Commands

```bash
# Start backend
cd backend
python main.py

# Start frontend (new terminal)
npm run dev

# Run tests
npm test

# Check TypeScript
npm run check

# Build for production
npm run build
```

## 📝 Notes

- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:5173`
- WebSocket connects to `ws://localhost:8000/ws/{room_id}`
- Sessions expire after 24 hours
- All console logging can be disabled in production

## ✅ Ready for Production When

- [ ] All 6 test scenarios pass
- [ ] No errors in browser console
- [ ] No errors in backend terminal
- [ ] WebSocket messages flowing correctly
- [ ] State syncs in real-time
- [ ] Sessions isolated properly
