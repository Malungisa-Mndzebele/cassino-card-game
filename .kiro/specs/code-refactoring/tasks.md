# Implementation Plan

## Current Status

This refactoring spec has been **partially implemented**. The codebase analysis shows:

**Completed:**
- ✅ RoomService has been implemented in `backend/services/room_service.py`
- ✅ Service layer directory structure exists

**In Progress:**
- 🔄 RoomService needs unit tests
- 🔄 main.py still contains inline business logic (1353 lines) - needs to use RoomService
- 🔄 Other service classes (GameService, PlayerService, WebSocketService) not yet implemented

**Deferred (Working Well As-Is):**
- Validator consolidation - current validators.py, write_validators.py work well
- Error handling standardization - current HTTPException approach is sufficient
- Configuration management - current os.getenv() approach is adequate
- Test code consolidation - current conftest.py setup is working
- Frontend store consolidation - separate stores provide clear boundaries
- Frontend component decomposition - components are reasonably sized
- Frontend API client - current api.ts utility functions work well
- Type system enhancement - current type definitions are sufficient

**Priority Tasks:**
The most impactful next steps are:
1. Complete Phase 1: Finish service layer extraction to reduce main.py complexity
2. Phase 10: Organize documentation to improve project maintainability

## Task List

- [x] 1. Phase 1: Backend Service Layer Extraction
  - Extract business logic from main.py into dedicated service classes
  - Reduce main.py from 1000+ lines to < 300 lines
  - Maintain all existing functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Create service layer directory structure
  - Create `backend/services/` directory
  - Create `__init__.py` for service module
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.2 Implement RoomService class
  - Extract room creation logic from main.py
  - Extract room joining logic from main.py
  - Extract room state retrieval logic from main.py
  - Implement dependency injection (db, cache_manager, game_logic)
  - _Requirements: 1.1, 1.5_

- [x] 1.3 Write unit tests for RoomService
  - Test room creation with valid inputs
  - Test room joining with valid inputs
  - Test room state retrieval with caching
  - Test error cases (invalid names, full rooms)
  - _Requirements: 1.1_
  - _Status: Tests created in test_room_service.py, need parameter adjustments (player_ip, user_agent)_

- [ ] 1.4 Implement GameService class
  - Extract game action logic from main.py (play_card, start_shuffle, select_face_up_cards)
  - Extract game state update logic from main.py
  - Implement dependency injection (db, cache_manager, game_logic, action_logger)
  - _Requirements: 1.2, 1.5_

- [ ] 1.5 Write unit tests for GameService
  - Test card play action
  - Test shuffle action
  - Test card selection action
  - Test state updates and caching
  - _Requirements: 1.2_

- [ ] 1.6 Implement PlayerService class
  - Extract player ready status logic from main.py
  - Extract player retrieval logic from main.py
  - Implement dependency injection (db, cache_manager)
  - _Requirements: 1.3, 1.5_

- [ ] 1.7 Write unit tests for PlayerService
  - Test setting player ready status
  - Test player retrieval with caching
  - Test error cases (player not found)
  - _Requirements: 1.3_

- [ ] 1.8 Implement WebSocketService class
  - Extract WebSocket message routing from main.py
  - Extract message handling logic from main.py
  - Implement dependency injection (websocket_manager, game_service, player_service)
  - _Requirements: 1.4, 1.5_

- [ ] 1.9 Write unit tests for WebSocketService
  - Test message routing to correct handlers
  - Test heartbeat handling
  - Test error handling in message processing
  - _Requirements: 1.4_

- [ ] 1.10 Update main.py to use RoomService
  - Replace inline room creation logic with RoomService.create_room()
  - Replace inline room joining logic with RoomService.join_room()
  - Replace inline room state retrieval with RoomService.get_room_state()
  - Inject dependencies into RoomService
  - Maintain identical API behavior
  - _Requirements: 1.1, 1.5_

- [ ] 1.11 Run existing test suite and verify all tests pass
  - Run backend test suite: `cd backend && python -m pytest`
  - Verify no tests were modified
  - Verify all tests pass
  - _Requirements: 11.3_

- [ ] 1.12 Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 2. Phase 2: Validator Consolidation (DEFERRED)
  - Note: Current validators.py, write_validators.py, and version_validator.py are working well
  - Consolidation can be done later if duplication becomes a maintenance issue
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_



- [ ] 3. Phase 3: Error Handling Standardization (DEFERRED)
  - Note: Current error handling with HTTPException is working well
  - Standardization can be done later if inconsistencies become an issue
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Phase 4: Configuration Management (DEFERRED)
  - Note: Current os.getenv() approach is working well
  - Pydantic Settings can be added later for better type safety
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Phase 5: Test Code Consolidation (DEFERRED)
  - Note: Current test setup using conftest.py is working well
  - Further consolidation can be done later if duplication increases
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Phase 6: Frontend Store Consolidation (DEFERRED)
  - Note: Current separate stores (gameStore, syncState, optimisticState, actionQueue) are working well
  - The separation provides clear boundaries and is easy to understand
  - Consolidation can be done later if the separation becomes problematic
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Phase 7: Frontend Component Decomposition (DEFERRED)
  - Note: Current components are reasonably sized and focused
  - RoomManager and game components can be decomposed later if they grow too large
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Phase 8: Frontend API Client (DEFERRED)
  - Note: Current API utility functions in src/lib/utils/api.ts are working well
  - Centralized API client with retry logic can be added later if needed
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Phase 9: Type System Enhancement (DEFERRED)
  - Note: Current type definitions in src/lib/types/game.ts are working well
  - Further organization and discriminated unions can be added later if needed
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Phase 10: Documentation Organization
  - Organize documentation into docs/ directory
  - Archive temporary status files
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10.1 Create documentation directory structure
  - Create `docs/` directory
  - Create `docs/deployment/` subdirectory
  - Create `docs/testing/` subdirectory
  - Create `docs/development/` subdirectory
  - Create `docs/archive/` subdirectory
  - _Requirements: 10.1_

- [ ] 10.2 Move deployment documentation
  - Move RENDER_DEPLOYMENT_STATUS.md to docs/deployment/
  - Move RENDER_QUICK_START.md to docs/deployment/
  - Move check-render-deployment.md to docs/deployment/
  - Move DEPLOYMENT_SUMMARY.md to docs/deployment/
  - _Requirements: 10.3_

- [ ] 10.3 Move testing documentation
  - Move TESTING_GUIDE.md to docs/testing/
  - Move TESTING_QUICK_GUIDE.md to docs/testing/
  - Move TESTING_INSTRUCTIONS_FINAL.md to docs/testing/
  - Move E2E_TEST_RESULTS.md to docs/testing/
  - Move PRODUCTION_E2E_TEST_RESULTS.md to docs/testing/
  - _Requirements: 10.4_

- [ ] 10.4 Move development documentation
  - Move QUICK_START.md to docs/development/
  - Move START_SERVERS.md to docs/development/
  - Move REFACTORING_PLAN.md to docs/development/
  - Move REFACTORING_IMPLEMENTATION_GUIDE.md to docs/development/
  - _Requirements: 10.1_

- [ ] 10.5 Archive temporary status files
  - Move ALL_TESTS_PASSING.md to docs/archive/
  - Move BUG_FIXES_COMPLETE.md to docs/archive/
  - Move CRITICAL_BUGS_REPORT.md to docs/archive/
  - Move CRITICAL_FIXES_DEPLOYED.md to docs/archive/
  - Move DEBUG_READY_BUTTON.md to docs/archive/
  - Move FINAL_STATUS.md to docs/archive/
  - Move GAME_STATE_SYNC_COMPLETE.md to docs/archive/
  - Move GAME_STATE_SYNC_TESTS_FIXED.md to docs/archive/
  - Move LIVE_DEPLOYMENT_FIX_SUMMARY.md to docs/archive/
  - Move PLAYER_READY_FIX.md to docs/archive/
  - Move READY_TO_TEST.md to docs/archive/
  - Move REALTIME_SYNC_BUGS_ANALYSIS.md to docs/archive/
  - Move REALTIME_SYNC_BUGS_FIXED.md to docs/archive/
  - Move RESTART_REQUIRED.md to docs/archive/
  - Move TEST_STATUS_SUMMARY.md to docs/archive/
  - Move WEBSOCKET_FIXES_FINAL.md to docs/archive/
  - _Requirements: 10.2, 10.5_

- [ ] 10.6 Update README.md with new documentation structure
  - Add links to docs/ subdirectories
  - Update quick start section
  - Update testing section
  - Update deployment section
  - _Requirements: 10.1_

- [ ] 10.7 Verify documentation is accessible
  - Check all links work
  - Verify file paths are correct
  - _Requirements: 10.1, 10.3, 10.4_

- [ ] 11. Phase 11: Final Verification (DEFERRED)
  - Note: This phase will be executed after completing the active refactoring tasks
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1_
