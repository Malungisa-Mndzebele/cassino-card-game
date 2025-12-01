# Implementation Plan: Render Deployment Migration

## Task List

- [x] 1. Create and configure Render deployment files
  - Create `render.yaml` with web service, PostgreSQL, and Redis configurations
  - Configure environment variables for DATABASE_URL, REDIS_URL, CORS_ORIGINS, and PORT
  - Set up health check configuration pointing to `/health` endpoint
  - Configure auto-deploy from main branch
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update backend startup script for automatic migrations
  - Modify `backend/start_production.py` to run `alembic upgrade head` before starting server
  - Add migration error handling that prevents server startup on failure
  - Add logging for migration success and failure cases
  - Test migration execution with local PostgreSQL database
  - _Requirements: 1.5, 4.1, 4.2, 4.3_

- [x] 2.1 Write property test for migration idempotence
  - **Property 5: Migration idempotence**
  - **Validates: Requirements 4.1, 4.2**

- [x] 3. Create deployment verification script
  - Write script to test health endpoint returns HTTP 200
  - Add database connectivity verification
  - Add Redis connectivity verification
  - Add WebSocket connection test
  - Add session creation and validation test
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3.1 Write property test for health endpoint availability
  - **Property 1: Health endpoint availability**
  - **Validates: Requirements 2.1, 2.2**

- [x] 3.2 Write property test for WebSocket connection lifecycle
  - **Property 2: WebSocket connection lifecycle**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 3.3 Write property test for session management round trip
  - **Property 3: Session management round trip**
  - **Validates: Requirements 6.1, 6.2**

- [x] 3.4 Write property test for CORS validation
  - **Property 4: CORS validation**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 4. Deploy to Render staging environment
  - Create Render account and connect to GitHub repository
  - Create PostgreSQL database instance on Render
  - Create Redis instance on Render
  - Create web service and link to database and Redis via environment variables
  - Trigger initial deployment and monitor logs
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Verify Render staging deployment
  - Run deployment verification script against staging: `python backend/verify_deployment.py --url https://cassino-game-backend.onrender.com`
  - Test all API endpoints work correctly
  - Test WebSocket connections establish and maintain
  - Verify database migrations ran successfully
  - Check alembic_version table shows current revision
  - _Requirements: 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Run end-to-end tests against Render deployment
  - Run production smoke tests: `npm run test:production`
  - Test room creation and joining
  - Test complete game flow from start to finish
  - Test reconnection and session recovery
  - Verify all WebSocket updates work correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.2, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update documentation for Render deployment
  - Update README.md with Render deployment instructions
  - Add environment variable configuration steps for Render
  - Add Render-specific troubleshooting guidance
  - Remove all Fly.io references from documentation
  - _Requirements: 8.3, 8.4, 10.1, 10.2, 10.3, 10.4_

- [x] 9. Remove Fly.io configuration files
  - Delete `fly.toml` from repository (already removed)
  - Remove Fly.io deployment workflow from `.github/workflows/` (already removed)
  - Remove any Fly.io-specific scripts or configuration (already removed)
  - _Requirements: 8.1, 8.2_

- [ ] 10. Final verification and production readiness
  - Run complete test suite against production Render deployment
  - Verify all documentation is accurate and complete
  - Verify no Fly.io references remain in codebase
  - Confirm all services are running correctly on Render
  - Document final service URLs and configuration
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.4_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
