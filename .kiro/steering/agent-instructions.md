# Agent Instructions for Casino Card Game

## Project Context

You are working on a production-ready real-time multiplayer Casino card game with:
- SvelteKit + Svelte 5 + TypeScript frontend
- FastAPI + Python backend
- Redis for session management and caching
- PostgreSQL for persistent storage
- WebSocket for real-time communication

## Critical Implementation Details

### Property Naming Mismatch
**IMPORTANT**: There is a known property naming inconsistency between frontend and backend:
- Backend uses `snake_case`: `player1_hand`, `table_cards`, `last_action`
- Frontend uses `camelCase`: `player1Hand`, `tableCards`, `lastAction`

When working on code:
- **Backend files**: Use snake_case
- **Frontend files**: Use camelCase
- **API transformations**: Happen in Svelte stores

### Session Management Architecture
The application uses Redis-based session management:
- Sessions stored in Redis with 30-minute sliding window TTL
- Session tokens stored in browser localStorage
- Automatic reconnection with state recovery
- Background tasks clean up expired sessions every 5 minutes

### State Recovery System
When players reconnect:
1. Session token validated from localStorage
2. Current game state retrieved from cache/database
3. Missed actions fetched from action log
4. Complete recovery state sent to client

### Action Logging
All game actions are logged for:
- Audit trail and debugging
- State recovery after disconnection
- Deduplication of duplicate actions
- Replay capability

## When Making Changes

### Adding New Features
1. Check if feature exists in `.kiro/specs/` directory
2. Review requirements and design documents
3. Follow existing patterns (Svelte stores, service layer)
4. Add appropriate caching if data is frequently accessed
5. Log actions if they modify game state
6. Update tests

### Modifying Existing Code
1. Understand the current implementation first
2. Check for dependencies (other components, services)
3. Maintain backward compatibility when possible
4. Update related tests
5. Consider cache invalidation if data changes

### Database Changes
1. Create Alembic migration: `alembic revision --autogenerate -m "description"`
2. Review generated migration carefully
3. Test migration on development database
4. Include both upgrade and downgrade paths
5. Update models.py and schemas.py accordingly

### Adding API Endpoints
1. Define Pydantic schema in `schemas.py`
2. Add route in `main.py`
3. Implement business logic in service layer
4. Add action logging if state changes
5. Update cache if needed
6. Add tests

### Frontend Components
1. Use Svelte stores for state management
2. Keep components presentational
3. Follow existing Svelte component patterns
4. Use TypeScript interfaces from `types/gameTypes.ts`
5. Add proper error handling
6. Consider loading states

## Common Tasks

### Adding a New Game Action
```python
# 1. Add to backend game_logic.py
def validate_new_action(self, ...):
    # Validation logic
    pass

def execute_new_action(self, ...):
    # Execution logic
    pass

# 2. Add route in main.py
@app.post("/game/new-action")
async def new_action(request: NewActionRequest, db: Session = Depends(get_db)):
    # Log action
    action_logger.log_game_action(...)
    # Execute
    result = game_logic.execute_new_action(...)
    # Update cache
    await cache_manager.cache_game_state(...)
    # Broadcast
    await websocket_manager.broadcast_to_room(...)
    return result

# 3. Add frontend store method in gameActions.svelte.ts
const newAction = async (data) => {
    try {
        const response = await api.post('/game/new-action', data);
        gameState = response.state; // Reactive assignment
    } catch (error) {
        errorMessage = error.message;
    }
};
```

### Adding Caching for New Data
```python
# 1. Add cache key prefix in cache_manager.py
NEW_DATA_PREFIX = "new:data:"
NEW_DATA_TTL = 600  # 10 minutes

# 2. Add cache methods
async def cache_new_data(self, key: str, data: dict):
    cache_key = f"{self.NEW_DATA_PREFIX}{key}"
    await redis_client.set_json(cache_key, data, expire=self.NEW_DATA_TTL)

async def get_new_data(self, key: str):
    cache_key = f"{self.NEW_DATA_PREFIX}{key}"
    return await redis_client.get_json(cache_key)

# 3. Use in routes with fallback
cached = await cache_manager.get_new_data(key)
if not cached:
    data = await db.query(...).first()
    await cache_manager.cache_new_data(key, data)
    return data
return cached
```

### Adding a Background Task
```python
# In background_tasks.py
async def new_periodic_task(self):
    """Description of what this task does"""
    while self.running:
        try:
            db = next(get_db())
            try:
                # Task logic here
                logger.info("Task completed")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error in task: {e}")
        
        # Wait before next execution
        await asyncio.sleep(300)  # 5 minutes

# Register in start() method
self.tasks.append(asyncio.create_task(self.new_periodic_task()))
```

## Testing Requirements

### Before Committing
1. Run type checking: `npm run check` (frontend)
2. Run build: `npm run build`
3. Test backend: `python backend/test_api_comprehensive.py`
4. Run E2E tests if UI changed: `npm run test:e2e`

### Writing Tests
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for user flows
- Mock external dependencies (Redis, database)
- Use descriptive test names
- Clean up test data

## Code Review Checklist

Before considering work complete:
- [ ] Code follows existing patterns and conventions
- [ ] Property naming is consistent (snake_case backend, camelCase frontend)
- [ ] Error handling is implemented
- [ ] Caching is used appropriately
- [ ] Actions are logged if state changes
- [ ] Tests are added/updated
- [ ] TypeScript types are correct
- [ ] Documentation is updated if needed
- [ ] No console.log or debug code left
- [ ] Security considerations addressed

## Known Issues to Avoid

### Don't Do This
❌ Mix snake_case and camelCase in same file
❌ Skip action logging for state changes
❌ Forget to invalidate cache when data changes
❌ Use global state instead of Svelte stores
❌ Hardcode configuration values
❌ Skip error handling
❌ Forget to clean up WebSocket connections
❌ Use synchronous Redis client in async context

### Do This Instead
✅ Follow file's naming convention consistently
✅ Log all game actions with ActionLogger
✅ Invalidate and update cache together
✅ Use Svelte stores for state management
✅ Use environment variables for config
✅ Wrap API calls in try-catch
✅ Clean up connections in useEffect cleanup
✅ Use async Redis client with await

## Getting Help

### Documentation Locations
- **Architecture**: `.kiro/specs/complete-app-documentation/ARCHITECTURE_DIAGRAMS.md`
- **Requirements**: `.kiro/specs/complete-app-documentation/requirements.md`
- **Design**: `.kiro/specs/complete-app-documentation/design.md`
- **Tasks**: `.kiro/specs/complete-app-documentation/tasks.md`
- **Project Structure**: `.kiro/steering/structure.md`
- **Tech Stack**: `.kiro/steering/tech.md`

### Understanding the Codebase
1. Start with `.kiro/steering/structure.md` for project organization
2. Review `.kiro/specs/complete-app-documentation/design.md` for architecture
3. Check `types/gameTypes.ts` for data structures
4. Look at existing components/services for patterns
5. Review tests for usage examples

### Debugging Tips
- Check Redis connectivity: `redis-cli ping`
- View Redis keys: `redis-cli keys "*"`
- Check session data: `redis-cli get "session:{token}"`
- View logs: Backend logs show all errors and warnings
- Use browser DevTools for WebSocket messages
- Check database state: `sqlite3 casino_game.db` (dev)

## Production Considerations

### Performance
- Redis caching reduces database load by ~70%
- WebSocket connections are pooled and reused
- Background tasks run independently
- Database queries are indexed

### Scalability
- Stateless backend enables horizontal scaling
- Redis can be clustered for high availability
- PostgreSQL supports read replicas
- WebSocket connections can be load balanced

### Monitoring
- Health check endpoint: `GET /health`
- Redis metrics: Connection count, memory usage
- Database metrics: Query performance, connection pool
- WebSocket metrics: Active connections, message rate

### Security
- Session tokens are cryptographically secure
- CORS is configured for specific origins
- Input validation on all endpoints
- SQL injection prevented by ORM
- XSS prevented by Svelte's automatic escaping

## Summary

This is a well-architected, production-ready application with:
- Comprehensive session management
- Robust state recovery
- Complete action logging
- Performance optimization through caching
- Automated background maintenance

Follow the established patterns, maintain consistency, and always consider the user experience when making changes.
