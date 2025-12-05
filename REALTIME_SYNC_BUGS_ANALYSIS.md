# Real-Time Synchronization Bugs - Root Cause Analysis

## Date: December 5, 2025

## Executive Summary

Critical real-time synchronization failures have been identified in the Casino Card Game application. The WebSocket communication system is not properly broadcasting state updates, causing players to see stale data and preventing game progression.

## Critical Issues Identified

### Issue #1: WebSocket Broadcast Not Sending Full State
**Severity**: CRITICAL  
**Component**: Backend WebSocket Manager + Main API

**Problem**: 
The backend broadcasts a minimal message `{"type": "game_state_update", "room_id": room.id}` but does NOT include the actual game state data. The frontend expects to receive the full game state in the WebSocket message, but instead receives only a notification that state changed.

**Location**: `backend/main.py` lines 945, 975, 1011, 1165

**Current Code**:
```python
# This only sends a notification, not the actual state!
await manager.broadcast_to_room(
    json.dumps({"type": "game_state_update", "room_id": room.id}), 
    room.id
)
```

**Expected Behavior**:
```python
# Should send the full game state
await manager.broadcast_to_room(
    json.dumps({
        "type": "game_state_update", 
        "room_id": room.id,
        "game_state": game_state_to_response(room).dict()
    }), 
    room.id
)
```

**Impact**: 
- Player ready status not visible to opponent
- Player join events not reflected in real-time
- Game state changes require manual page refresh

---

### Issue #2: Frontend Not Updating State from WebSocket Messages
**Severity**: CRITICAL  
**Component**: Frontend Connection Store

**Problem**:
The frontend's WebSocket message handler in `connectionStore.ts` receives the message but doesn't properly update the game state. When it receives a `game_state_update` message without the actual state data, it tries to fetch from the API as a fallback, but this may not be working correctly.

**Location**: `src/lib/stores/connectionStore.ts` lines 60-90

**Current Code**:
```typescript
if (data.type === 'game_state_update' || data.type === 'state_update') {
    if (data.game_state || data.state) {
        const newState = data.game_state || data.state;
        await gameStore.setGameState(newState);
    } else {
        // Fallback: fetch from API
        try {
            const { getGameState } = await import('$lib/utils/api');
            const response = await getGameState(data.room_id);
            await gameStore.setGameState(response.game_state);
        } catch (err) {
            console.error('Failed to fetch game state:', err);
        }
    }
}
```

**Issue**: The fallback API fetch is happening, but there's no guarantee it completes before the UI tries to render, and errors are silently caught.

---

### Issue #3: Ready Button Not Updating Local State
**Severity**: HIGH  
**Component**: Frontend Main Page

**Problem**:
The ready button in `src/routes/+page.svelte` calls the API but doesn't update the local game state with the response. It relies entirely on the WebSocket broadcast to update the UI, which is broken (see Issue #1).

**Location**: `src/routes/+page.svelte` lines 114-122

**Current Code**:
```typescript
await setPlayerReady($gameStore.roomId, $gameStore.playerId, !currentReady);
// No state update here! Just waits for WebSocket...
```

**Expected Behavior**:
```typescript
const response = await setPlayerReady($gameStore.roomId, $gameStore.playerId, !currentReady);
// Update local state immediately
await gameStore.setGameState(response.game_state);
```

---

### Issue #4: Session Persistence Without Cleanup
**Severity**: MEDIUM  
**Component**: Frontend Game Store

**Problem**:
The application stores `roomId` and `playerId` in localStorage and automatically restores them on page load. When opening a new tab, it tries to reconnect to the old room instead of showing the lobby.

**Location**: `src/lib/stores/gameStore.ts` lines 85-98

**Current Code**:
```typescript
initialize: () => {
    if (typeof localStorage !== 'undefined') {
        const savedRoomId = localStorage.getItem('cassino_room_id');
        const savedPlayerId = localStorage.getItem('cassino_player_id');
        
        if (savedRoomId && savedPlayerId) {
            update((s) => ({ 
                ...s, 
                roomId: savedRoomId,
                playerId: savedPlayerId
            }));
        }
    }
}
```

**Issue**: No validation that the room still exists or that the session is still valid. Should either validate or clear on new tab.

---

### Issue #5: WebSocket Manager Not Using Correct Broadcast Method
**Severity**: CRITICAL  
**Component**: Backend WebSocket Manager

**Problem**:
The `WebSocketConnectionManager` has a method `broadcast_to_room()` that publishes to Redis pub/sub, but the actual local broadcast method `_broadcast_to_local_connections()` is what sends to WebSockets. The Redis subscriber should be calling this, but we need to verify the flow.

**Location**: `backend/websocket_manager.py` lines 145-160

**Analysis Needed**: 
- Is Redis running in development?
- Is the subscriber task started?
- Are messages being published to Redis but not received?

---

### Issue #6: Player Join Not Broadcasting Correctly
**Severity**: HIGH  
**Component**: Backend Join Room Endpoint

**Problem**:
When a player joins a room, the backend broadcasts a `player_joined` event, but this is a different message type than `game_state_update`. The frontend handles `player_joined` by fetching the full state, but this may be racing with the WebSocket connection establishment.

**Location**: `backend/main.py` lines 806-815

**Current Code**:
```python
await manager.broadcast_to_room(
    json.dumps({
        "type": "player_joined",
        "room_id": room.id,
        "player_id": player.id,
        "player_name": player.name,
        "player_count": len(room.players)
    }),
    room.id
)
```

**Issue**: Player 1 may not be connected to WebSocket yet when Player 2 joins, so they miss the broadcast.

---

## Root Cause Summary

The primary root cause is **incomplete WebSocket message payloads**. The backend is sending notification messages without the actual game state data, forcing the frontend to make additional API calls that may fail or race with UI rendering.

Secondary issues include:
1. Frontend not properly handling API responses and updating local state
2. Over-reliance on WebSocket broadcasts instead of optimistic updates
3. Session persistence without validation
4. Potential Redis pub/sub configuration issues in development

## Recommended Fix Priority

1. **CRITICAL**: Fix WebSocket broadcasts to include full game state (Issue #1)
2. **CRITICAL**: Update frontend to handle API responses directly (Issue #3)
3. **HIGH**: Fix player join broadcast timing (Issue #6)
4. **MEDIUM**: Add session validation on page load (Issue #4)
5. **LOW**: Verify Redis pub/sub configuration (Issue #5)

## Testing Requirements

After fixes are applied, test:
1. Two players in different browsers joining a room
2. Player ready status visible to both players in real-time
3. Game start transition when both players ready
4. Page refresh maintains connection
5. New tab shows lobby (not old room)
6. WebSocket reconnection after network interruption

## Next Steps

1. Implement fixes for Issues #1 and #3 (highest priority)
2. Add comprehensive logging to WebSocket message flow
3. Create E2E test for two-player ready flow
4. Verify Redis is running in development environment
5. Add WebSocket message debugging UI component
