# Troubleshooting Guide

## Common Issues and Solutions

### Build and Development Issues

#### TypeScript Errors: Property naming mismatches
**Symptom**: Errors like `Property 'player1_hand' does not exist on type 'GameState'. Did you mean 'player1Hand'?`

**Cause**: Backend uses snake_case, frontend uses camelCase

**Solution**: 
- In backend files: Use `player1_hand`, `table_cards`, etc.
- In frontend files: Use `player1Hand`, `tableCards`, etc.
- Transformation happens in API hooks

#### Vitest Module Export Error
**Symptom**: `The requested module 'vitest/node' does not provide an export named 'rolldownVersion'`

**Cause**: Version mismatch in vitest dependencies

**Solution**:
```bash
npm install vitest@latest @vitest/ui@latest --save-dev
```

#### Build Succeeds but Tests Fail
**Symptom**: `npm run build` works but `npm run test` fails

**Solution**: This is expected. The build process is more lenient than tests. Focus on:
1. Fixing TypeScript errors in test files
2. Updating test utilities
3. Ensuring test dependencies are installed

### Backend Issues

#### Redis Connection Failed
**Symptom**: `Error: Redis connection refused` or `ECONNREFUSED localhost:6379`

**Cause**: Redis server not running

**Solution**:
```bash
# Start Redis with Docker
npm run start:redis

# Or start Redis directly
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Database Migration Errors
**Symptom**: `alembic.util.exc.CommandError: Can't locate revision identified by 'xxxxx'`

**Cause**: Migration history mismatch

**Solution**:
```bash
cd backend

# Check current revision
alembic current

# View migration history
alembic history

# If needed, stamp to specific revision
alembic stamp head

# Apply migrations
alembic upgrade head
```

#### Session Not Found After Restart
**Symptom**: Players can't reconnect after server restart

**Cause**: Redis data is volatile (not persisted by default)

**Solution**:
- This is expected behavior in development
- In production, configure Redis persistence (RDB or AOF)
- Sessions expire after 30 minutes anyway
- Users can create new sessions

#### Background Tasks Not Running
**Symptom**: Expired sessions not cleaned up, stale connections remain

**Cause**: Background task manager not started

**Solution**:
```python
# In main.py, ensure this is called on startup
@app.on_event("startup")
async def startup_event():
    await background_task_manager.start()

@app.on_event("shutdown")
async def shutdown_event():
    await background_task_manager.stop()
```

### Frontend Issues

#### WebSocket Connection Fails
**Symptom**: `WebSocket connection to 'ws://...' failed`

**Cause**: Backend not running or CORS misconfiguration

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS settings in backend `.env`:
   ```
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174
   ```
3. Verify WebSocket URL in frontend `.env`:
   ```
   VITE_WS_URL=ws://localhost:8000
   ```

#### Session Token Not Persisting
**Symptom**: Users lose session on page refresh

**Cause**: localStorage not being set or cleared

**Solution**:
```typescript
// Verify token is stored
const token = localStorage.getItem('session_token');
console.log('Session token:', token);

// Check if token is being cleared somewhere
// Search for: localStorage.removeItem('session_token')
// Or: localStorage.clear()
```

#### State Not Updating After Action
**Symptom**: UI doesn't reflect game state changes

**Cause**: WebSocket message not received or state not applied

**Solution**:
1. Check WebSocket connection status
2. Verify message is received in browser DevTools (Network → WS)
3. Check `applyResponseState()` is called in hooks
4. Verify state transformation from snake_case to camelCase

#### Optimistic Update Not Rolling Back
**Symptom**: UI shows incorrect state after failed action

**Cause**: Previous state not saved or rollback not implemented

**Solution**:
```typescript
// Save previous state before optimistic update
const previousState = { ...gameState };

try {
    // Optimistic update
    setGameState(newState);
    
    // API call
    const response = await api.playCard(data);
    
    // Apply server response
    applyResponseState(response);
} catch (error) {
    // Rollback on error
    setGameState(previousState);
    setError(error.message);
}
```

### Performance Issues

#### Slow API Responses
**Symptom**: API calls take > 1 second

**Cause**: Database queries without caching or missing indexes

**Solution**:
1. Add Redis caching for frequently accessed data
2. Check database indexes:
   ```sql
   -- View indexes
   SELECT * FROM sqlite_master WHERE type='index';
   
   -- Add index if missing
   CREATE INDEX idx_room_id ON players(room_id);
   ```
3. Use `EXPLAIN QUERY PLAN` to analyze slow queries

#### High Redis Memory Usage
**Symptom**: Redis using excessive memory

**Cause**: Too many keys or TTLs not set

**Solution**:
```bash
# Check Redis memory usage
redis-cli info memory

# View all keys (careful in production!)
redis-cli keys "*"

# Check TTL on keys
redis-cli ttl "session:xxxxx"

# Set eviction policy
redis-cli config set maxmemory-policy allkeys-lru
```

#### WebSocket Message Backlog
**Symptom**: Messages arrive in bursts, delayed updates

**Cause**: Too many messages or slow processing

**Solution**:
1. Reduce message frequency (batch updates)
2. Optimize message size (send only changed data)
3. Check network latency
4. Verify client is processing messages quickly

### Deployment Issues

#### Production Build Fails
**Symptom**: `npm run build` fails in CI/CD

**Cause**: Environment variables missing or TypeScript errors

**Solution**:
1. Check all required env vars are set
2. Run build locally first: `npm run build`
3. Fix TypeScript errors shown in output
4. Verify all dependencies are in package.json

#### Backend Won't Start on Render
**Symptom**: Deployment succeeds but app crashes

**Cause**: Missing environment variables or database connection

**Solution**:
```bash
# Check Render logs in dashboard
# Or use Render CLI
render logs

# Verify environment variables are set in Render dashboard
# Settings → Environment → Environment Variables

# Check health endpoint
curl https://your-app.onrender.com/health
```

#### Frontend Assets Not Loading
**Symptom**: 404 errors for JS/CSS files

**Cause**: Incorrect base path configuration

**Solution**:
```typescript
// In vite.config.ts
export default defineConfig({
    base: '/cassino/',  // Must match deployment path
    // ...
});
```

### Data Issues

#### Game State Desynchronization
**Symptom**: Players see different game states

**Cause**: Race condition or missed WebSocket message

**Solution**:
1. Check action logging for sequence gaps
2. Verify all state changes broadcast to room
3. Implement state checksum validation
4. Force state resync if checksum mismatch

#### Duplicate Actions Processed
**Symptom**: Same action executed twice

**Cause**: Action deduplication not working

**Solution**:
```python
# Verify action_id is unique
action_id = action_logger.log_game_action(...)

# Check if action already processed
if action_logger.is_action_processed(action_id):
    return {"error": "Action already processed"}
```

#### Lost Game State After Reconnection
**Symptom**: Player reconnects but game state is wrong

**Cause**: State recovery not working or cache expired

**Solution**:
1. Verify session token is valid
2. Check state recovery service:
   ```python
   recovery_state = state_recovery_service.get_recovery_state(
       room_id=room_id,
       player_id=player_id
   )
   ```
3. Ensure action log has all actions
4. Check cache TTL settings

## Debugging Tools

### Backend Debugging

#### Check Redis Data
```bash
# Connect to Redis CLI
redis-cli

# View all session keys
KEYS "session:*"

# Get session data
GET "session:abc123..."

# View game state cache
KEYS "game:state:*"
GET "game:state:ROOM01"

# Check TTL
TTL "session:abc123..."
```

#### Check Database State
```bash
# SQLite (development)
sqlite3 casino_game.db

# View tables
.tables

# Query rooms
SELECT * FROM rooms;

# Query sessions
SELECT * FROM game_sessions WHERE is_active = 1;

# Query action log
SELECT * FROM game_action_log ORDER BY sequence_number DESC LIMIT 10;
```

#### View Backend Logs
```python
# Add debug logging
import logging
logger = logging.getLogger(__name__)
logger.debug(f"State: {game_state}")
logger.info(f"Action processed: {action_id}")
logger.warning(f"Cache miss for: {room_id}")
logger.error(f"Error: {error}")
```

### Frontend Debugging

#### Check WebSocket Messages
```javascript
// In browser DevTools Console
// View WebSocket connection
// Network tab → WS → Select connection → Messages

// Log all WebSocket messages
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
    console.log('WS Send:', data);
    return originalSend.apply(this, arguments);
};
```

#### Check localStorage
```javascript
// View all localStorage
console.log(localStorage);

// Check session token
console.log('Session token:', localStorage.getItem('session_token'));

// Check game state
console.log('Game state:', localStorage.getItem('game_state'));
```

#### React DevTools
- Install React DevTools browser extension
- View component props and state
- Track component re-renders
- Profile performance

## Performance Monitoring

### Key Metrics to Watch

#### Backend
- API response time (target: < 500ms)
- Database query time (target: < 100ms)
- Redis operation time (target: < 10ms)
- WebSocket message latency (target: < 100ms)
- Active WebSocket connections
- Memory usage
- CPU usage

#### Frontend
- Page load time (target: < 3s)
- Time to interactive (target: < 5s)
- WebSocket reconnection frequency
- State update frequency
- Component render time

#### Redis
- Memory usage (monitor for leaks)
- Key count (should decrease with TTL)
- Hit rate (target: > 80%)
- Eviction count (should be low)

### Monitoring Commands

```bash
# Backend health
curl http://localhost:8000/health

# Redis stats
redis-cli info stats
redis-cli info memory

# Database connections
# SQLite: Check file size
ls -lh casino_game.db

# PostgreSQL: Check connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## Getting More Help

### Log Locations
- **Backend logs**: stdout (check terminal or Render dashboard logs)
- **Frontend logs**: Browser DevTools Console
- **Redis logs**: Redis server output
- **Database logs**: SQLite/PostgreSQL logs

### Useful Commands
```bash
# Check all services
npm run start:backend  # Terminal 1
npm run start:redis    # Terminal 2
npm run dev            # Terminal 3

# View all processes
ps aux | grep python
ps aux | grep redis
ps aux | grep node

# Check ports
netstat -an | grep 8000  # Backend
netstat -an | grep 6379  # Redis
netstat -an | grep 5173  # Frontend
```

### Documentation References
- FastAPI: https://fastapi.tiangolo.com/
- Redis: https://redis.io/docs/
- SQLAlchemy: https://docs.sqlalchemy.org/
- React: https://react.dev/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

### When to Ask for Help
- After trying solutions in this guide
- When error messages are unclear
- When behavior is inconsistent
- When performance is degraded
- When security concerns arise

Provide this information when asking for help:
1. What you were trying to do
2. What you expected to happen
3. What actually happened
4. Error messages (full text)
5. Steps to reproduce
6. Environment (dev/production)
7. Recent changes made
