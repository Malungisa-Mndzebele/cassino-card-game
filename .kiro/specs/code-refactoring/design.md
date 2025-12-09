# Design Document

## Overview

This design document outlines the refactoring strategy for the Casino Card Game codebase. The refactoring aims to improve code organization, maintainability, and testability without changing any external behavior or functionality. The work is organized into backend refactoring, frontend refactoring, and cross-cutting improvements.

The refactoring follows these principles:
- **Behavior Preservation**: No changes to external APIs or user-facing functionality
- **Incremental Implementation**: Each refactoring can be deployed independently
- **Test-Driven**: Existing tests must pass; new tests added for improved code
- **Dependency Injection**: Explicit dependencies rather than global state
- **Single Responsibility**: Each module/class has one clear purpose

## Architecture

### Current Architecture Issues

**Backend:**
- `main.py` contains 1000+ lines mixing routing, business logic, and data access
- Multiple validator files with overlapping functionality
- Inconsistent error response formats across endpoints
- Environment variables scattered throughout code
- Test setup code duplicated across test files

**Frontend:**
- Multiple stores managing overlapping concerns (gameStore, syncState, optimisticState, actionQueue)
- Large components exceeding 300 lines (RoomManager, GameTable)
- API calls scattered throughout stores with inconsistent error handling
- Type definitions duplicated across files

### Target Architecture

**Backend:**
```
backend/
├── main.py                    # Routing only (< 300 lines)
├── config.py                  # Centralized configuration
├── exceptions.py              # Custom exception classes
├── middleware/
│   └── error_handler.py       # Global error handling
├── services/
│   ├── room_service.py        # Room management logic
│   ├── game_service.py        # Game action logic
│   ├── player_service.py      # Player management logic
│   └── websocket_service.py   # WebSocket message handling
├── validation/
│   ├── game_validators.py     # Game action validation
│   ├── state_validators.py    # State integrity validation
│   ├── input_validators.py    # Request input validation
│   └── security_validators.py # Security checks
└── tests/
    ├── fixtures.py            # Shared test fixtures
    └── ...
```

**Frontend:**
```
src/lib/
├── stores/
│   └── game/
│       ├── index.ts           # Public API
│       ├── gameState.svelte.ts # Composed game state
│       ├── sync.svelte.ts     # Sync management
│       ├── optimistic.svelte.ts # Optimistic updates
│       └── queue.svelte.ts    # Action queue
├── components/
│   ├── room/
│   │   ├── RoomList.svelte
│   │   ├── RoomCreator.svelte
│   │   ├── RoomJoiner.svelte
│   │   └── RoomCard.svelte
│   └── game/
│       ├── GameBoard.svelte
│       ├── PlayerArea.svelte
│       ├── TableArea.svelte
│       ├── ActionPanel.svelte
│       └── ScoreBoard.svelte
├── api/
│   └── client.ts              # Centralized API client
└── types/
    ├── index.ts               # Public API
    ├── game.ts                # Game types
    ├── player.ts              # Player types
    ├── room.ts                # Room types
    └── api.ts                 # API types
```

## Components and Interfaces

### Backend Service Layer

#### RoomService
```python
class RoomService:
    """Handles room creation, joining, and state management"""
    
    def __init__(
        self,
        db: Session,
        cache_manager: CacheManager,
        game_logic: CasinoGameLogic
    ):
        self.db = db
        self.cache = cache_manager
        self.game_logic = game_logic
    
    def create_room(
        self,
        request: CreateRoomRequest,
        player_ip: str,
        user_agent: str
    ) -> Tuple[Room, Player]:
        """Create new room with initial player"""
        pass
    
    def join_room(
        self,
        request: JoinRoomRequest,
        player_ip: str,
        user_agent: str
    ) -> Tuple[Room, Player]:
        """Join existing room"""
        pass
    
    def get_room_state(self, room_id: str) -> Room:
        """Get current room state with caching"""
        pass
```

#### GameService
```python
class GameService:
    """Handles game actions and state updates"""
    
    def __init__(
        self,
        db: Session,
        cache_manager: CacheManager,
        game_logic: CasinoGameLogic,
        action_logger: ActionLogger
    ):
        self.db = db
        self.cache = cache_manager
        self.game_logic = game_logic
        self.action_logger = action_logger
    
    def play_card(
        self,
        request: PlayCardRequest,
        room: Room
    ) -> GameState:
        """Execute card play action"""
        pass
    
    def start_shuffle(
        self,
        request: StartShuffleRequest,
        room: Room
    ) -> GameState:
        """Start shuffle phase"""
        pass
```

#### PlayerService
```python
class PlayerService:
    """Handles player management"""
    
    def __init__(
        self,
        db: Session,
        cache_manager: CacheManager
    ):
        self.db = db
        self.cache = cache_manager
    
    def set_player_ready(
        self,
        player_id: str,
        room_id: str,
        is_ready: bool
    ) -> Player:
        """Set player ready status"""
        pass
    
    def get_player(self, player_id: str) -> Player:
        """Get player with caching"""
        pass
```

#### WebSocketService
```python
class WebSocketService:
    """Handles WebSocket message routing"""
    
    def __init__(
        self,
        websocket_manager: WebSocketManager,
        game_service: GameService,
        player_service: PlayerService
    ):
        self.ws_manager = websocket_manager
        self.game_service = game_service
        self.player_service = player_service
    
    async def handle_message(
        self,
        message: dict,
        room_id: str,
        player_id: str
    ) -> None:
        """Route WebSocket message to appropriate handler"""
        pass
```

### Validation Module

```python
# validation/game_validators.py
class GameActionValidator:
    """Validates game actions"""
    
    def validate_card_play(
        self,
        card: Card,
        player_hand: List[Card],
        table_cards: List[Card]
    ) -> ValidationResult:
        """Validate card play is legal"""
        pass

# validation/state_validators.py
class StateValidator:
    """Validates state integrity"""
    
    def validate_game_state(
        self,
        state: GameState
    ) -> ValidationResult:
        """Validate state is consistent"""
        pass

# validation/input_validators.py
class InputValidator:
    """Validates request inputs"""
    
    def validate_player_name(
        self,
        name: str
    ) -> ValidationResult:
        """Validate player name format"""
        pass

# validation/security_validators.py
class SecurityValidator:
    """Validates security constraints"""
    
    def validate_turn_ownership(
        self,
        player_id: str,
        game_state: GameState
    ) -> ValidationResult:
        """Validate player owns current turn"""
        pass
```

### Error Handling

```python
# exceptions.py
class GameError(Exception):
    """Base exception for game errors"""
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code

class InvalidMoveError(GameError):
    """Invalid game move"""
    def __init__(self, message: str):
        super().__init__(message, "INVALID_MOVE", 400)

class RoomNotFoundError(GameError):
    """Room not found"""
    def __init__(self, room_id: str):
        super().__init__(f"Room {room_id} not found", "ROOM_NOT_FOUND", 404)

class UnauthorizedActionError(GameError):
    """Unauthorized action"""
    def __init__(self, message: str):
        super().__init__(message, "UNAUTHORIZED", 403)

# middleware/error_handler.py
@app.exception_handler(GameError)
async def game_error_handler(request: Request, exc: GameError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "code": exc.code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

### Configuration Management

```python
# config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_ttl_session: int = 1800
    redis_ttl_game_state: int = 300
    redis_ttl_player: int = 1800
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]
    
    # Security
    session_secret_key: str
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    root_path: str = ""
    
    # Background Tasks
    heartbeat_interval: int = 30
    session_cleanup_interval: int = 300
    abandoned_game_check_interval: int = 600
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### Frontend Store Consolidation

```typescript
// stores/game/index.ts
export { gameState, useGameActions } from './gameState.svelte';

// stores/game/gameState.svelte.ts
import { syncState } from './sync.svelte';
import { optimisticState } from './optimistic.svelte';
import { actionQueue } from './queue.svelte';

class GameStateManager {
    // Composed state from all sub-managers
    state = $derived({
        ...syncState.state,
        optimistic: optimisticState.state,
        pendingActions: actionQueue.pending,
        isDesync: syncState.isDesync
    });
    
    // Unified actions
    async playCard(card: Card, action: GameAction) {
        // 1. Add to action queue
        actionQueue.enqueue({ type: 'play_card', card, action });
        
        // 2. Apply optimistic update
        optimisticState.applyOptimistic(card, action);
        
        // 3. Send to server
        try {
            const response = await api.playCard({ card, action });
            
            // 4. Update sync state
            syncState.updateFromServer(response);
            
            // 5. Clear optimistic update
            optimisticState.clearOptimistic();
            
            // 6. Remove from queue
            actionQueue.dequeue();
        } catch (error) {
            // Rollback optimistic update
            optimisticState.rollback();
            actionQueue.markFailed();
            throw error;
        }
    }
}

export const gameState = new GameStateManager();
```

### API Client

```typescript
// api/client.ts
interface RequestOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}

interface RetryConfig {
    maxRetries: number;
    backoff: number;
}

class ApiClient {
    private baseUrl: string;
    private retryConfig: RetryConfig = { maxRetries: 3, backoff: 1000 };
    
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }
    
    async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    body: options.body ? JSON.stringify(options.body) : undefined
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new ApiError(error.error, error.code, response.status);
                }
                
                return await response.json();
            } catch (error) {
                lastError = error as Error;
                
                // Don't retry on client errors (4xx)
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    throw error;
                }
                
                // Wait before retry
                if (attempt < this.retryConfig.maxRetries) {
                    await this.sleep(this.retryConfig.backoff * Math.pow(2, attempt));
                }
            }
        }
        
        throw lastError!;
    }
    
    // Typed methods
    async createRoom(playerName: string): Promise<CreateRoomResponse> {
        return this.request('/rooms/create', {
            method: 'POST',
            body: { player_name: playerName, max_players: 2 }
        });
    }
    
    async playCard(data: PlayCardRequest): Promise<GameStateResponse> {
        return this.request('/game/play-card', {
            method: 'POST',
            body: data
        });
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class ApiError extends Error {
    constructor(
        message: string,
        public code: string,
        public status: number
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const api = new ApiClient(API_URL);
```

## Data Models

No changes to data models. All database schemas, Pydantic models, and TypeScript interfaces remain unchanged. The refactoring only reorganizes code structure and improves internal architecture.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, most requirements focus on code organization and structure rather than testable functional behavior. The key insight is that refactoring is primarily about **behavior preservation** - ensuring the system works identically before and after changes.

The testable properties fall into three categories:
1. **Error Response Consistency** - All errors follow a standard format
2. **API Client Reliability** - Retry logic and error transformation work correctly
3. **Behavior Preservation** - All functionality remains identical after refactoring

Many criteria related to code organization (service layer extraction, validator consolidation, component decomposition, etc.) are structural requirements that will be verified through code review rather than automated testing.

### Testable Properties

**Property 1: Error response consistency**
*For any* error condition in the backend, the error response should contain a JSON object with `message`, `code`, and `timestamp` fields of the correct types
**Validates: Requirements 3.1**

**Property 2: Game rule violation errors**
*For any* game rule violation, the backend should return a 400 status code with an error code field
**Validates: Requirements 3.2**

**Property 3: Resource not found errors**
*For any* request for a non-existent resource, the backend should return a 404 status code with an error code field
**Validates: Requirements 3.3**

**Property 4: Internal error responses**
*For any* internal server error, the backend should return a 500 status code with an error code field
**Validates: Requirements 3.4**

**Property 5: Custom exception transformation**
*For any* custom exception type raised in the backend, it should be automatically transformed into the standard error response format with message, code, and timestamp
**Validates: Requirements 3.5**

**Property 6: API retry with exponential backoff**
*For any* API request that fails due to network issues, the frontend API client should retry the request with exponentially increasing delays (1s, 2s, 4s, etc.) up to the maximum retry count
**Validates: Requirements 8.2**

**Property 7: API error transformation**
*For any* error response from the backend API, the frontend API client should transform it into a consistent ApiError format with message, code, and status
**Validates: Requirements 8.3**

**Property 8: Backend API behavior preservation**
*For any* API endpoint and any valid request, the response after refactoring should be identical to the response before refactoring
**Validates: Requirements 11.1**

**Property 9: Frontend functionality preservation**
*For any* user interaction flow, the behavior after refactoring should be identical to the behavior before refactoring
**Validates: Requirements 11.2**

**Property 10: Backend test suite preservation**
*For any* refactoring change, all existing backend tests should pass without modification
**Validates: Requirements 11.3**

**Property 11: Frontend test suite preservation**
*For any* refactoring change, all existing frontend tests should pass without modification
**Validates: Requirements 11.4**

**Property 12: WebSocket message format preservation**
*For any* WebSocket message type, the message format after refactoring should be identical to the format before refactoring
**Validates: Requirements 11.5**

### Examples (Edge Cases)

**Example 1: Missing required configuration**
When the backend starts with a missing required configuration value (e.g., DATABASE_URL), it should fail to start and report which configuration value is missing
**Validates: Requirements 4.3**

**Example 2: Deployable state after refactoring**
When a refactoring task is completed, running the full test suite and deployment process should succeed without errors
**Validates: Requirements 12.1**

## Error Handling

### Error Response Format

All errors will follow a consistent format:
```json
{
    "error": "Human-readable error message",
    "code": "ERROR_CODE_CONSTANT",
    "timestamp": "2024-12-09T10:30:00.000Z"
}
```

### Error Categories

1. **Client Errors (4xx)**
   - `INVALID_MOVE` - Game rule violation
   - `INVALID_INPUT` - Request validation failure
   - `ROOM_NOT_FOUND` - Room doesn't exist
   - `PLAYER_NOT_FOUND` - Player doesn't exist
   - `UNAUTHORIZED` - Action not allowed

2. **Server Errors (5xx)**
   - `INTERNAL_ERROR` - Unexpected server error
   - `DATABASE_ERROR` - Database operation failed
   - `REDIS_ERROR` - Redis operation failed

### Error Handling Strategy

**Backend:**
- Custom exception classes for each error type
- Global exception handler middleware
- Automatic error transformation
- Error logging with context

**Frontend:**
- ApiError class with status, code, and message
- Automatic retry for network errors (5xx, timeouts)
- No retry for client errors (4xx)
- User-friendly error messages

## Testing Strategy

### Behavior Preservation Testing

The primary testing strategy for refactoring is **behavior preservation**:

1. **Baseline Capture**: Run all existing tests before refactoring and capture results
2. **Refactor**: Make code changes
3. **Verification**: Run all tests again and verify identical results
4. **Regression**: Run E2E tests to verify user-facing behavior unchanged

### Unit Testing

**Backend:**
- Test service classes in isolation with mocked dependencies
- Test validators with various valid and invalid inputs
- Test error handlers with different exception types
- Test configuration loading with missing/invalid values

**Frontend:**
- Test API client retry logic with simulated failures
- Test error transformation with various error responses
- Test store composition with mocked sub-stores
- Test component rendering with various props

### Integration Testing

**Backend:**
- Test API endpoints with real database (test DB)
- Verify error responses match expected format
- Test WebSocket message handling end-to-end

**Frontend:**
- Test API client with mocked fetch
- Test store actions with mocked API client
- Test component integration with real stores

### Property-Based Testing

For properties that involve "any" input:
- Use property-based testing library (Hypothesis for Python, fast-check for TypeScript)
- Generate random valid inputs
- Verify properties hold across all generated inputs
- Configure to run minimum 100 iterations per property

**Backend Property Tests:**
- Property 1-5: Error response format properties
- Property 8: API behavior preservation (compare responses)
- Property 10: Test suite preservation (run existing tests)
- Property 12: WebSocket format preservation (compare messages)

**Frontend Property Tests:**
- Property 6: Retry logic with various failure scenarios
- Property 7: Error transformation with various error responses
- Property 9: Functionality preservation (E2E tests)
- Property 11: Test suite preservation (run existing tests)

### Test Organization

**Backend:**
```python
# tests/fixtures.py - Shared fixtures
@pytest.fixture
def test_db():
    """Test database with clean state"""
    pass

@pytest.fixture
def sample_room():
    """Room with two players"""
    pass

@pytest.fixture
def game_in_progress():
    """Room with active game"""
    pass

# tests/test_services.py - Service layer tests
def test_room_service_create_room(test_db):
    """Test room creation through service"""
    pass

# tests/test_error_handling.py - Error handling tests
def test_error_response_format():
    """Property: All errors have consistent format"""
    pass
```

**Frontend:**
```typescript
// tests/fixtures.ts - Shared fixtures
export const mockApiClient = (): ApiClient => {
    // Mock implementation
};

export const mockGameState = (): GameState => {
    // Sample game state
};

// tests/api.test.ts - API client tests
describe('API Client', () => {
    it('retries with exponential backoff', async () => {
        // Property test
    });
});

// tests/stores.test.ts - Store tests
describe('Game Store', () => {
    it('composes sub-stores correctly', () => {
        // Integration test
    });
});
```

### Refactoring Test Workflow

For each refactoring task:

1. **Before Refactoring:**
   - Run full test suite: `npm run test:all`
   - Run E2E tests: `npm run test:e2e`
   - Capture baseline metrics (response times, bundle size)

2. **During Refactoring:**
   - Write tests for new structure (service classes, API client, etc.)
   - Ensure new tests pass
   - Keep existing tests passing

3. **After Refactoring:**
   - Run full test suite again
   - Verify all tests still pass
   - Compare metrics to baseline
   - Run E2E tests to verify user flows

4. **Deployment:**
   - Deploy to staging
   - Run smoke tests
   - Monitor for errors
   - Deploy to production if clean

### Success Criteria

Refactoring is successful when:
- ✅ All existing tests pass without modification
- ✅ New tests added for refactored code
- ✅ E2E tests pass (user flows unchanged)
- ✅ No performance regression (< 10% slower)
- ✅ Code metrics improved (file size, complexity)
- ✅ No new errors in production monitoring

## Implementation Phases

### Phase 1: Backend Service Layer (Week 1)
**Goal**: Extract business logic from main.py into service classes

**Tasks:**
1. Create service layer structure
2. Implement RoomService
3. Implement GameService
4. Implement PlayerService
5. Implement WebSocketService
6. Update main.py to use services
7. Verify all tests pass

**Success Metrics:**
- main.py reduced from 1000+ lines to < 300 lines
- All existing tests pass
- New service tests added

### Phase 2: Validation & Error Handling (Week 1-2)
**Goal**: Consolidate validators and standardize error handling

**Tasks:**
1. Create validation module structure
2. Consolidate game validators
3. Consolidate state validators
4. Consolidate input validators
5. Consolidate security validators
6. Create custom exception classes
7. Implement error handler middleware
8. Update all routes to use new error handling
9. Verify all tests pass

**Success Metrics:**
- Single validation module
- Consistent error responses
- All existing tests pass

### Phase 3: Configuration & Testing (Week 2)
**Goal**: Centralize configuration and consolidate test fixtures

**Tasks:**
1. Create Settings class with Pydantic
2. Update all code to use Settings
3. Create shared test fixtures
4. Update tests to use fixtures
5. Verify all tests pass

**Success Metrics:**
- Type-safe configuration
- Reduced test code duplication
- All existing tests pass

### Phase 4: Frontend Store Consolidation (Week 2-3)
**Goal**: Unify game-related stores

**Tasks:**
1. Create unified store structure
2. Compose sub-stores (sync, optimistic, queue)
3. Update components to use unified store
4. Verify all tests pass

**Success Metrics:**
- Single game store import
- All existing tests pass
- Improved type inference

### Phase 5: Frontend Component & API (Week 3)
**Goal**: Decompose large components and create API client

**Tasks:**
1. Create API client with retry logic
2. Update stores to use API client
3. Decompose RoomManager component
4. Decompose GameTable component
5. Verify all tests pass

**Success Metrics:**
- Centralized API client
- Smaller, focused components
- All existing tests pass

### Phase 6: Type System & Documentation (Week 3-4)
**Goal**: Improve types and organize documentation

**Tasks:**
1. Consolidate type definitions
2. Add discriminated unions for actions
3. Organize documentation into docs/
4. Archive temporary files
5. Verify all tests pass

**Success Metrics:**
- Better type inference
- Organized documentation
- All existing tests pass

## Rollback Strategy

Each phase should be:
- Developed in a feature branch
- Reviewed before merging
- Deployed to staging first
- Monitored for issues
- Easily revertible via git

If issues arise:
1. Identify the problematic commit
2. Revert the commit
3. Deploy the revert
4. Fix the issue in a new branch
5. Re-deploy when fixed

## Monitoring & Validation

After each deployment:
- Monitor error rates in logs
- Check response time metrics
- Verify WebSocket connections stable
- Run smoke tests on production
- Check user-reported issues

If any metric degrades:
- Investigate immediately
- Rollback if necessary
- Fix and re-deploy

## Documentation Updates

After refactoring:
- Update architecture diagrams
- Update code organization docs
- Update development guide
- Update testing guide
- Update deployment guide
