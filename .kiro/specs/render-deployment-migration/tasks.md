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
  - Run deployment verification script against staging
  - Test all API endpoints work correctly
  - Test WebSocket connections establish and maintain
  - Verify database migrations ran successfully
  - Check alembic_version table shows current revision
  - _Requirements: 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Export and migrate data from Fly.io to Render
  - Export data from Fly.io PostgreSQL using pg_dump
  - Import data to Render PostgreSQL using psql
  - Verify row counts match between source and destination
  - Test session recovery with migrated data
  - _Requirements: 1.2, 6.2_

- [x] 8. Update frontend configuration for Render backend



  - Update `VITE_API_URL` environment variable to Render URL
  - Update `VITE_WS_URL` environment variable to Render WebSocket URL
  - Update CORS_ORIGINS in Render backend to include frontend domain
  - Deploy frontend with new configuration
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 9. Run end-to-end tests against Render deployment
  - Run full E2E test suite using Playwright
  - Test room creation and joining
  - Test complete game flow from start to finish
  - Test reconnection and session recovery
  - Verify all WebSocket updates work correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.2_

- [ ] 9.1 Write integration tests for Render deployment
  - Test full deployment flow from code push to running service
  - Test database migration on fresh database
  - Test Redis fallback when Redis is unavailable
  - Test session expiration cleanup
  - _Requirements: 4.4, 6.3, 6.4_

- [ ] 10. Production cutover
  - Perform final data sync from Fly.io to Render
  - Update frontend production environment to use Render backend URL
  - Monitor logs for errors during cutover
  - Run production smoke tests
  - Keep Fly.io running as backup for 24 hours
  - _Requirements: 7.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Remove Fly.io configuration files
  - Delete `fly.toml` from repository
  - Remove Fly.io deployment workflow from `.github/workflows/`
  - Remove any Fly.io-specific scripts or configuration
  - Commit changes to repository
  - _Requirements: 8.1, 8.2_

- [ ] 13. Update documentation for Render deployment
  - Update README.md with Render deployment instructions
  - Add environment variable configuration steps for Render
  - Add Render-specific troubleshooting guidance
  - Remove all Fly.io references from documentation
  - Update package.json deployment commands to reference Render
  - _Requirements: 8.3, 8.4, 10.1, 10.2, 10.3, 10.4_

- [ ] 14. Create Render troubleshooting guide
  - Document common Render deployment issues and solutions
  - Add instructions for viewing logs via Render dashboard
  - Add instructions for running migrations manually
  - Add instructions for scaling services
  - Document rollback procedures
  - _Requirements: 10.3_

- [ ] 15. Final verification and cleanup
  - Run complete test suite against production Render deployment
  - Verify all documentation is accurate and complete
  - Verify no Fly.io references remain in codebase
  - Create backup of Fly.io data before decommissioning
  - Schedule Fly.io service shutdown after confirmation period
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.4_

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
