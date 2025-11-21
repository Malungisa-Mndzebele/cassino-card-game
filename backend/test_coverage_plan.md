# Test Coverage Improvement Plan

## Current Coverage: 40%
## Target Coverage: 100%

## Priority Modules (by business criticality)

### High Priority - Core Business Logic
1. **game_logic.py** (21% → 100%)
   - 141 uncovered lines
   - Critical: Game mechanics, scoring, validation
   - Tests needed: All game actions, edge cases, scoring logic

2. **session_manager.py** (26% → 100%)
   - 86 uncovered lines  
   - Critical: Session handling, reconnection
   - Tests needed: Session lifecycle, validation, expiry

3. **websocket_manager.py** (25% → 100%)
   - 98 uncovered lines
   - Critical: Real-time communication
   - Tests needed: Connection handling, broadcasting, errors

### Medium Priority - Infrastructure
4. **cache_manager.py** (26% → 100%)
   - 88 uncovered lines
   - Important: Performance optimization
   - Tests needed: Cache operations, TTL, invalidation

5. **background_tasks.py** (25% → 100%)
   - 53 uncovered lines
   - Important: Cleanup, monitoring
   - Tests needed: Task execution, error handling

6. **redis_client.py** (30% → 100%)
   - 71 uncovered lines
   - Important: Data persistence
   - Tests needed: All Redis operations, fallbacks

### Lower Priority - Already High Coverage
7. **models.py** (95% → 100%) - 6 lines
8. **schemas.py** (92% → 100%) - 9 lines
9. **database.py** (65% → 100%) - 17 lines

### API Routes
10. **main.py** (25% → 100%)
    - 352 uncovered lines
    - Tests needed: All endpoints, error cases, WebSocket

## Implementation Strategy

### Phase 1: Core Game Logic (Est. 2-3 hours)
- Create test_game_logic_comprehensive.py
- Test all game actions: capture, build, trail
- Test scoring logic
- Test validation functions
- Test edge cases

### Phase 2: Session & WebSocket (Est. 2 hours)
- Create test_session_comprehensive.py
- Create test_websocket_comprehensive.py
- Test connection lifecycle
- Test error scenarios
- Test reconnection logic

### Phase 3: Infrastructure (Est. 1-2 hours)
- Create test_cache_comprehensive.py
- Create test_background_tasks_comprehensive.py
- Create test_redis_comprehensive.py
- Test all operations with mocks

### Phase 4: API Routes (Est. 2-3 hours)
- Expand test_api_basic.py
- Test all endpoints
- Test error cases
- Test WebSocket endpoints

### Phase 5: Frontend (Est. 3-4 hours)
- Resolve Svelte 5 testing issues
- Create component tests
- Create store tests
- Create utility tests

## Total Estimated Time: 10-14 hours

## Testing Approach
- Unit tests for pure functions
- Integration tests for API endpoints
- Mocked tests for external dependencies (Redis, WebSocket)
- Property-based tests where applicable
- Edge case and error scenario coverage
