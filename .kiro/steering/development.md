# Development Guidelines

## Code Style & Conventions

### TypeScript/Svelte
- Use Svelte 5 components with runes for reactivity
- Prefer Svelte stores over global state management
- Keep components focused and single-purpose
- Use explicit prop interfaces with TypeScript
- Leverage Svelte's built-in reactivity system

### Python/FastAPI
- Follow PEP 8 style guidelines
- Use type hints for all function parameters and returns
- Keep business logic separate from route handlers
- Use Pydantic models for request/response validation
- Document complex logic with docstrings

### Naming Conventions
- **Frontend**: camelCase for variables, PascalCase for components
- **Backend**: snake_case for variables and functions
- **Files**: PascalCase for components, camelCase for utilities/hooks
- **Database**: snake_case for table and column names

## Architecture Patterns

### Frontend
- **Svelte Stores Pattern**: State management through reactive stores using Svelte 5 runes
- **Component Composition**: Build complex UIs from simple Svelte components
- **Optimistic Updates**: Update UI immediately, reconcile with server
- **Error Handling**: Catch and handle errors in stores and components

### Backend
- **Layered Architecture**: Routes → Services → Models → Database
- **Service Layer**: Encapsulate business logic in service classes
- **Repository Pattern**: Abstract data access through repositories
- **Dependency Injection**: Pass dependencies explicitly

## Session Management

### Creating Sessions
```python
# Backend: SessionManager creates session with Redis
session_token = await session_manager.create_session(
    room_id=room_id,
    player_id=player_id,
    player_name=player_name,
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent")
)
```

### Validating Sessions
```python
# Backend: Validate session token
session_data = await session_manager.validate_session(
    token_str=token,
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent")
)
```

### Frontend Session Storage
```typescript
// Store session token in localStorage (works in Svelte)
if (browser) {
  localStorage.setItem('session_token', token);
}

// Retrieve on reconnection
const token = browser ? localStorage.getItem('session_token') : null;
```

## Caching Strategy

### When to Cache
- Frequently accessed game states (5-minute TTL)
- Player data that doesn't change often (30-minute TTL)
- Session data for quick validation (30-minute TTL)

### Cache Invalidation
```python
# Invalidate cache when data changes
await cache_manager.invalidate_game_state(room_id)
await cache_manager.cache_game_state(room_id, new_state)
```

### Fallback Pattern
```python
# Always provide database fallback
cached_state = await cache_manager.get_game_state(room_id)
if not cached_state:
    # Fallback to database
    state = await db.query(Room).filter(Room.id == room_id).first()
    # Cache for next time
    await cache_manager.cache_game_state(room_id, state)
```

## Action Logging

### Log All Game Actions
```python
# Log every player action for audit trail
action_id = action_logger.log_game_action(
    room_id=room_id,
    player_id=player_id,
    action_type="capture",  # capture, build, trail, ready, shuffle
    action_data={"card_id": card_id, "target_cards": target_cards}
)
```

### Deduplication
- Action IDs are generated using SHA-256 hash
- Duplicate actions are automatically detected and skipped
- Prevents double-processing of actions

## State Recovery

### Reconnection Flow
1. Client sends session token with WebSocket connection
2. Backend validates token with SessionManager
3. StateRecoveryService retrieves current game state
4. ActionLogger provides missed actions since disconnect
5. Client receives complete recovery state

### Implementation
```python
# Get recovery state for reconnecting player
recovery_state = state_recovery_service.get_recovery_state(
    room_id=room_id,
    player_id=player_id
)
# Returns: game_state, missed_actions, is_your_turn, time_disconnected
```

## Background Tasks

### Task Lifecycle
```python
# Start background tasks on server startup
await background_task_manager.start()

# Stop on shutdown
await background_task_manager.stop()
```

### Adding New Tasks
1. Add task method to BackgroundTaskManager
2. Use `while self.running:` loop
3. Add `await asyncio.sleep(interval)` for periodic execution
4. Handle exceptions gracefully
5. Register task in `start()` method

## Testing Guidelines

### Unit Tests
- Test pure functions and business logic
- Mock external dependencies (database, Redis, API calls)
- Use descriptive test names
- Aim for 80%+ coverage on critical paths

### Integration Tests
- Test API endpoints with real database
- Use test database, not production
- Clean up test data after each test
- Test happy paths and error cases

### E2E Tests
- Test complete user flows
- Use Playwright for browser automation
- Test on multiple browsers if possible
- Keep tests independent and idempotent

## Error Handling

### Frontend
```typescript
// Using Svelte 5 runes
try {
    const response = await api.playCard(data);
    gameState = response.state; // Reactive assignment
} catch (error) {
    // Rollback optimistic update
    gameState = previousGameState;
    // Show error to user
    errorMessage = error.message;
}
```

### Backend
```python
# Use custom exception classes
class GameError(Exception):
    """Base exception for game-related errors"""
    pass

# Handle in route
try:
    result = await game_logic.validate_move(...)
except GameError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

## Database Migrations

### Creating Migrations
```bash
# Auto-generate migration from model changes
cd backend && alembic revision --autogenerate -m "description"

# Review generated migration file
# Edit if needed for complex changes

# Apply migration
alembic upgrade head
```

### Migration Best Practices
- Always review auto-generated migrations
- Test migrations on development database first
- Include both upgrade and downgrade paths
- Keep migrations small and focused
- Never edit applied migrations

## WebSocket Communication

### Message Format
```typescript
// Client -> Server
{
    type: "heartbeat",
    data: { timestamp: Date.now() }
}

// Server -> Client
{
    type: "game_state_update",
    data: GameState
}
```

### Connection Management
- Send heartbeat every 30 seconds
- Reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Include session token in reconnection
- Handle connection state changes in UI

## Performance Optimization

### Frontend
- Use Svelte's built-in reactivity (no memo needed)
- Debounce rapid user actions
- Lazy load routes with SvelteKit's dynamic imports
- Optimize bundle size with code splitting

### Backend
- Use Redis caching for hot paths
- Index database columns used in queries
- Use connection pooling for database
- Batch database operations when possible

### Redis
- Set appropriate TTLs to prevent memory bloat
- Use pipelining for multiple operations
- Monitor memory usage
- Configure eviction policy (allkeys-lru recommended)

## Security Considerations

### Session Security
- Use secure random token generation
- Include IP and user agent in session fingerprint
- Validate session on every request
- Expire sessions after inactivity

### Input Validation
- Validate all user input on backend
- Sanitize player names and room codes
- Use Pydantic models for type safety
- Prevent SQL injection with ORM

### CORS Configuration
- Whitelist specific origins, not "*"
- Include credentials in CORS config
- Validate origin on WebSocket connections

## Deployment Checklist

### Before Deploying
- [ ] Run all tests locally
- [ ] Check for TypeScript errors
- [ ] Review database migrations
- [ ] Update environment variables
- [ ] Test build process
- [ ] Review security settings

### After Deploying
- [ ] Verify health check endpoint
- [ ] Check Redis connectivity
- [ ] Verify database migrations applied
- [ ] Test WebSocket connections
- [ ] Monitor error logs
- [ ] Test critical user flows

## Troubleshooting

### Common Issues

**Redis Connection Failed**
- Check REDIS_URL environment variable
- Verify Redis server is running
- Check network connectivity
- Review Redis logs

**Session Not Found**
- Session may have expired (30-minute TTL)
- Check if Redis is running
- Verify session token in localStorage
- Check for clock skew between client/server

**WebSocket Disconnects**
- Check heartbeat implementation
- Verify network stability
- Review connection timeout settings
- Check for server resource issues

**State Desync**
- Check action logging for missed actions
- Verify state recovery implementation
- Review WebSocket message handling
- Check for race conditions in state updates

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Svelte Documentation](https://svelte.dev/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Redis Documentation](https://redis.io/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Playwright Documentation](https://playwright.dev/)
