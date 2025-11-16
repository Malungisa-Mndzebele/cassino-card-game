# Design Document - Casino Card Game Application

> **📊 Visual Architecture Documentation**: For comprehensive architecture diagrams including component hierarchy, data flow, WebSocket communication, database schema, and deployment architecture, see [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)

## Overview

The Casino Card Game Application is a full-stack real-time multiplayer web application built with React (frontend) and FastAPI (backend). The system uses WebSocket connections for real-time bidirectional communication, SQLAlchemy ORM for database persistence, and follows a component-based architecture with custom React hooks for state management.

### Key Design Principles

1. **Real-Time First**: WebSocket-driven architecture for instant game state synchronization
2. **Separation of Concerns**: Clear boundaries between UI, state management, and business logic
3. **Stateless Backend**: Game state persisted in database, enabling horizontal scaling
4. **Optimistic UI Updates**: Immediate feedback with server reconciliation
5. **Resilient Connections**: Automatic reconnection with session persistence

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Application (Vite)                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  Components  │  │ Custom Hooks │  │  API Client  │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │          │
                    HTTP  │          │  WebSocket
                    REST  │          │  (WSS)
                          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Server                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ REST API     │  │  WebSocket   │  │ Game Logic   │ │ │
│  │  │ Endpoints    │  │  Manager     │  │ Engine       │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │         SQLAlchemy ORM + Database Layer            │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (SQLite / PostgreSQL)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Rooms   │  │ Players  │  │ Sessions │  │  Actions │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```



### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and development server
- TailwindCSS for styling
- Lucide React for icons
- Native WebSocket API for real-time communication

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy ORM
- Uvicorn ASGI server
- Alembic for database migrations
- Pydantic for data validation

**Database:**
- SQLite (development)
- PostgreSQL (production on Fly.io)

**Deployment:**
- Backend: Fly.io with managed PostgreSQL
- Frontend: FTP deployment to production web server
- CI/CD: GitHub Actions

**Testing:**
- Vitest for frontend unit tests
- Playwright for E2E tests
- Pytest for backend tests

## Components and Interfaces

### Frontend Component Hierarchy

```
App.tsx (Root)
├── SoundSystem (Audio management)
├── Decor (Visual decorations)
├── GameSettings (Preferences modal)
├── Statistics Display (Game stats)
├── Error Display (Global errors)
└── Conditional Rendering:
    ├── RoomManager (Not connected)
    │   └── Room creation/join forms
    ├── AppHeader (Connected, not in gameplay)
    │   └── Room info, scores, connection status
    ├── CasinoRoomView (Waiting/Dealer phase)
    │   ├── Player avatars
    │   ├── Ready buttons
    │   └── Shuffle button
    ├── PokerTableView (Round1/Round2 phase)
    │   ├── Dealer component
    │   ├── PlayerHand (Current player)
    │   ├── PlayerHand (Opponent)
    │   ├── Table cards display
    │   ├── Builds display
    │   └── GameActions (Capture/Build/Trail)
    └── GamePhases (Other phases)
        ├── CardSelection phase UI
        ├── Dealing phase UI
        └── Finished phase UI
```



### Custom React Hooks Architecture

The application uses a hook-based architecture for state management and side effects:

**useGameState** - Core game state management
- Manages: roomId, playerId, playerName, gameState, previousGameState
- Methods: extractGameState(), applyResponseState(), isPlayer1(), myScore(), opponentScore()
- Responsibility: Central source of truth for game data

**useConnectionState** - Connection and UI state
- Manages: ws, connectionStatus, error, isLoading, soundReady
- Methods: setWs(), setConnectionStatus(), setError(), setIsLoading(), setSoundReady()
- Responsibility: WebSocket connection lifecycle and UI feedback

**useWebSocket** - WebSocket communication
- Manages: WebSocket connection, message handling, reconnection logic
- Methods: notifyRoomUpdate()
- Responsibility: Real-time bidirectional communication with backend

**useGameActions** - Game action handlers
- Methods: setPlayerReady(), startShuffle(), selectFaceUpCards(), playCard(), resetGame()
- Responsibility: Translate user actions to API calls and state updates

**useRoomActions** - Room management
- Methods: createRoom(), joinRoom(), joinRandomRoom(), disconnectGame()
- Responsibility: Room lifecycle management

**useGamePreferences** - User preferences
- Manages: soundEnabled, soundVolume, hintsEnabled, statisticsEnabled
- Responsibility: Persist user settings in localStorage

**useGameStatistics** - Player statistics
- Manages: gamesPlayed, gamesWon, gamesLost, totalScore, bestScore, winStreaks
- Responsibility: Track and persist player performance metrics

### Backend API Structure

**REST Endpoints:**

```
POST   /rooms/create              - Create new game room
POST   /rooms/join                - Join existing room
POST   /rooms/join-random         - Join random available room
GET    /rooms/{room_id}/state     - Get current game state
POST   /rooms/player-ready        - Set player ready status
POST   /game/start-shuffle        - Initiate deck shuffle
POST   /game/select-face-up-cards - Select initial table cards
POST   /game/play-card            - Execute game action (capture/build/trail)
POST   /game/reset                - Reset game to initial state
GET    /health                    - Health check endpoint
```

**WebSocket Endpoint:**

```
WS     /ws/{room_id}              - Real-time game updates
```

**WebSocket Message Types:**

```typescript
// Server -> Client
{
  type: "game_state_update",
  data: GameState
}

{
  type: "player_joined",
  data: { player_id, player_name }
}

{
  type: "player_ready",
  data: { player_id, ready }
}

{
  type: "error",
  data: { message }
}

// Client -> Server
{
  type: "heartbeat",
  data: { timestamp }
}
```



## Data Models

### Database Schema

**Rooms Table:**
```sql
CREATE TABLE rooms (
    id VARCHAR(6) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'waiting',
    game_phase VARCHAR(20) DEFAULT 'waiting',
    current_turn INTEGER DEFAULT 1,
    round_number INTEGER DEFAULT 0,
    
    -- Game state (JSON)
    deck JSON,
    player1_hand JSON,
    player2_hand JSON,
    table_cards JSON,
    builds JSON,
    player1_captured JSON,
    player2_captured JSON,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    
    -- Flags
    shuffle_complete BOOLEAN DEFAULT FALSE,
    card_selection_complete BOOLEAN DEFAULT FALSE,
    dealing_complete BOOLEAN DEFAULT FALSE,
    game_started BOOLEAN DEFAULT FALSE,
    game_completed BOOLEAN DEFAULT FALSE,
    player1_ready BOOLEAN DEFAULT FALSE,
    player2_ready BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    last_play JSON,
    last_action VARCHAR(50),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    winner INTEGER
);
```

**Players Table:**
```sql
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id VARCHAR(6) REFERENCES rooms(id),
    name VARCHAR(50) NOT NULL,
    ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);
```

**GameSessions Table:**
```sql
CREATE TABLE game_sessions (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(6) REFERENCES rooms(id),
    player_id INTEGER REFERENCES players(id),
    session_token VARCHAR(256) UNIQUE,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    reconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    connection_count INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent VARCHAR(256)
);
```

**GameActionLog Table:**
```sql
CREATE TABLE game_action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id VARCHAR(6) REFERENCES rooms(id),
    player_id INTEGER REFERENCES players(id),
    action_type VARCHAR(50) NOT NULL,
    action_data JSON NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sequence_number INTEGER NOT NULL,
    action_id VARCHAR(64) UNIQUE
);
```



### TypeScript Type Definitions

**Core Game Types:**

```typescript
interface Player {
  id: number
  name: string
  ready: boolean
  joined_at: string
}

interface Card {
  id: string        // Format: "{rank}_{suit}"
  suit: string      // hearts, diamonds, clubs, spades
  rank: string      // A, 2-10, J, Q, K
  value: number     // A=14, K=13, Q=12, J=11, 2-10=numeric
}

interface Build {
  id: string
  cards: Card[]
  value: number
  owner: number     // Player ID who created the build
}

interface GameState {
  roomId: string
  players: Player[]
  phase: GamePhase
  round: number
  deck: Card[]
  player1Hand: Card[]
  player2Hand: Card[]
  tableCards: Card[]
  builds: Build[]
  player1Captured: Card[]
  player2Captured: Card[]
  player1Score: number
  player2Score: number
  currentTurn: number
  cardSelectionComplete: boolean
  shuffleComplete: boolean
  dealingComplete: boolean
  gameStarted: boolean
  gameCompleted: boolean
  player1Ready: boolean
  player2Ready: boolean
  countdownStartTime: string | null
  countdownRemaining: number | null
  lastPlay: any | null
  lastAction: string | null
  lastUpdate: string
  winner: number | null
}

type GamePhase = 
  | 'waiting'        // Waiting for second player
  | 'dealer'         // Both players joined, waiting for ready
  | 'cardSelection'  // Selecting face-up cards (if needed)
  | 'dealing'        // Dealing cards animation
  | 'round1'         // First round of play
  | 'round2'         // Second round of play
  | 'finished'       // Game completed

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

interface GamePreferences {
  soundEnabled: boolean
  soundVolume: number      // 0.0 to 1.0
  hintsEnabled: boolean
  statisticsEnabled: boolean
}

interface GameStatistics {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  totalScore: number
  bestScore: number
  currentWinStreak: number
  longestWinStreak: number
}
```



## Game Logic Engine

### CasinoGameLogic Class

The game logic is encapsulated in a Python class that handles all game mechanics:

**Core Methods:**

```python
class CasinoGameLogic:
    def create_deck() -> List[GameCard]
        # Creates and shuffles a 52-card deck
        
    def deal_initial_cards(deck) -> Tuple[table, p1_hand, p2_hand, remaining]
        # Deals 4 cards to table, 4 to each player
        
    def deal_round_cards(deck, p1_hand, p2_hand) -> Tuple[p1_hand, p2_hand, remaining]
        # Deals 4 more cards to each player for round 2
        
    def validate_capture(hand_card, target_cards, builds) -> bool
        # Validates if a capture move is legal
        
    def validate_build(hand_card, target_cards, build_value, player_hand) -> bool
        # Validates if a build move is legal
        
    def execute_capture(hand_card, target_cards, builds, player_id) -> Tuple[captured, builds, table]
        # Executes a capture and returns updated state
        
    def execute_build(hand_card, target_cards, build_value, player_id) -> Tuple[table, build]
        # Executes a build and returns new build
        
    def execute_trail(hand_card) -> List[GameCard]
        # Executes a trail move
        
    def calculate_score(captured_cards) -> int
        # Calculates score from captured cards
        
    def calculate_bonus_scores(p1_captured, p2_captured) -> Tuple[p1_bonus, p2_bonus]
        # Calculates most cards and most spades bonuses
        
    def determine_winner(p1_score, p2_score, p1_cards, p2_cards) -> Optional[int]
        # Determines winner (1, 2, or None for tie)
```

### Scoring Algorithm

**Base Scoring:**
- Each Ace: 1 point (4 total possible)
- 2 of Spades (Big Casino): 1 point
- 10 of Diamonds (Little Casino): 2 points

**Bonus Scoring (end of game):**
- Most Cards (27+ out of 52): 2 points
- Most Spades (7+ out of 13): 2 points
- Tie in category: 1 point each

**Maximum possible score per game:** 11 points

### Capture Validation Logic

```python
def validate_capture(hand_card, target_cards, builds):
    # 1. Check direct match
    if any(card.value == hand_card.value for card in target_cards):
        return True
    
    # 2. Check sum combinations
    if can_make_value(target_cards, hand_card.value):
        return True
    
    # 3. Check build matches
    if any(build.value == hand_card.value for build in builds):
        return True
    
    return False

def can_make_value(cards, target_value):
    # Try all combinations using bit manipulation
    for i in range(1, 2**len(cards)):
        combination = [cards[j] for j in range(len(cards)) if i & (1 << j)]
        if sum(card.value for card in combination) == target_value:
            return True
    return False
```

### Build Validation Logic

```python
def validate_build(hand_card, target_cards, build_value, player_hand):
    # 1. Can't build same value as hand card
    if hand_card.value == build_value:
        return False
    
    # 2. Must have card to capture the build
    has_capturing_card = any(
        card.value == build_value and card.id != hand_card.id 
        for card in player_hand
    )
    if not has_capturing_card:
        return False
    
    # 3. Target cards must sum to (build_value - hand_card.value)
    needed_value = build_value - hand_card.value
    if needed_value <= 0:
        return False
    
    return can_make_value(target_cards, needed_value)
```



## WebSocket Manager

### Connection Management

The WebSocket manager handles real-time communication between clients and server:

**Backend WebSocket Manager:**

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
    
    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)
```

**Frontend WebSocket Hook:**

```typescript
function useWebSocket({ roomId, ws, setWs, setConnectionStatus, applyResponseState }) {
  useEffect(() => {
    if (!roomId) return
    
    const wsUrl = getWebSocketUrl(roomId)
    const websocket = new WebSocket(wsUrl)
    
    websocket.onopen = () => {
      setConnectionStatus('connected')
      setWs(websocket)
    }
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      applyResponseState(data)
    }
    
    websocket.onerror = () => {
      setConnectionStatus('disconnected')
    }
    
    websocket.onclose = () => {
      setConnectionStatus('disconnected')
      // Attempt reconnection with exponential backoff
      attemptReconnection()
    }
    
    return () => websocket.close()
  }, [roomId])
  
  const notifyRoomUpdate = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'state_request' }))
    }
  }
  
  return { notifyRoomUpdate }
}
```

### Reconnection Strategy

**Exponential Backoff Algorithm:**

```typescript
const reconnectionDelays = [1000, 2000, 4000, 8000, 16000] // milliseconds
let reconnectionAttempt = 0

function attemptReconnection() {
  if (reconnectionAttempt >= reconnectionDelays.length) {
    // Max attempts reached
    setError('Unable to reconnect. Please refresh the page.')
    return
  }
  
  const delay = reconnectionDelays[reconnectionAttempt]
  reconnectionAttempt++
  
  setTimeout(() => {
    // Attempt to reconnect
    connectWebSocket()
  }, delay)
}
```



## Session Management

### Session Token Generation

```python
import secrets
import hashlib
from datetime import datetime

def generate_session_token(room_id: str, player_id: int) -> str:
    """Generate a secure session token"""
    timestamp = datetime.utcnow().isoformat()
    random_bytes = secrets.token_bytes(32)
    
    data = f"{room_id}:{player_id}:{timestamp}:{random_bytes.hex()}"
    token = hashlib.sha256(data.encode()).hexdigest()
    
    return token
```

### Session Persistence Flow

```
1. Player joins room
   ↓
2. Backend creates GameSession record
   ↓
3. Backend generates session_token
   ↓
4. Backend returns session_token to client
   ↓
5. Client stores token in localStorage
   ↓
6. On disconnect, session remains active for 5 minutes
   ↓
7. On reconnect, client sends session_token
   ↓
8. Backend validates token and restores session
   ↓
9. Client receives current game state
```

### Heartbeat Mechanism

**Client-side:**
```typescript
useEffect(() => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  
  const heartbeatInterval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      timestamp: Date.now()
    }))
  }, 30000) // Every 30 seconds
  
  return () => clearInterval(heartbeatInterval)
}, [ws])
```

**Server-side:**
```python
async def handle_heartbeat(session_id: str, db: Session):
    session = db.query(GameSession).filter(
        GameSession.id == session_id
    ).first()
    
    if session:
        session.last_heartbeat = datetime.utcnow()
        db.commit()
```

### Session Cleanup

```python
async def cleanup_expired_sessions(db: Session):
    """Remove sessions inactive for more than 5 minutes"""
    expiry_time = datetime.utcnow() - timedelta(minutes=5)
    
    expired_sessions = db.query(GameSession).filter(
        GameSession.last_heartbeat < expiry_time,
        GameSession.is_active == True
    ).all()
    
    for session in expired_sessions:
        session.is_active = False
        session.disconnected_at = datetime.utcnow()
    
    db.commit()
```



## Error Handling

### Frontend Error Handling

**Error Boundary Pattern:**

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

**API Error Handling:**

```typescript
async function apiCall(endpoint: string, options: RequestInit) {
  try {
    const response = await fetch(endpoint, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Request failed')
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('Network error. Please check your connection.')
    }
    throw error
  }
}
```

### Backend Error Handling

**Custom Exception Classes:**

```python
class GameError(Exception):
    """Base exception for game-related errors"""
    pass

class InvalidMoveError(GameError):
    """Raised when a player attempts an invalid move"""
    pass

class RoomNotFoundError(GameError):
    """Raised when a room doesn't exist"""
    pass

class RoomFullError(GameError):
    """Raised when trying to join a full room"""
    pass
```

**FastAPI Exception Handlers:**

```python
@app.exception_handler(GameError)
async def game_error_handler(request: Request, exc: GameError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

@app.exception_handler(RoomNotFoundError)
async def room_not_found_handler(request: Request, exc: RoomNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": "Room not found"}
    )
```

### Validation Layer

**Pydantic Schemas:**

```python
from pydantic import BaseModel, validator, Field

class CreateRoomRequest(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=50)
    max_players: int = Field(2, ge=2, le=2)
    
    @validator('player_name')
    def sanitize_name(cls, v):
        # Remove special characters
        return ''.join(c for c in v if c.isalnum() or c.isspace())

class PlayCardRequest(BaseModel):
    room_id: str = Field(..., regex=r'^[A-Z0-9]{6}$')
    player_id: int = Field(..., gt=0)
    card_id: str
    action: str = Field(..., regex=r'^(capture|build|trail)$')
    target_cards: List[str] = []
    build_value: Optional[int] = Field(None, ge=2, le=14)
```



## State Management Flow

### Game State Update Flow

```
User Action (e.g., Play Card)
    ↓
useGameActions.playCard()
    ↓
API POST /game/play-card
    ↓
Backend validates move
    ↓
Backend updates database
    ↓
Backend broadcasts to WebSocket
    ↓
All clients receive update
    ↓
useWebSocket.onmessage
    ↓
applyResponseState()
    ↓
React re-renders with new state
```

### Optimistic Updates

For immediate user feedback, the application uses optimistic updates:

```typescript
async function playCard(cardId: string, action: string, targetCards: string[]) {
  // 1. Optimistically update local state
  const optimisticState = calculateOptimisticState(gameState, cardId, action)
  setGameState(optimisticState)
  
  try {
    // 2. Send request to server
    const response = await api.playCard({
      room_id: roomId,
      player_id: playerId,
      card_id: cardId,
      action,
      target_cards: targetCards
    })
    
    // 3. Apply server response (reconciliation)
    applyResponseState(response)
  } catch (error) {
    // 4. Rollback on error
    setGameState(previousGameState)
    setError(error.message)
  }
}
```

### State Reconciliation

When server state differs from client state:

```typescript
function applyResponseState(serverState: GameState) {
  // Compare server state with local state
  if (hasConflict(gameState, serverState)) {
    // Server state always wins
    console.warn('State conflict detected, applying server state')
  }
  
  // Update local state
  setGameState(serverState)
  setPreviousGameState(gameState)
}
```



## Testing Strategy

### Unit Testing

**Frontend (Vitest):**
- Component rendering tests
- Hook behavior tests
- Utility function tests
- State management tests

```typescript
describe('Card Component', () => {
  it('renders card with correct rank and suit', () => {
    const card = { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 14 }
    render(<Card card={card} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('♥')).toBeInTheDocument()
  })
})
```

**Backend (Pytest):**
- Game logic validation
- API endpoint tests
- Database operations
- WebSocket communication

```python
def test_validate_capture():
    logic = CasinoGameLogic()
    hand_card = GameCard('8_hearts', 'hearts', '8', 8)
    table_cards = [
        GameCard('3_spades', 'spades', '3', 3),
        GameCard('5_diamonds', 'diamonds', '5', 5)
    ]
    assert logic.validate_capture(hand_card, table_cards, []) == True
```

### Integration Testing

**Full Game Flow Tests:**
- Room creation and joining
- Game initialization
- Complete round gameplay
- Score calculation
- Winner determination

```typescript
test('complete game flow', async () => {
  // Create room
  const room = await createRoom('Player1')
  
  // Join room
  await joinRoom(room.id, 'Player2')
  
  // Both players ready
  await setPlayerReady(room.id, player1.id, true)
  await setPlayerReady(room.id, player2.id, true)
  
  // Start game
  await startShuffle(room.id)
  
  // Play through rounds
  // ... game actions ...
  
  // Verify winner
  const finalState = await getGameState(room.id)
  expect(finalState.winner).toBeDefined()
})
```

### End-to-End Testing (Playwright)

**Critical User Journeys:**
- Create and join room flow
- Random matchmaking
- Complete game from start to finish
- Reconnection after disconnect
- Mobile responsive behavior

```typescript
test('player can create and join room', async ({ page, context }) => {
  // Player 1 creates room
  await page.goto('/')
  await page.fill('[data-testid="player-name"]', 'Player1')
  await page.click('[data-testid="create-room"]')
  
  const roomCode = await page.textContent('[data-testid="room-code"]')
  
  // Player 2 joins in new tab
  const page2 = await context.newPage()
  await page2.goto('/')
  await page2.fill('[data-testid="player-name"]', 'Player2')
  await page2.fill('[data-testid="room-code"]', roomCode)
  await page2.click('[data-testid="join-room"]')
  
  // Verify both players see each other
  await expect(page.locator('[data-testid="player-list"]')).toContainText('Player2')
  await expect(page2.locator('[data-testid="player-list"]')).toContainText('Player1')
})
```

### Performance Testing

**Load Testing:**
- Concurrent user simulation
- WebSocket connection stress testing
- Database query performance
- API response time monitoring

```typescript
test('handle 100 concurrent games', async () => {
  const games = []
  
  for (let i = 0; i < 100; i++) {
    games.push(createAndPlayGame())
  }
  
  const results = await Promise.all(games)
  
  // Verify all games completed successfully
  expect(results.every(r => r.success)).toBe(true)
  
  // Verify response times
  const avgResponseTime = results.reduce((sum, r) => sum + r.time, 0) / results.length
  expect(avgResponseTime).toBeLessThan(500) // 500ms average
})
```



## Deployment Architecture

### Production Environment

**Backend Deployment (Fly.io):**

```toml
# fly.toml
app = "cassino-game-backend"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"
  DATABASE_URL = "postgresql://..."

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

**Database (Fly.io PostgreSQL):**
- Managed PostgreSQL instance
- Automatic backups
- Connection pooling
- SSL/TLS encryption

**Frontend Deployment:**
- Static build deployed via FTP
- Base path: `/cassino/`
- CDN-ready assets
- Gzip compression

### Environment Configuration

**Development (.env):**
```bash
# Backend
DATABASE_URL=sqlite:///./test_casino_game.db
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**Production (.env):**
```bash
# Backend (Fly.io)
DATABASE_URL=postgresql://user:pass@host:5432/db
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://khasinogaming.com

# Frontend (Build-time)
VITE_API_URL=https://cassino-game-backend.fly.dev
VITE_WS_URL=wss://cassino-game-backend.fly.dev
```

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: Deploy Backend

on:
  push:
    branches: [master]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Run Migrations
        run: flyctl ssh console -C "cd /app && python -m alembic upgrade head"
```

### Monitoring and Logging

**Application Logging:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s")
    
    return response
```

**Health Monitoring:**
```python
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Check database connection
        db.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )
```



## Security Considerations

### Input Validation

**Frontend Validation:**
- Room code format validation (6 alphanumeric characters)
- Player name length limits (1-50 characters)
- Card ID format validation
- Action type validation (capture/build/trail)

**Backend Validation:**
- Pydantic schema validation for all requests
- SQL injection prevention via ORM
- XSS prevention via input sanitization
- CSRF protection for state-changing operations

### Authentication and Authorization

**Session-Based Security:**
```python
def verify_player_session(room_id: str, player_id: int, session_token: str, db: Session):
    session = db.query(GameSession).filter(
        GameSession.room_id == room_id,
        GameSession.player_id == player_id,
        GameSession.session_token == session_token,
        GameSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check session expiry
    if session.last_heartbeat < datetime.utcnow() - timedelta(minutes=5):
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session
```

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://khasinogaming.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/rooms/create")
@limiter.limit("10/minute")
async def create_room(request: Request, data: CreateRoomRequest):
    # Room creation logic
    pass
```

### Data Privacy

- No personally identifiable information stored
- Player names are user-provided and not verified
- IP addresses stored for rate limiting only
- Session tokens are hashed and not reversible
- No tracking or analytics beyond game statistics



## Performance Optimization

### Frontend Optimizations

**Code Splitting:**
```typescript
// Lazy load components
const PokerTableView = lazy(() => import('./components/PokerTableView'))
const GamePhases = lazy(() => import('./components/GamePhases'))

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <PokerTableView {...props} />
</Suspense>
```

**Memoization:**
```typescript
// Memoize expensive calculations
const sortedCards = useMemo(() => {
  return cards.sort((a, b) => a.value - b.value)
}, [cards])

// Memoize callbacks
const handleCardClick = useCallback((cardId: string) => {
  playCard(cardId, 'capture', [])
}, [playCard])

// Memoize components
const Card = memo(({ card, onClick }) => {
  return <div onClick={() => onClick(card.id)}>{card.rank}</div>
})
```

**Virtual Scrolling:**
For large lists (if needed in future features):
```typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

### Backend Optimizations

**Database Query Optimization:**
```python
# Eager loading to prevent N+1 queries
room = db.query(Room).options(
    joinedload(Room.players)
).filter(Room.id == room_id).first()

# Indexing for fast lookups
class Room(Base):
    __tablename__ = "rooms"
    id = Column(String(6), primary_key=True, index=True)
    status = Column(String(20), index=True)
    game_phase = Column(String(20), index=True)
```

**Connection Pooling:**
```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
```

**Caching Strategy:**
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def calculate_possible_captures(hand_card_value: int, table_card_values: tuple):
    # Expensive calculation cached
    return find_combinations(hand_card_value, table_card_values)
```

### Asset Optimization

**Image Optimization:**
- SVG for card suits and icons
- WebP format for raster images
- Lazy loading for below-fold images
- Responsive images with srcset

**Bundle Optimization:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
})
```



## Accessibility Design

### Keyboard Navigation

**Focus Management:**
```typescript
// Trap focus in modal dialogs
function GameSettings({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isOpen) return
    
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements?.[0] as HTMLElement
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement
    
    firstElement?.focus()
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
    
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])
  
  return <div ref={modalRef} role="dialog" aria-modal="true">...</div>
}
```

**Keyboard Shortcuts:**
- Enter: Confirm action
- Escape: Close modal/cancel
- Arrow keys: Navigate cards
- Space: Select card
- Tab: Navigate interactive elements

### Screen Reader Support

**ARIA Labels:**
```typescript
<button
  aria-label={`Play ${card.rank} of ${card.suit}`}
  aria-pressed={isSelected}
  onClick={() => selectCard(card.id)}
>
  <Card card={card} />
</button>

<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {lastAction && `${playerName} ${lastAction}`}
</div>

<div
  role="region"
  aria-label="Game table"
  aria-describedby="table-description"
>
  <p id="table-description" className="sr-only">
    Table contains {tableCards.length} cards available for capture
  </p>
  {tableCards.map(card => <Card key={card.id} card={card} />)}
</div>
```

**Screen Reader Only Text:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Color Contrast

**WCAG 2.1 AA Compliance:**
- Text contrast ratio: 4.5:1 minimum
- Large text contrast ratio: 3:1 minimum
- Interactive elements: Clear focus indicators
- Color not sole indicator: Use icons + text

```css
/* High contrast focus indicators */
button:focus-visible {
  outline: 3px solid #FFD700;
  outline-offset: 2px;
}

/* Sufficient color contrast */
.text-primary {
  color: #FFFFFF; /* White on dark background */
}

.text-error {
  color: #FF6B6B; /* Red with sufficient contrast */
}
```

### Responsive Text Sizing

```css
/* Support browser zoom up to 200% */
html {
  font-size: 16px;
}

@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}

/* Use rem units for scalability */
.card-rank {
  font-size: 1.5rem; /* 24px at base size */
}

.button-text {
  font-size: 1rem; /* 16px at base size */
}
```



## Mobile Responsiveness

### Responsive Breakpoints

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px'  // Extra large
    }
  }
}
```

### Touch Optimization

**Touch Target Sizing:**
```css
/* Minimum 44x44px touch targets */
.card-button {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
}

/* Increase spacing on mobile */
@media (max-width: 768px) {
  .card-grid {
    gap: 1rem;
  }
}
```

**Touch Gestures:**
```typescript
// Prevent double-tap zoom
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

// Handle touch events
function Card({ card, onSelect }) {
  const handleTouch = (e: TouchEvent) => {
    e.preventDefault()
    onSelect(card.id)
  }
  
  return (
    <div
      onTouchEnd={handleTouch}
      onClick={() => onSelect(card.id)}
    >
      {card.rank}
    </div>
  )
}
```

### Responsive Layouts

**Adaptive Grid:**
```css
/* Desktop: 2-column layout */
.game-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* Tablet: Single column */
@media (max-width: 1024px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .game-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}
```

**Responsive Card Sizing:**
```typescript
function useCardSize() {
  const [cardSize, setCardSize] = useState('large')
  
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      if (width < 640) setCardSize('small')
      else if (width < 1024) setCardSize('medium')
      else setCardSize('large')
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  
  return cardSize
}
```



## Sound System Design

### Audio Architecture

**Sound Manager Singleton:**
```typescript
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private masterVolume: number = 1.0
  
  loadSound(name: string, url: string) {
    const audio = new Audio(url)
    audio.preload = 'auto'
    this.sounds.set(name, audio)
  }
  
  playSound(name: string, volume: number = 1.0) {
    const sound = this.sounds.get(name)
    if (!sound) return
    
    sound.volume = volume * this.masterVolume
    sound.currentTime = 0
    sound.play().catch(err => console.warn('Audio play failed:', err))
  }
  
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }
  
  stopAll() {
    this.sounds.forEach(sound => {
      sound.pause()
      sound.currentTime = 0
    })
  }
}

export const soundManager = new SoundManager()
```

**Sound Events:**
- Card shuffle: Shuffle sound effect
- Card deal: Deal sound effect
- Card capture: Capture sound effect
- Build created: Build sound effect
- Trail: Trail sound effect
- Game start: Start fanfare
- Game end: End fanfare
- Turn change: Subtle notification
- Error: Error beep

### Audio Preloading

```typescript
function SoundSystem({ onSoundReady }) {
  useEffect(() => {
    const sounds = [
      { name: 'shuffle', url: '/sounds/shuffle.mp3' },
      { name: 'deal', url: '/sounds/deal.mp3' },
      { name: 'capture', url: '/sounds/capture.mp3' },
      { name: 'build', url: '/sounds/build.mp3' },
      { name: 'trail', url: '/sounds/trail.mp3' },
      { name: 'gameStart', url: '/sounds/game-start.mp3' },
      { name: 'gameEnd', url: '/sounds/game-end.mp3' },
      { name: 'error', url: '/sounds/error.mp3' }
    ]
    
    sounds.forEach(({ name, url }) => {
      soundManager.loadSound(name, url)
    })
    
    onSoundReady()
  }, [onSoundReady])
  
  return null
}
```

## Design Patterns Used

### Frontend Patterns

**Custom Hooks Pattern:**
- Encapsulate stateful logic
- Promote reusability
- Separate concerns

**Component Composition:**
- Small, focused components
- Props-based configuration
- Children pattern for flexibility

**Render Props:**
- Share code between components
- Inversion of control
- Flexible rendering

**Higher-Order Components:**
- Cross-cutting concerns
- Code reuse
- Props manipulation

### Backend Patterns

**Repository Pattern:**
- Abstract data access
- Testable business logic
- Database independence

**Service Layer:**
- Business logic encapsulation
- Transaction management
- Orchestration

**Dependency Injection:**
- Loose coupling
- Testability
- Configuration flexibility

**Factory Pattern:**
- Object creation abstraction
- Centralized instantiation
- Type safety

## Future Enhancements

### Planned Features

1. **AI Opponent System** (Medium Priority)
   - Multiple difficulty levels
   - Strategic decision-making
   - Practice mode

2. **Tournament System** (Medium Priority)
   - ELO-based matchmaking
   - Bracket tournaments
   - Leaderboards

3. **Spectator Mode** (Low Priority)
   - Watch ongoing games
   - Replay system
   - Share game links

4. **Enhanced Analytics** (Low Priority)
   - Detailed game statistics
   - Move history
   - Performance insights

5. **Social Features** (Low Priority)
   - Friend system
   - Chat functionality
   - Player profiles

### Technical Debt

- Migrate to TypeScript for backend
- Implement comprehensive error tracking (Sentry)
- Add Redis for session caching
- Implement rate limiting per user
- Add database query monitoring
- Optimize WebSocket message size
- Implement progressive web app features
- Add offline mode support

## Conclusion

This design document provides a comprehensive overview of the Casino Card Game Application architecture, covering frontend and backend components, data models, communication protocols, security measures, testing strategies, deployment configuration, and performance optimizations. The design emphasizes real-time communication, state management, user experience, and scalability while maintaining code quality and maintainability.
