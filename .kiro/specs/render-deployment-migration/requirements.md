# Requirements Document

## Introduction

This specification covers the migration of the Casino Card Game backend deployment from Fly.io to Render. The application currently runs on Fly.io with PostgreSQL and Redis managed services. This migration will transition to Render's platform while maintaining all existing functionality, session management, caching, and real-time WebSocket capabilities.

## Glossary

- **Render**: Cloud platform providing web services, databases, and Redis instances
- **Fly.io**: Current cloud platform hosting the backend application
- **Backend Service**: FastAPI application serving REST API and WebSocket endpoints
- **PostgreSQL Database**: Relational database storing game state, rooms, players, and sessions
- **Redis Instance**: In-memory data store for session management and caching
- **Environment Variables**: Configuration values for database URLs, CORS origins, and service settings
- **Health Check Endpoint**: HTTP endpoint (`/health`) used to verify service availability
- **CORS Origins**: Allowed frontend domains for cross-origin requests
- **Session Management**: Redis-based player session tracking with automatic expiration
- **WebSocket Connections**: Real-time bidirectional communication channels for game updates
- **Database Migrations**: Alembic scripts for schema version management

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to deploy the backend to Render, so that the application runs on the new platform with all services configured.

#### Acceptance Criteria

1. WHEN the backend is deployed to Render THEN the system SHALL create a web service running the FastAPI application
2. WHEN the deployment completes THEN the system SHALL provision a PostgreSQL database instance
3. WHEN the deployment completes THEN the system SHALL provision a Redis instance
4. WHEN services are provisioned THEN the system SHALL configure environment variables connecting services
5. WHEN the application starts THEN the system SHALL execute database migrations automatically

### Requirement 2

**User Story:** As a system administrator, I want the health check endpoint to work on Render, so that the platform can monitor service availability.

#### Acceptance Criteria

1. WHEN Render performs a health check THEN the system SHALL respond to GET requests at `/health`
2. WHEN the application is healthy THEN the system SHALL return HTTP 200 status
3. WHEN the health check fails THEN Render SHALL restart the Backend Service automatically
4. WHEN the Backend Service starts THEN Render SHALL wait for the configured grace period before initiating health checks

### Requirement 3

**User Story:** As a developer, I want environment variables properly configured on Render, so that the application connects to the correct services.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL provide DATABASE_URL from the PostgreSQL service
2. WHEN the application starts THEN the system SHALL provide REDIS_URL from the Redis service
3. WHEN the application starts THEN the system SHALL provide CORS_ORIGINS for frontend domains
4. WHEN the application starts THEN the system SHALL provide PORT set to 10000
5. WHEN environment variables are missing THEN the system SHALL fail startup with clear error messages

### Requirement 4

**User Story:** As a system administrator, I want database migrations to run automatically on deployment, so that the schema is always up to date.

#### Acceptance Criteria

1. WHEN the application deploys THEN the system SHALL execute `alembic upgrade head` before starting the server
2. WHEN migrations succeed THEN the system SHALL proceed to start the FastAPI application
3. WHEN migrations fail THEN the system SHALL prevent application startup and log the error
4. WHEN the database is empty THEN the system SHALL create all tables from migrations

### Requirement 5

**User Story:** As a player, I want WebSocket connections to work on Render, so that I can receive real-time game updates.

#### Acceptance Criteria

1. WHEN a client connects via WebSocket THEN the system SHALL establish a persistent connection
2. WHEN game state changes THEN the system SHALL broadcast updates to all room participants
3. WHEN a connection drops THEN the system SHALL clean up resources and allow reconnection
4. WHEN heartbeat messages are sent THEN the system SHALL respond to maintain connection

### Requirement 6

**User Story:** As a system administrator, I want Redis session management to work on Render, so that players can reconnect and recover their game state.

#### Acceptance Criteria

1. WHEN a player creates a session THEN the system SHALL store session data in Redis with 30-minute TTL
2. WHEN a player reconnects THEN the system SHALL validate the session token from Redis
3. WHEN Redis is unavailable THEN the system SHALL fall back to database queries and log warnings
4. WHEN sessions expire THEN the system SHALL clean them up via background tasks

### Requirement 7

**User Story:** As a system administrator, I want the frontend to connect to the Render backend, so that users can access the application.

#### Acceptance Criteria

1. WHEN the frontend makes API requests THEN the system SHALL accept requests from configured CORS origins
2. WHEN the frontend connects via WebSocket THEN the system SHALL accept connections from allowed origins
3. WHEN CORS validation fails THEN the system SHALL reject requests with HTTP 403
4. WHEN the Backend Service URL changes THEN the deployment process SHALL update frontend environment variables to reflect the new URL

### Requirement 8

**User Story:** As a developer, I want to remove Fly.io configuration files, so that the codebase reflects the current deployment platform.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the developer SHALL remove the `fly.toml` configuration file from the repository
2. WHEN the migration is complete THEN the developer SHALL remove Fly.io-specific deployment scripts from the repository
3. WHEN the migration is complete THEN the developer SHALL update all documentation to reference Render instead of Fly.io
4. WHEN the migration is complete THEN the developer SHALL update deployment commands in package.json to use Render

### Requirement 9

**User Story:** As a system administrator, I want to verify the Render deployment works correctly, so that I can confirm the migration was successful.

#### Acceptance Criteria

1. WHEN verification tests run THEN the system SHALL confirm the health endpoint returns HTTP 200
2. WHEN verification tests run THEN the system SHALL confirm database connectivity
3. WHEN verification tests run THEN the system SHALL confirm Redis connectivity
4. WHEN verification tests run THEN the system SHALL confirm WebSocket connections work
5. WHEN verification tests run THEN the system SHALL confirm session creation and validation work

### Requirement 10

**User Story:** As a developer, I want deployment documentation updated, so that future deployments use Render commands.

#### Acceptance Criteria

1. WHEN documentation is updated THEN the documentation SHALL include Render deployment instructions
2. WHEN documentation is updated THEN the documentation SHALL include environment variable configuration steps
3. WHEN documentation is updated THEN the documentation SHALL include troubleshooting guidance specific to Render
4. WHEN documentation is updated THEN the documentation SHALL contain no references to Fly.io
