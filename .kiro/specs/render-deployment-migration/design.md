# Design Document: Render Deployment Migration

## Overview

This design document outlines the migration of the Casino Card Game backend from Fly.io to Render. The migration maintains all existing functionality while transitioning to Render's platform services. The application will continue to use PostgreSQL for persistent storage, Redis for session management and caching, and WebSocket for real-time communication.

The migration is primarily a platform change with minimal code modifications. The existing FastAPI application, database schema, and frontend integration remain unchanged. The focus is on configuration, deployment automation, and verification.

## Architecture

### Current Architecture (Fly.io)

```
┌─────────────────────────────────────────────────────────────┐
│                         Fly.io                              │
│                                                             │
│  ┌──────────────────┐    ┌──────────────┐   ┌──────────┐  │
│  │  FastAPI Backend │───▶│ PostgreSQL   │   │  Redis   │  │
│  │  (Docker)        │    │  (Managed)   │   │(Managed) │  │
│  │  Port 8000       │◀───│              │   │          │  │
│  └──────────────────┘    └──────────────┘   └──────────┘  │
│         ▲                                                   │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ WebSocket/HTTP
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    Frontend (FTP)                           │
│              khasinogaming.com/cassino/                     │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (Render)

```
┌─────────────────────────────────────────────────────────────┐
│                         Render                              │
│                                                             │
│  ┌──────────────────┐    ┌──────────────┐   ┌──────────┐  │
│  │  Web Service     │───▶│ PostgreSQL   │   │  Redis   │  │
│  │  (Python)        │    │  (Native)    │   │(Native)  │  │
│  │  Port 10000      │◀───│              │   │          │  │
│  └──────────────────┘    └──────────────┘   └──────────┘  │
│         ▲                                                   │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ WebSocket/HTTP
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    Frontend (FTP)                           │
│              khasinogaming.com/cassino/                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Differences

1. **Build Process**: Render uses native Python environment instead of Docker
2. **Port**: Render uses port 10000 instead of 8000
3. **Service Discovery**: Render provides connection strings via environment variables
4. **Health Checks**: Render's health check configuration differs from Fly.io
5. **Deployment**: Render uses `render.yaml` instead of `fly.toml`

## Components and Interfaces

### 1. Web Service (Backend)

**Purpose**: FastAPI application serving REST API and WebSocket endpoints

**Configuration**:
- Type: `web`
- Environment: `python`
- Region: `oregon` (or user preference)
- Plan: `free` (upgradeable)
- Port: `10000`

**Build Command**:
```bash
pip install -r backend/requirements.txt
```

**Start Command**:
```bash
python backend/start_production.py
```

**Environment Variables**:
- `PYTHON_VERSION`: 3.11.0
- `DATABASE_URL`: Auto-injected from PostgreSQL service
- `REDIS_URL`: Auto-injected from Redis service
- `CORS_ORIGINS`: Frontend domain(s)
- `ENVIRONMENT`: production
- `PORT`: 10000

**Health Check**:
- Path: `/health`
- Expected Response: HTTP 200 with JSON body

### 2. PostgreSQL Database

**Purpose**: Persistent storage for game state, rooms, players, and sessions

**Configuration**:
- Type: `database` (PostgreSQL)
- Database Name: `cassino`
- User: `cassino_user`
- Region: `oregon` (same as web service)
- Plan: `free` (upgradeable)

**Connection**:
- Render automatically provides `DATABASE_URL` to web service
- Format: `postgresql://user:password@host:port/database`

**Schema Management**:
- Alembic migrations run automatically on deployment
- Existing migrations in `backend/alembic/versions/` are preserved

### 3. Redis Instance

**Purpose**: Session management, caching, and real-time state

**Configuration**:
- Type: `redis`
- Region: `oregon` (same as web service)
- Plan: `free` (upgradeable)
- Access: Internal only (ipAllowList: [])

**Connection**:
- Render automatically provides `REDIS_URL` to web service
- Format: `redis://host:port`

**Usage**:
- Session tokens (30-minute TTL)
- Game state cache (5-minute TTL)
- Player data cache (30-minute TTL)

### 4. Deployment Configuration

**File**: `render.yaml`

**Purpose**: Infrastructure as Code for Render services

**Structure**:
```yaml
services:
  - type: web
    name: cassino-game-backend
    # ... web service config
  
  - type: redis
    name: cassino-redis
    # ... redis config

databases:
  - name: cassino-db
    # ... database config
```

### 5. Migration Script

**Purpose**: Automated database schema updates on deployment

**Implementation**:
- Modify `backend/start_production.py` to run migrations before starting server
- Use Alembic's `upgrade head` command
- Handle migration failures gracefully

**Flow**:
```python
1. Load environment variables
2. Test database connection
3. Run: alembic upgrade head
4. If migrations fail: log error and exit
5. If migrations succeed: start FastAPI server
```

## Data Models

No changes to existing data models. The migration maintains the current database schema:

### Existing Models (Preserved)

1. **Room**
   - Primary game container
   - Stores game state, phase, scores
   - JSON fields for cards, builds, captured cards

2. **Player**
   - Player information and status
   - Links to room via foreign key
   - Tracks ready status and join time

3. **GameSession**
   - Session management for reconnection
   - Stores session tokens and metadata
   - Tracks connection status and heartbeats

4. **GameActionLog**
   - Audit trail of all game actions
   - Used for state recovery
   - Enables action replay

5. **StateSnapshot**
   - Periodic game state backups
   - Supports rollback and recovery

### Database Migration Strategy

**Approach**: Zero-downtime migration using database export/import

**Steps**:
1. Export data from Fly.io PostgreSQL
2. Create Render PostgreSQL instance
3. Import data to Render
4. Run Alembic migrations to ensure schema is current
5. Verify data integrity
6. Update frontend environment variables
7. Switch traffic to Render

**Rollback Plan**:
- Keep Fly.io deployment active during testing
- Frontend can quickly switch back to Fly.io URL
- Database backup available for restoration

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Consolidations:**
- Health check properties (2.1, 2.2) → Single health check property
- WebSocket properties (5.1-5.4) → Comprehensive WebSocket functionality property
- Session management properties (6.1, 6.2) → Combined session lifecycle property
- CORS properties (7.1-7.3) → Unified CORS validation property

**Rationale:**
- Testing health endpoint response subsumes testing the status code
- WebSocket connection, broadcasting, cleanup, and heartbeat are interdependent features best tested together
- Session creation and validation are part of the same session lifecycle
- CORS acceptance and rejection are two sides of the same validation logic

### Correctness Properties

**Property 1: Health endpoint availability**
*For any* HTTP GET request to `/health`, the system should return HTTP 200 status with a JSON response containing status, database, and redis fields
**Validates: Requirements 2.1, 2.2**

**Property 2: WebSocket connection lifecycle**
*For any* WebSocket connection attempt to a valid room, the system should establish a persistent connection, broadcast game state updates to all participants, handle heartbeat messages, and cleanly close connections when requested
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 3: Session management round trip**
*For any* player session created with valid credentials, storing the session in Redis and then retrieving it should return equivalent session data with the correct TTL
**Validates: Requirements 6.1, 6.2**

**Property 4: CORS validation**
*For any* HTTP or WebSocket request, the system should accept requests from configured CORS origins and reject requests from non-configured origins with HTTP 403
**Validates: Requirements 7.1, 7.2, 7.3**

**Property 5: Migration idempotence**
*For any* database state, running `alembic upgrade head` multiple times should result in the same final schema without errors
**Validates: Requirements 4.1, 4.2**

### Example Test Cases

The following are specific verification tests that validate deployment configuration:

**Example 1: Service provisioning verification**
- Deploy to Render
- Verify web service is running
- Verify PostgreSQL database exists
- Verify Redis instance exists
- Verify environment variables are set
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

**Example 2: Environment variable validation**
- Start application
- Check DATABASE_URL is set and valid
- Check REDIS_URL is set and valid
- Check CORS_ORIGINS is set
- Check PORT is set to 10000
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Example 3: Missing environment variable handling**
- Start application without DATABASE_URL
- Verify startup fails with clear error message
- Verify error message indicates which variable is missing
**Validates: Requirements 3.5**

**Example 4: Database migration on empty database**
- Create empty PostgreSQL database
- Run migrations
- Verify all tables are created
- Verify alembic_version table shows current revision
**Validates: Requirements 4.4**

**Example 5: Migration failure handling**
- Simulate migration failure (invalid SQL)
- Verify application does not start
- Verify error is logged
**Validates: Requirements 4.3**

**Example 6: Redis fallback behavior**
- Disconnect Redis
- Create session
- Verify session is stored in database
- Verify warning is logged
**Validates: Requirements 6.3**

**Example 7: Session expiration cleanup**
- Create session with short TTL
- Wait for expiration
- Verify background task removes session
**Validates: Requirements 6.4**

**Example 8: Configuration file cleanup**
- Complete migration
- Verify fly.toml is removed
- Verify Fly.io scripts are removed
- Verify documentation references Render
- Verify package.json has Render commands
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Example 9: Deployment verification suite**
- Run health check test
- Run database connectivity test
- Run Redis connectivity test
- Run WebSocket connection test
- Run session creation test
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

**Example 10: Documentation completeness**
- Check Render deployment instructions exist
- Check environment variable configuration steps exist
- Check Render troubleshooting guidance exists
- Check no Fly.io references remain
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

## Error Handling

### Deployment Errors

**Missing Environment Variables**
- **Detection**: Check for required variables on startup
- **Response**: Log clear error message indicating which variable is missing
- **Recovery**: Exit with non-zero status code to prevent partial startup

**Database Connection Failure**
- **Detection**: Test connection before starting server
- **Response**: Log connection error with details
- **Recovery**: Exit with non-zero status code, Render will retry

**Redis Connection Failure**
- **Detection**: Ping Redis on startup
- **Response**: Log warning but continue (Redis is optional)
- **Recovery**: Fall back to database-only mode

**Migration Failure**
- **Detection**: Catch exceptions from `alembic upgrade head`
- **Response**: Log migration error with stack trace
- **Recovery**: Exit with non-zero status code to prevent running with wrong schema

### Runtime Errors

**WebSocket Connection Errors**
- **Detection**: WebSocket exception handlers
- **Response**: Log error and close connection gracefully
- **Recovery**: Client can reconnect with exponential backoff

**Session Validation Errors**
- **Detection**: Invalid or expired session token
- **Response**: Return 401 Unauthorized
- **Recovery**: Client creates new session

**CORS Validation Errors**
- **Detection**: Origin not in allowed list
- **Response**: Return 403 Forbidden
- **Recovery**: Update CORS_ORIGINS environment variable

**Health Check Failures**
- **Detection**: Database or Redis ping fails
- **Response**: Return "degraded" status instead of "healthy"
- **Recovery**: Render continues running but marks service as unhealthy

### Error Logging

All errors are logged to stderr with:
- Timestamp
- Error level (ERROR, WARNING, INFO)
- Component (database, redis, websocket, etc.)
- Error message and stack trace
- Context (room_id, player_id, etc.)

Render automatically captures stderr and makes logs available via dashboard and CLI.

## Testing Strategy

### Unit Tests

**Purpose**: Verify individual components work correctly

**Scope**:
- Configuration loading (environment variables)
- Database connection logic
- Redis connection logic
- Migration execution logic
- Health check endpoint
- CORS middleware

**Tools**:
- pytest for Python backend tests
- pytest-asyncio for async tests
- unittest.mock for mocking external services

**Example Tests**:
```python
def test_health_endpoint_returns_200():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_missing_database_url_fails_startup():
    with pytest.raises(SystemExit):
        # Start app without DATABASE_URL
        pass

async def test_redis_fallback_on_connection_failure():
    # Mock Redis connection failure
    # Verify session stored in database
    # Verify warning logged
    pass
```

### Integration Tests

**Purpose**: Verify components work together correctly

**Scope**:
- Full deployment to Render staging environment
- Database migrations on real PostgreSQL
- Redis session management
- WebSocket connections
- CORS validation with real frontend

**Tools**:
- pytest for test orchestration
- httpx for HTTP requests
- websockets library for WebSocket testing
- psycopg2 for direct database queries

**Example Tests**:
```python
async def test_full_deployment_flow():
    # 1. Deploy to Render
    # 2. Wait for deployment to complete
    # 3. Check health endpoint
    # 4. Create room via API
    # 5. Connect via WebSocket
    # 6. Verify game state updates
    # 7. Disconnect and reconnect
    # 8. Verify session recovery

async def test_database_migration_on_fresh_database():
    # 1. Create empty database
    # 2. Run migrations
    # 3. Verify all tables exist
    # 4. Verify alembic_version is current
```

### Property-Based Tests

**Purpose**: Verify properties hold across many inputs

**Library**: Hypothesis (Python property-based testing library)

**Configuration**: Minimum 100 iterations per property

**Properties to Test**:

1. **Health Check Property**
```python
@given(st.integers(min_value=1, max_value=1000))
async def test_health_endpoint_always_responds(num_requests):
    """Property: Health endpoint always returns 200"""
    for _ in range(num_requests):
        response = await client.get("/health")
        assert response.status_code == 200
```

2. **WebSocket Lifecycle Property**
```python
@given(st.text(min_size=6, max_size=6), st.text(min_size=1, max_size=50))
async def test_websocket_connection_lifecycle(room_id, player_name):
    """Property: WebSocket connections work for any valid room/player"""
    # Connect
    ws = await connect_websocket(room_id)
    # Send heartbeat
    await ws.send(json.dumps({"type": "heartbeat"}))
    # Receive response
    response = await ws.recv()
    # Disconnect
    await ws.close()
    # Verify clean closure
    assert ws.closed
```

3. **Session Round Trip Property**
```python
@given(st.text(min_size=1, max_size=50), st.text(min_size=6, max_size=6))
async def test_session_round_trip(player_name, room_id):
    """Property: Session creation and retrieval are consistent"""
    # Create session
    session_token = await create_session(room_id, player_name)
    # Retrieve session
    session_data = await get_session(session_token)
    # Verify data matches
    assert session_data["player_name"] == player_name
    assert session_data["room_id"] == room_id
```

4. **CORS Validation Property**
```python
@given(st.text(min_size=1, max_size=100))
async def test_cors_validation(origin):
    """Property: CORS validation correctly allows/denies origins"""
    allowed_origins = ["https://khasinogaming.com"]
    response = await client.get("/health", headers={"Origin": origin})
    
    if origin in allowed_origins:
        assert response.status_code == 200
    else:
        # Note: CORS rejection may not return 403 for GET requests
        # but should not include CORS headers
        assert "Access-Control-Allow-Origin" not in response.headers
```

5. **Migration Idempotence Property**
```python
@given(st.integers(min_value=1, max_value=10))
async def test_migration_idempotence(num_runs):
    """Property: Running migrations multiple times is safe"""
    for _ in range(num_runs):
        result = await run_migrations()
        assert result.success
    
    # Verify final schema is correct
    tables = await get_database_tables()
    assert "rooms" in tables
    assert "players" in tables
    assert "game_sessions" in tables
```

### End-to-End Tests

**Purpose**: Verify complete user flows work on Render

**Scope**:
- Full game flow from room creation to game completion
- Reconnection and session recovery
- Multiple concurrent games
- Frontend integration

**Tools**:
- Playwright for browser automation
- Real Render deployment (staging)
- Real frontend deployment

**Example Tests**:
```typescript
test('complete game flow on Render', async ({ page }) => {
  // 1. Navigate to frontend
  await page.goto('https://khasinogaming.com/cassino/');
  
  // 2. Create room
  await page.fill('[data-testid="player-name"]', 'Player1');
  await page.click('[data-testid="create-room"]');
  
  // 3. Verify connected to Render backend
  const apiUrl = await page.evaluate(() => window.VITE_API_URL);
  expect(apiUrl).toContain('render.com');
  
  // 4. Play game
  // ... game actions ...
  
  // 5. Verify game completes successfully
});
```

### Deployment Verification Tests

**Purpose**: Verify Render deployment is configured correctly

**Scope**:
- Service provisioning
- Environment variables
- Database connectivity
- Redis connectivity
- Health checks
- WebSocket support

**Execution**: Run after each deployment

**Example Script**:
```bash
#!/bin/bash
# verify-deployment.sh

echo "Verifying Render deployment..."

# 1. Check health endpoint
curl -f https://cassino-game-backend.onrender.com/health || exit 1

# 2. Check database connectivity
# (health endpoint includes database status)

# 3. Check Redis connectivity
# (health endpoint includes redis status)

# 4. Check WebSocket support
# (use wscat or custom script)

# 5. Check CORS headers
curl -H "Origin: https://khasinogaming.com" \
     https://cassino-game-backend.onrender.com/health

echo "✅ Deployment verification complete"
```

### Test Execution Strategy

**Development**:
- Run unit tests on every code change
- Run integration tests before committing
- Use local PostgreSQL and Redis (Docker)

**CI/CD**:
- Run all unit tests on pull requests
- Run integration tests on main branch
- Run property-based tests (100 iterations)
- Deploy to staging on main branch merge
- Run E2E tests on staging
- Deploy to production after E2E pass

**Production**:
- Run deployment verification after each deploy
- Run smoke tests every hour
- Monitor health endpoint continuously
- Alert on failures

### Test Coverage Goals

- Unit tests: 90%+ code coverage
- Integration tests: All API endpoints
- Property-based tests: All correctness properties
- E2E tests: Critical user flows
- Deployment verification: All infrastructure components

## Implementation Plan

### Phase 1: Preparation (Pre-Migration)

**1.1 Create Render Configuration**
- Create `render.yaml` with service definitions
- Configure web service, PostgreSQL, Redis
- Set environment variables
- Configure health checks

**1.2 Update Startup Script**
- Modify `backend/start_production.py` to run migrations
- Add migration error handling
- Test locally with PostgreSQL

**1.3 Create Deployment Verification Script**
- Write script to verify all services
- Test health endpoint
- Test database connectivity
- Test Redis connectivity
- Test WebSocket connections

**1.4 Update Frontend Configuration**
- Add Render backend URL to environment variables
- Update CORS origins in backend
- Test frontend with Render staging

### Phase 2: Initial Deployment (Staging)

**2.1 Create Render Services**
- Create Render account (if needed)
- Create PostgreSQL database
- Create Redis instance
- Create web service
- Link services via environment variables

**2.2 Deploy Backend**
- Push code to GitHub
- Connect Render to repository
- Trigger initial deployment
- Monitor deployment logs

**2.3 Run Database Migrations**
- Migrations run automatically via startup script
- Verify alembic_version table
- Verify all tables created

**2.4 Verify Deployment**
- Run deployment verification script
- Check health endpoint
- Test API endpoints
- Test WebSocket connections

### Phase 3: Data Migration

**3.1 Export Data from Fly.io**
```bash
# Export from Fly.io PostgreSQL
flyctl postgres connect -a cassino-game-db
pg_dump -U postgres cassino_game > backup.sql
```

**3.2 Import Data to Render**
```bash
# Import to Render PostgreSQL
psql $DATABASE_URL < backup.sql
```

**3.3 Verify Data Integrity**
- Check row counts match
- Verify game states are intact
- Test session recovery

### Phase 4: Frontend Integration

**4.1 Update Frontend Environment Variables**
- Update `VITE_API_URL` to Render URL
- Update `VITE_WS_URL` to Render WebSocket URL
- Deploy frontend

**4.2 Test Frontend Integration**
- Create room
- Join room
- Play game
- Test reconnection
- Verify all features work

**4.3 Run E2E Tests**
- Run full E2E test suite
- Verify all tests pass
- Fix any issues

### Phase 5: Production Cutover

**5.1 Final Data Sync**
- Export latest data from Fly.io
- Import to Render
- Verify data integrity

**5.2 Switch Traffic**
- Update frontend to use Render backend
- Monitor for errors
- Keep Fly.io running as backup

**5.3 Monitor Production**
- Watch logs for errors
- Monitor health endpoint
- Check WebSocket connections
- Verify session management

**5.4 Verify Production**
- Run production smoke tests
- Test critical user flows
- Verify performance

### Phase 6: Cleanup

**6.1 Remove Fly.io Configuration**
- Delete `fly.toml`
- Remove Fly.io deployment scripts
- Update `.github/workflows` to remove Fly.io deployment

**6.2 Update Documentation**
- Update README.md with Render instructions
- Remove Fly.io references
- Add Render troubleshooting guide
- Update deployment commands in package.json

**6.3 Decommission Fly.io**
- Stop Fly.io services
- Export final backup
- Delete Fly.io app (after confirmation period)

### Rollback Plan

If issues occur during migration:

**Immediate Rollback**:
1. Update frontend to use Fly.io URL
2. Verify Fly.io is still running
3. Test critical flows
4. Investigate Render issues

**Data Rollback**:
1. Export data from Render
2. Import to Fly.io
3. Verify data integrity
4. Resume on Fly.io

**Complete Rollback**:
1. Revert frontend environment variables
2. Revert documentation changes
3. Keep Render services for investigation
4. Plan second migration attempt

### Timeline

- **Phase 1 (Preparation)**: 1-2 days
- **Phase 2 (Initial Deployment)**: 1 day
- **Phase 3 (Data Migration)**: 1 day
- **Phase 4 (Frontend Integration)**: 1 day
- **Phase 5 (Production Cutover)**: 1 day
- **Phase 6 (Cleanup)**: 1 day

**Total**: 6-7 days with buffer for testing and verification

### Success Criteria

- ✅ All services running on Render
- ✅ Health endpoint returns 200
- ✅ Database connectivity confirmed
- ✅ Redis connectivity confirmed
- ✅ WebSocket connections work
- ✅ Session management works
- ✅ Frontend integration complete
- ✅ All E2E tests pass
- ✅ Production smoke tests pass
- ✅ Documentation updated
- ✅ Fly.io configuration removed

## Deployment Configuration Details

### render.yaml Structure

```yaml
services:
  # Backend Web Service
  - type: web
    name: cassino-game-backend
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python backend/start_production.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        fromDatabase:
          name: cassino-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: cassino-redis
          property: connectionString
      - key: CORS_ORIGINS
        value: https://khasinogaming.com
      - key: ENVIRONMENT
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /health
    autoDeploy: true

  # Redis Service
  - type: redis
    name: cassino-redis
    region: oregon
    plan: free
    ipAllowList: []  # Internal only

databases:
  # PostgreSQL Database
  - name: cassino-db
    databaseName: cassino
    user: cassino_user
    region: oregon
    plan: free
```

### Updated start_production.py

```python
#!/usr/bin/env python3
"""
Production startup script for Casino Card Game Backend
Includes automatic database migrations
"""

import os
import sys
import subprocess
from pathlib import Path

def run_migrations():
    """Run database migrations before starting server"""
    print("🔄 Running database migrations...", file=sys.stderr)
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Migrations completed successfully", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}", file=sys.stderr)
        print(f"stdout: {e.stdout}", file=sys.stderr)
        print(f"stderr: {e.stderr}", file=sys.stderr)
        return False

def main():
    """Start the production server with migrations"""
    # ... existing startup code ...
    
    # Run migrations before starting server
    if not run_migrations():
        print("❌ Cannot start server due to migration failure", file=sys.stderr)
        sys.exit(1)
    
    # ... existing server startup code ...
```

### Environment Variables Reference

| Variable | Source | Example Value | Required |
|----------|--------|---------------|----------|
| DATABASE_URL | Render PostgreSQL | postgresql://user:pass@host/db | Yes |
| REDIS_URL | Render Redis | redis://host:port | Yes |
| CORS_ORIGINS | Manual | https://khasinogaming.com | Yes |
| PORT | Manual | 10000 | Yes |
| ENVIRONMENT | Manual | production | Yes |
| PYTHON_VERSION | Manual | 3.11.0 | Yes |

### Health Check Configuration

**Endpoint**: `/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

**Render Configuration**:
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Grace Period: 60 seconds
- Failure Threshold: 3 consecutive failures

### CORS Configuration

**Allowed Origins**:
- Production: `https://khasinogaming.com`
- Development: `http://localhost:5173`

**Configuration in backend**:
```python
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

## Monitoring and Observability

### Render Dashboard

**Metrics Available**:
- CPU usage
- Memory usage
- Request rate
- Response time
- Error rate
- Deployment history

**Logs**:
- Real-time log streaming
- Log search and filtering
- Log retention (varies by plan)

### Health Monitoring

**Automated Checks**:
- Render performs health checks every 30 seconds
- Restarts service on 3 consecutive failures
- Sends notifications on service issues

**Custom Monitoring**:
```bash
# Monitor health endpoint
watch -n 30 'curl -s https://cassino-game-backend.onrender.com/health | jq'

# Monitor logs
render logs -f cassino-game-backend
```

### Alerting

**Render Notifications**:
- Email on deployment failures
- Email on service restarts
- Email on health check failures

**Custom Alerts** (optional):
- Set up external monitoring (UptimeRobot, Pingdom)
- Configure Slack/Discord webhooks
- Set up PagerDuty integration

### Performance Monitoring

**Key Metrics**:
- API response time (target: < 500ms)
- WebSocket latency (target: < 100ms)
- Database query time (target: < 100ms)
- Redis operation time (target: < 10ms)

**Monitoring Tools**:
- Render built-in metrics
- Application logs
- Database slow query logs
- Redis INFO command

## Security Considerations

### Environment Variables

**Sensitive Data**:
- DATABASE_URL contains password
- REDIS_URL contains connection details
- Session secrets

**Protection**:
- Stored securely in Render dashboard
- Not exposed in logs
- Not committed to repository
- Encrypted at rest

### Network Security

**Database**:
- Internal network only
- No public access
- SSL/TLS encryption

**Redis**:
- Internal network only (ipAllowList: [])
- No public access
- Password protected

**Web Service**:
- HTTPS only (Render provides SSL)
- CORS restrictions
- Rate limiting (Render built-in)

### Application Security

**Session Management**:
- Secure random token generation
- 30-minute TTL
- IP and user agent validation

**Input Validation**:
- Pydantic schemas for all requests
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (Svelte auto-escaping)

**CORS**:
- Whitelist specific origins
- No wildcard in production
- Credentials allowed only for whitelisted origins

## Cost Considerations

### Render Free Tier

**Web Service**:
- 750 hours/month free
- Spins down after 15 minutes of inactivity
- Cold start: ~30 seconds

**PostgreSQL**:
- 90 days free trial
- 1 GB storage
- Shared CPU

**Redis**:
- 25 MB storage
- Shared instance

### Upgrade Path

**If Free Tier Insufficient**:
- Web Service: $7/month (always on)
- PostgreSQL: $7/month (dedicated)
- Redis: $10/month (dedicated)

**Total**: $24/month for dedicated resources

### Cost Comparison

**Fly.io** (previous):
- Estimated: $10-20/month

**Render** (new):
- Free tier: $0/month
- Paid tier: $24/month

## Conclusion

This design provides a comprehensive plan for migrating the Casino Card Game backend from Fly.io to Render. The migration maintains all existing functionality while taking advantage of Render's simplified deployment process and integrated services.

Key benefits of the migration:
- Simplified configuration with render.yaml
- Automatic environment variable injection
- Built-in health checks and monitoring
- Free tier for development and testing
- Easier database and Redis management

The migration is low-risk with a clear rollback plan and comprehensive testing strategy. All correctness properties are preserved, and the application will continue to function identically from the user's perspective.
