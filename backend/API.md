# Casino Card Game API Documentation

## Overview

The Casino Card Game API is a FastAPI-based REST and WebSocket service that provides real-time multiplayer functionality for the classic Casino card game. The API handles room management, game logic, session persistence, and real-time communication between players.

**Base URL:** `https://your-domain.com/api` (production) or `http://localhost:8000` (development)

**API Version:** 1.0.0

## Authentication

The API uses session-based authentication with Redis-backed session tokens. Session tokens are automatically generated when players join rooms and are used for reconnection and state recovery.

### Session Token Format
- Generated using SHA-256 hash of room_id, player_id, and timestamp
- Stored in Redis with 30-minute sliding window TTL
- Passed as query parameter in WebSocket connections: `?session_token=<token>`

## Content Types

- **Request Content-Type:** `application/json`
- **Response Content-Type:** `application/json`
- **WebSocket Messages:** JSON format

## Error Handling

All endpoints return standard HTTP status codes with JSON error responses:

```json
{
  "detail": "Error message",
  "error_code": "optional_error_code"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation error, invalid game state)
- `404` - Not Found (room or player not found)
- `409` - Conflict (version mismatch, concurrent action)
- `500` - Internal Server Error

### Version Conflict Responses (409)
When client version conflicts with server version:

```json
{
  "detail": {
    "error": "version_conflict",
    "message": "Client version 5 is behind server version 8",
    "client_version": 5,
    "server_version": 8,
    "requires_sync": true,
    "has_gap": true,
    "gap_size": 3
  }
}
```

## API Endpoints

### Health and Monitoring

#### GET /health
Health check endpoint with service status.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "database": "connected|disconnected", 
  "redis": "connected|disconnected",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Status Codes:**
- `200` - Service healthy
- `503` - Service degraded or unhealthy

---

#### GET /
API root endpoint.

**Response:**
```json
{
  "message": "Casino Card Game API",
  "version": "1.0.0"
}
```

---

#### GET /api/heartbeat/{room_id}
Get heartbeat status for all players in a room.

**Parameters:**
- `room_id` (path) - Room identifier (6 characters)

**Response:**
```json
{
  "room_id": "ABC123",
  "players": [
    {
      "player_id": 1,
      "last_heartbeat": "2024-01-01T12:00:00Z",
      "seconds_since_heartbeat": 5,
      "is_healthy": true,
      "is_connected": true,
      "disconnected_at": null
    }
  ]
}
```

---

### Room Management

#### POST /rooms/create
Create a new game room.

**Request Body:**
```json
{
  "player_name": "Player Name",
  "ip_address": "192.168.1.1"  // Optional, auto-detected if not provided
}
```

**Validation:**
- `player_name`: 1-50 characters, required
- `ip_address`: Optional, max 45 characters (IPv4/IPv6)

**Response:**
```json
{
  "room_id": "ABC123",
  "player_id": 1,
  "game_state": {
    // Complete GameStateResponse object (see Game State section)
  }
}
```

**Status Codes:**
- `200` - Room created successfully
- `400` - Invalid request data

---

#### POST /rooms/join
Join an existing game room.

**Request Body:**
```json
{
  "room_id": "ABC123",
  "player_name": "Player Name",
  "ip_address": "192.168.1.1"  // Optional
}
```

**Validation:**
- `room_id`: Exactly 6 characters, required
- `player_name`: 1-50 characters, required, must be unique in room
- `ip_address`: Optional, max 45 characters

**Response:**
```json
{
  "player_id": 2,
  "game_state": {
    // Complete GameStateResponse object
  }
}
```

**Status Codes:**
- `200` - Joined successfully
- `400` - Room full or player name taken
- `404` - Room not found

**WebSocket Broadcast:**
Sends `player_joined` event to all connected clients in the room.

---

#### POST /rooms/join-random
Join a random available room or create a new one.

**Request Body:**
```json
{
  "player_name": "Player Name",
  "ip_address": "192.168.1.1"  // Optional
}
```

**Response:**
```json
{
  "player_id": 1,
  "game_state": {
    // Complete GameStateResponse object
  }
}
```

**Behavior:**
- Finds rooms in "waiting" phase with exactly 1 player
- If no rooms available, creates a new room
- If player name conflicts, returns 400 error

---

#### GET /rooms/{room_id}/state
Get current game state for a room.

**Parameters:**
- `room_id` (path) - Room identifier

**Response:**
```json
{
  // Complete GameStateResponse object (see Game State section)
}
```

**Status Codes:**
- `200` - State retrieved successfully
- `404` - Room not found

---

#### POST /rooms/player-ready
Set player ready status.

**Request Body:**
```json
{
  "room_id": "ABC123",
  "player_id": 1,
  "is_ready": true,
  "client_version": 5  // Optional, for conflict detection
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player ready status updated",
  "game_state": {
    // Updated GameStateResponse object
  }
}
```

**Behavior:**
- When both players are ready, automatically transitions to "dealer" phase
- Increments room version number
- Broadcasts game state update to all connected clients

**Status Codes:**
- `200` - Status updated successfully
- `400` - Invalid player or room
- `404` - Room or player not found
- `409` - Version conflict

---

### Game Actions

#### POST /game/start-shuffle
Start the shuffle phase (Player 1 only).

**Request Body:**
```json
{
  "room_id": "ABC123",
  "player_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shuffle started",
  "game_state": {
    // Updated GameStateResponse object
  }
}
```

**Behavior:**
- Sets `shuffle_complete` to true
- Transitions to "dealer" phase
- Increments version and broadcasts update

---

#### POST /game/select-face-up-cards
Deal initial cards and start the game (Player 1 only).

**Request Body:**
```json
{
  "room_id": "ABC123",
  "player_id": 1,
  "card_ids": ["A_hearts", "5_clubs", "9_diamonds", "K_spades"]  // Exactly 4 cards
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cards dealt successfully", 
  "game_state": {
    // Updated GameStateResponse with dealt cards
  }
}
```

**Behavior:**
- Creates and shuffles a new deck
- Deals 4 cards to table, 4 cards to each player
- Transitions to "round1" phase
- Sets `game_started` and `dealing_complete` to true

---

#### POST /game/play-card
Execute a game action (capture, build, or trail).

**Request Body:**
```json
{
  "room_id": "ABC123",
  "player_id": 1,
  "card_id": "A_hearts",
  "action": "capture|build|trail",
  "target_cards": ["5_clubs", "build_1"],  // For capture/build actions
  "build_value": 8,  // For build actions only
  "client_version": 5  // Optional, for conflict detection
}
```

**Validation:**
- `action`: Must be "capture", "build", or "trail"
- `target_cards`: Required for capture/build, array of card/build IDs
- `build_value`: Required for build action, 1-14
- Must be player's turn
- Card must be in player's hand

**Response:**
```json
{
  "success": true,
  "message": "Card played successfully",
  "game_state": {
    // Updated GameStateResponse with new game state
  }
}
```

**Game Logic:**
- **Capture:** Take target cards/builds from table using hand card
- **Build:** Combine hand card with table cards to create a build
- **Trail:** Place hand card on table (no capture possible)

**Behavior:**
- Validates action according to Casino game rules
- Updates player hands, table cards, captured cards, builds
- Switches turns between players
- Handles round completion and final scoring
- Logs action for replay/recovery
- Increments version and broadcasts update

**Status Codes:**
- `200` - Action executed successfully
- `400` - Invalid action, not player's turn, or game not in progress
- `404` - Room or player not found
- `409` - Version conflict

---

#### POST /game/reset
Reset the game to initial state.

**Request Body:**
```json
{
  "room_id": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game reset successfully",
  "game_state": {
    // Reset GameStateResponse object
  }
}
```

**Behavior:**
- Resets all game state to initial values
- Sets phase to "waiting"
- Clears all cards, scores, and ready status
- Increments version number

---

### Session Management

#### GET /api/recovery/{room_id}/{player_id}
Get recovery state for a reconnecting player.

**Parameters:**
- `room_id` (path) - Room identifier
- `player_id` (path) - Player identifier

**Response:**
```json
{
  "game_state": {
    // Current GameStateResponse object
  },
  "missed_actions": [
    {
      "id": "action_123",
      "player_id": 2,
      "action_type": "capture",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "is_your_turn": true,
  "time_disconnected": 120,  // Seconds
  "opponent_status": "connected|disconnected",
  "summary": "You missed 3 actions while disconnected"
}
```

**Status Codes:**
- `200` - Recovery state retrieved
- `404` - Room not found

---

#### POST /api/sync
Synchronize client state with server.

**Request Body:**
```json
{
  "room_id": "ABC123",
  "client_version": 5
}
```

**Response:**
```json
{
  "success": true,
  "current_version": 8,
  "client_version": 5,
  "state": {
    // Full GameStateResponse if full sync needed
  },
  "missing_events": [
    // Array of missed events for incremental sync
  ],
  "requires_full_sync": false,
  "message": "Client synchronized successfully"
}
```

**Sync Strategies:**
- **In Sync:** Client version matches server version
- **Incremental Sync:** Small gap, return missing events
- **Full Sync:** Large gap or events unavailable, return full state

---

#### POST /api/game/claim-victory
Claim victory when opponent has abandoned the game.

**Query Parameters:**
- `room_id` - Room identifier
- `player_id` - Claiming player's ID

**Response:**
```json
{
  "success": true,
  "message": "Victory claimed",
  "winner": 1,
  "game_state": {
    // Updated GameStateResponse with winner set
  }
}
```

**Requirements:**
- Opponent must be disconnected for more than 5 minutes
- Game must be in progress

**Status Codes:**
- `200` - Victory claimed successfully
- `400` - Opponent not disconnected long enough
- `404` - Room not found

---

## WebSocket API

### Connection

#### WS /ws/{room_id}
Real-time WebSocket connection for game updates.

**Connection URL:**
```
ws://localhost:8000/ws/ABC123?session_token=optional_token
```

**Query Parameters:**
- `session_token` (optional) - Session token for reconnection

**Connection Flow:**
1. Client connects to WebSocket endpoint
2. Server validates session token (if provided)
3. Server sends connection confirmation
4. Client can send/receive real-time messages

---

### Message Types

#### Client → Server Messages

**Heartbeat Ping:**
```json
{
  "type": "ping",
  "timestamp": 1640995200000
}
```

**State Update Broadcast:**
```json
{
  "type": "state_update",
  "data": {
    // Any game state data to broadcast
  }
}
```

**Session Takeover:**
```json
{
  "type": "takeover_session"
}
```

**Voice Chat Signaling:**
```json
{
  "type": "voice_offer|voice_answer|voice_ice_candidate|voice_mute_status",
  "data": {
    // WebRTC signaling data
  }
}
```

---

#### Server → Client Messages

**Heartbeat Pong:**
```json
{
  "type": "pong",
  "timestamp": 1640995200000,
  "server_time": 1640995201000
}
```

**Game State Update:**
```json
{
  "type": "game_state_update",
  "room_id": "ABC123",
  "game_state": {
    // Complete GameStateResponse object
  }
}
```

**Player Joined:**
```json
{
  "type": "player_joined",
  "room_id": "ABC123",
  "player_id": 2,
  "player_name": "Player Name",
  "player_count": 2
}
```

**Game Ended:**
```json
{
  "type": "game_ended",
  "reason": "opponent_abandoned|game_completed",
  "winner": 1
}
```

**Session Taken Over:**
```json
{
  "type": "session_taken_over",
  "session_id": "session_123"
}
```

**Error Message:**
```json
{
  "type": "error",
  "code": "no_session|wrong_room|validation_error",
  "message": "Error description"
}
```

**Voice Chat Relay:**
```json
{
  "type": "voice_offer|voice_answer|voice_ice_candidate|voice_mute_status",
  "data": {
    // WebRTC signaling data
  },
  "from_player": "session_123"
}
```

---

## Data Models

### GameStateResponse

Complete game state object returned by most endpoints:

```json
{
  "room_id": "ABC123",
  "players": [
    {
      "id": 1,
      "name": "Player 1",
      "ready": true,
      "joined_at": "2024-01-01T12:00:00Z",
      "ip_address": "192.168.1.1"
    }
  ],
  "phase": "waiting|dealer|round1|round2|finished",
  "round": 1,
  "deck": [
    {
      "id": "A_hearts",
      "suit": "hearts",
      "rank": "A", 
      "value": 14
    }
  ],
  "player1_hand": [],  // Array of card objects
  "player2_hand": [],  // Array of card objects  
  "table_cards": [],   // Array of card objects
  "builds": [
    {
      "id": "build_1",
      "cards": [],  // Array of card objects
      "value": 8,
      "owner": 1
    }
  ],
  "player1_captured": [],  // Array of card objects
  "player2_captured": [],  // Array of card objects
  "player1_score": 0,
  "player2_score": 0,
  "current_turn": 1,
  "card_selection_complete": false,
  "shuffle_complete": false,
  "countdown_start_time": null,
  "game_started": false,
  "last_play": {
    "card_id": "A_hearts",
    "action": "capture",
    "target_cards": ["5_clubs"],
    "build_value": null,
    "player_id": 1
  },
  "last_action": "capture",
  "last_update": "2024-01-01T12:00:00Z",
  "game_completed": false,
  "winner": null,
  "dealing_complete": false,
  "player1_ready": false,
  "player2_ready": false,
  "countdown_remaining": null,
  "version": 5,
  "checksum": "abc123def456"
}
```

### Card Object

```json
{
  "id": "A_hearts",      // Unique identifier: "rank_suit"
  "suit": "hearts",      // hearts, diamonds, clubs, spades
  "rank": "A",          // A, 2-10, J, Q, K
  "value": 14           // Numeric value for game logic (A=14, K=13, Q=12, J=11)
}
```

### Build Object

```json
{
  "id": "build_1",       // Unique identifier
  "cards": [],          // Array of card objects in the build
  "value": 8,           // Build value (sum of cards)
  "owner": 1            // Player ID who created the build
}
```

---

## Game Rules & Logic

### Game Phases
1. **waiting** - Players joining and getting ready
2. **dealer** - Shuffle and card selection phase
3. **round1** - First round of play (4 cards each)
4. **round2** - Second round of play (4 more cards each)
5. **finished** - Game completed, winner determined

### Actions
- **Capture:** Take cards/builds from table that sum to hand card value
- **Build:** Combine hand card with table cards to create a build for later capture
  - **Simple Build:** Drag a card to the table to create a build with just that card's value
  - **Combining Build:** Combine hand card with table cards to create a higher-value build
- **Trail:** Place hand card on table (when no capture/build possible)

### Scoring
- **Aces:** 1 point each
- **Big Casino (2♠):** 1 point
- **Little Casino (10♦):** 2 points
- **Most Cards:** 2 points (player with majority of captured cards)
- **Most Spades:** 2 points (player with majority of spades)

### Winning
- First player to 11 points wins
- Tiebreaker: Most captured cards

---

## Rate Limiting

No explicit rate limiting is implemented, but WebSocket connections are monitored for health:
- Heartbeat expected every 30 seconds
- Connections marked unhealthy after 15 seconds without heartbeat
- Automatic cleanup of abandoned sessions after 5 minutes

---

## Environment Variables

### Required
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string (default: redis://localhost:6379)

### Optional
- `CORS_ORIGINS` - Comma-separated allowed origins (default: *)
- `ROOT_PATH` - API root path prefix for reverse proxy setups
- `SESSION_SECRET_KEY` - Secret for session token signing

---

## Development

### Running Locally
```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis
redis-server

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Testing
```bash
# Run backend tests
python -m pytest

# Run specific test file
python test_api_comprehensive.py
```

---

## Production Deployment

The API is deployed on Render with:
- PostgreSQL managed database
- Redis managed instance
- Automatic deployments from Git
- Health check monitoring at `/health`

### Health Monitoring
- Database connectivity check
- Redis connectivity check
- Overall service status (healthy/degraded/unhealthy)

---

## Changelog

### Version 1.0.0
- Initial API release
- Complete Casino card game implementation
- Session management with Redis
- Real-time WebSocket communication
- State synchronization and recovery
- Voice chat signaling support
- Comprehensive error handling and validation

---

## Support

For API issues or questions:
1. Check the health endpoint: `/health`
2. Review error responses for specific error codes
3. Check WebSocket connection status
4. Verify session token validity for reconnection issues
