# UI Testing Guide for Casino Card Game

## 🎮 Testing the Deployed Game on Fly.io

This guide will help you test the fully deployed game using the UI.

---

## Prerequisites

1. **Backend deployed on Fly.io**: `https://cassino-game-backend.fly.dev`
2. **Frontend running** (local or deployed)
3. **Two browsers/incognito windows** (for multiplayer testing)

---

## Step 1: Verify Backend is Running

### Check Health Endpoint

Visit in browser:
```
https://cassino-game-backend.fly.dev/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "Casino Card Game Backend is running"
}
```

### Check API Documentation

Visit:
```
https://cassino-game-backend.fly.dev/docs
```

You should see the Swagger UI with all available endpoints.

---

## Step 2: Configure Frontend

### Set Backend URL

Create or update `.env` in project root:

```env
VITE_API_URL=https://cassino-game-backend.fly.dev
```

Or for local development:
```env
VITE_API_URL=http://localhost:8000
```

### Start Frontend

```bash
# Development mode
npm run dev

# Or production build
npm run build
npm run preview
```

---

## Step 3: Test Game Flow

### Test 1: Create a Room (Player 1)

1. **Open Browser Window 1** (Player 1)
2. Navigate to your frontend URL (e.g., `http://localhost:5173`)
3. Click "Create Room" or "New Game"
4. Enter player name (e.g., "Alice")
5. **Expected**: 
   - Room ID displayed
   - Waiting screen shown
   - "Waiting for player 2" message

### Test 2: Join Room (Player 2)

1. **Open Browser Window 2** (Player 2) - **Incognito mode recommended**
2. Navigate to same frontend URL
3. Click "Join Room" or "Join Game"
4. Enter the room ID from Step 1
5. Enter player name (e.g., "Bob")
6. **Expected**:
   - Both players shown in room
   - Both players can see each other
   - Ready button appears

### Test 3: Ready Up

1. **In Browser 1** (Player 1):
   - Click "Ready" button
   - **Expected**: Button changes to "Waiting..." or shows ready status

2. **In Browser 2** (Player 2):
   - Click "Ready" button
   - **Expected**: Both players ready, game starts (or countdown begins)

### Test 4: Game Initialization

**Expected after both ready:**
- Dealer phase begins (cards being dealt)
- Each player sees their cards
- Table cards are displayed
- Game phase indicator shows current phase

### Test 5: Card Selection Phase

1. **In both browsers**:
   - Players select cards from their hand
   - Click "Select Cards" or confirm selection
   - **Expected**: Selected cards move to appropriate position
   - Game proceeds to next phase

### Test 6: Gameplay - Play Cards

1. **Player 1's turn**:
   - Select a card from hand
   - Choose action:
     - **Capture**: Select matching cards from table
     - **Build**: Create a build combination
     - **Trail**: Place card on table
   - Click to execute action
   - **Expected**: 
     - Card played successfully
     - Game state updates for both players
     - Turn switches to Player 2

2. **Player 2's turn**:
   - Same process
   - **Expected**: Turn alternates correctly

### Test 7: Real-time Updates (WebSocket)

**What to test:**
- Play a card in Browser 1
- **Expected**: Browser 2 shows the update immediately (without refresh)
- Player 2's cards should update
- Scores should update
- Game state should sync

### Test 8: Scoring

**Play through a round and verify:**
- Scores calculate correctly
- Points from:
  - Aces captured
  - 2 of Spades
  - 10 of Diamonds
  - Most cards
  - Most spades
- Score display updates after each round

### Test 9: Game Completion

**Play until someone reaches 11 points:**
- Winner announcement displayed
- Game over screen shown
- Option to play again or reset

---

## Step 4: Check Browser Console

### Open Developer Tools

In both browser windows, press `F12` and check:

1. **Console Tab**:
   - No error messages (red errors)
   - API calls logged (green/blue)
   - WebSocket connections successful

2. **Network Tab**:
   - API calls to `cassino-game-backend.fly.dev`
   - Responses are 200 OK
   - WebSocket connection established (WS upgrade)

---

## Step 5: Verify API Calls

### Expected API Calls

When testing, you should see these calls:

1. **Create Room**: `POST /rooms/create`
2. **Join Room**: `POST /rooms/join`
3. **Set Ready**: `POST /rooms/player-ready`
4. **Get Game State**: `GET /rooms/{room_id}/state`
5. **Start Shuffle**: `POST /game/start-shuffle`
6. **Select Cards**: `POST /game/select-face-up-cards`
7. **Play Card**: `POST /game/play-card`
8. **WebSocket**: `WS /ws/{room_id}`

---

## Step 6: Test Error Handling

### Test Scenarios

1. **Invalid Room ID**:
   - Try to join non-existent room
   - **Expected**: Error message displayed

2. **Full Room**:
   - Try to join room with 2 players already
   - **Expected**: Error message

3. **Network Error**:
   - Disconnect internet briefly
   - **Expected**: Error message, reconnection attempt

4. **Invalid Actions**:
   - Try to play card when not your turn
   - **Expected**: Error message

---

## Step 7: Performance Testing

### Load Test

1. Create multiple rooms simultaneously
2. Have multiple players join
3. **Expected**: All games work independently
4. **Check**: No lag or timeouts

### WebSocket Stability

1. Leave game running for extended period
2. Play multiple rounds
3. **Expected**: WebSocket stays connected
4. **Check**: No disconnections or errors

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"

**Solution:**
- Check backend is running: `flyctl status`
- Verify URL in `.env`: `VITE_API_URL=https://cassino-game-backend.fly.dev`
- Check CORS settings in backend

### Issue: "WebSocket connection failed"

**Solution:**
- Verify WebSocket endpoint: `wss://cassino-game-backend.fly.dev/ws/{room_id}`
- Check Fly.io logs: `flyctl logs`
- Ensure WebSocket support is enabled

### Issue: "Database error" or "Table not found"

**Solution:**
- Run database migrations:
  ```bash
  flyctl ssh console
  cd /app
  python -m alembic upgrade head
  ```

### Issue: Updates not syncing between players

**Solution:**
- Check WebSocket connection in browser console
- Verify both players are in same room
- Check backend logs for WebSocket errors

---

## ✅ Testing Checklist

- [ ] Backend health check returns 200 OK
- [ ] Can create a room
- [ ] Can join room with room ID
- [ ] Both players appear in room
- [ ] Ready button works for both players
- [ ] Game starts when both ready
- [ ] Cards are dealt correctly
- [ ] Players can select cards
- [ ] Players can play cards (capture/build/trail)
- [ ] Turn alternates correctly
- [ ] Game state updates in real-time (WebSocket)
- [ ] Scores calculate correctly
- [ ] Game completes when player reaches 11 points
- [ ] Winner is announced correctly
- [ ] Can reset/start new game
- [ ] No console errors
- [ ] WebSocket stays connected
- [ ] Multiple rooms work simultaneously

---

## 🎯 Quick Test Command

Test the backend API directly:

```bash
# Health check
curl https://cassino-game-backend.fly.dev/health

# Create room
curl -X POST https://cassino-game-backend.fly.dev/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"player_name": "Test Player"}'

# Get room state (replace ROOM_ID)
curl https://cassino-game-backend.fly.dev/rooms/ROOM_ID/state
```

---

## 📊 Expected Game Flow

1. **Lobby** → Create/Join Room
2. **Waiting** → Both players join, ready up
3. **Dealer** → Cards dealt, face-up cards selected
4. **Round 1** → Players take turns playing cards
5. **Round 2** → Second round with new cards
6. **Scoring** → Points calculated
7. **Game Over** → Winner announced or continue to next round
8. **Repeat** → Until someone reaches 11 points

---

**Happy Testing! 🎮**

If you encounter any issues, check:
- Browser console (F12)
- Fly.io logs: `flyctl logs`
- Backend health: `https://cassino-game-backend.fly.dev/health`
- API docs: `https://cassino-game-backend.fly.dev/docs`
