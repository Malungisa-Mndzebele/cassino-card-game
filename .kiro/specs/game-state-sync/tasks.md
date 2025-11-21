# Implementation Plan: Game State Synchronization

## Overview

This implementation plan breaks down the Game State Synchronization feature into discrete, actionable coding tasks. Each task builds incrementally, ensuring the system remains functional throughout development.

The implementation follows a backend-first approach to establish event sourcing and version tracking, then adds frontend optimistic updates and conflict resolution, and finally integrates everything with comprehensive testing.

---

## Task List

- [x] 1. Backend: Database schema for event sourcing


  - Add version tracking to rooms
  - Create game_events table
  - Create state_snapshots table
  - Add indexes for performance
  - _Requirements: 1.1, 5.1, 5.2, 5.5_

- [x] 1.1 Create Alembic migration for version tracking



  - Add version column to rooms table (Integer, default 0)
  - Add checksum column to rooms table (String 64)
  - Add last_modified column (DateTime)
  - Add modified_by column (Integer, player_id)
  - Test migration up and down



  - _Requirements: 1.1, 4.4_

- [ ] 1.2 Create game_events table migration
  - Define GameEvent model with room_id, sequence_number, version, player_id, action_type, action_data, timestamp, checksum


  - Create unique constraint on (room_id, sequence_number)
  - Add index on (room_id, version)
  - Add foreign keys to rooms and players
  - _Requirements: 5.1, 5.2_

- [ ] 1.3 Create state_snapshots table migration
  - Define StateSnapshot model with room_id, version, state_data, checksum, created_at
  - Add index on (room_id, version)
  - Add foreign key to rooms
  - _Requirements: 5.5_

- [ ] 2. Backend: Event Store Engine
  - Implement event storage and retrieval
  - Add event replay functionality
  - Create snapshot management
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2.1 Implement EventStoreEngine class
  - Create event_store.py module
  - Define EventStoreEngine class with database session
  - Add configuration for snapshot interval (default 10 events)
  - _Requirements: 5.1_

- [ ] 2.2 Implement store_event method
  - Accept room_id, action, version parameters
  - Generate sequence_number (auto-increment per room)
  - Compute checksum of action data
  - Store event in game_events table
  - Return Event object
  - _Requirements: 5.1, 5.2_

- [ ] 2.3 Implement get_events method
  - Accept room_id, from_version, to_version parameters
  - Query events ordered by sequence_number
  - Return list of Event objects
  - _Requirements: 5.3_

- [ ] 2.4 Implement replay_events method
  - Accept room_id and optional from_snapshot
  - Load snapshot if provided, else start from empty state
  - Replay events in sequence order
  - Apply each event to reconstruct state
  - Return final GameState
  - _Requirements: 5.3, 5.4_

- [ ] 2.5 Implement create_snapshot method
  - Accept room_id and current state
  - Compute checksum of state
  - Store snapshot in state_snapshots table
  - Return StateSnapshot object
  - _Requirements: 5.5_

- [ ] 2.6 Add automatic snapshot creation
  - Check if snapshot needed after each event (every 10 events)
  - Create snapshot automatically
  - Clean up old snapshots (keep last 5)
  - _Requirements: 5.5_



- [ ] 3. Backend: State checksum computation
  - Implement checksum algorithm
  - Add checksum validation
  - Integrate with state updates
  - _Requirements: 4.4, 4.5, 10.1_

- [ ] 3.1 Implement compute_checksum function
  - Create state_checksum.py module
  - Extract canonical state representation (version, phase, turn, card counts, scores)
  - Serialize to deterministic JSON string
  - Compute SHA-256 hash
  - Return hex string
  - _Requirements: 4.4_

- [ ] 3.2 Implement validate_checksum function
  - Accept state and expected_checksum
  - Compute actual checksum
  - Compare with expected
  - Return boolean result
  - _Requirements: 4.5_

- [ ] 3.3 Add checksum to state responses
  - Update game_state_to_response to include checksum
  - Compute checksum before returning state
  - Include in GameStateResponse schema
  - _Requirements: 4.4_

- [ ] 4. Backend: Version management
  - Add version increment logic
  - Implement version validation
  - Handle version conflicts
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 4.1 Implement version increment on state updates
  - Update all state-modifying endpoints (play_card, set_player_ready, etc.)
  - Increment room.version before saving
  - Update room.last_modified timestamp
  - Set room.modified_by to player_id
  - _Requirements: 1.1_

- [ ] 4.2 Add version to API responses
  - Update GameStateResponse schema to include version
  - Include version in all state responses
  - _Requirements: 1.5_

- [ ] 4.3 Implement version validation
  - Create validate_version function
  - Accept client_version and server_version
  - Return validation result with gap detection
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 4.4 Add version conflict handling
  - Check client version on state updates
  - Reject updates with stale versions
  - Return error with current version
  - _Requirements: 1.3_

- [ ] 5. Backend: State Synchronizer service
  - Create StateSynchronizer class
  - Implement state update coordination
  - Add sync endpoint
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.1 Create StateSynchronizer class
  - Create state_synchronizer.py module
  - Initialize with EventStoreEngine, StateValidator, ConflictResolver
  - Add configuration parameters
  - _Requirements: 1.1_

- [ ] 5.2 Implement process_action method
  - Accept room_id, player_id, action
  - Load current state
  - Validate action
  - Apply action to state
  - Increment version
  - Compute checksum
  - Store event
  - Persist state
  - Return StateUpdateResult
  - _Requirements: 1.1, 4.1, 4.4, 5.1_

- [ ] 5.3 Implement get_current_state method
  - Accept room_id
  - Load state from database
  - Include version and checksum
  - Return GameState
  - _Requirements: 8.1_

- [ ] 5.4 Implement sync_client method
  - Accept room_id and client_version
  - Compare with server version
  - If versions match, return success
  - If client behind, return missing events or full state
  - If client ahead, return error
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 5.5 Add POST /api/sync endpoint
  - Accept room_id and client_version
  - Call StateSynchronizer.sync_client
  - Return SyncResult
  - _Requirements: 8.1, 8.5_

- [ ] 6. Backend: Conflict Resolver
  - Implement conflict detection
  - Add resolution strategy
  - Log conflicts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Create ConflictResolver class
  - Create conflict_resolver.py module
  - Initialize with StateValidator
  - Add configuration for conflict window (100ms)
  - _Requirements: 3.1_

- [ ] 6.2 Implement detect_conflict method
  - Accept two GameAction objects
  - Check timestamp difference (< 100ms)
  - Check if different players
  - Check if actions affect same cards
  - Return boolean
  - _Requirements: 3.1_

- [ ] 6.3 Implement resolve method
  - Accept current_state and list of conflicting_actions
  - Sort actions by server_timestamp
  - Apply first action
  - Validate subsequent actions against new state
  - Reject invalid actions
  - Return ResolutionResult with accepted/rejected lists
  - _Requirements: 3.2, 3.3, 6.1, 6.2_

- [ ] 6.4 Implement log_conflict method
  - Accept room_id and conflict details
  - Log to application logger
  - Store in conflict_log table (optional)
  - _Requirements: 6.5_

- [ ] 6.5 Add conflict notification
  - When action rejected due to conflict, create notification
  - Include reason and conflicting action details
  - Send to affected client
  - _Requirements: 3.4, 6.3_

- [ ] 7. Backend: Broadcast Controller
  - Implement state broadcasting
  - Add delta compression
  - Handle broadcast failures
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 7.1 Create BroadcastController class
  - Create broadcast_controller.py module
  - Initialize with WebSocket manager
  - Add retry configuration
  - _Requirements: 9.1_

- [ ] 7.2 Implement broadcast method
  - Accept room_id and state
  - Get all connected clients in room
  - Send state update to each client
  - Track delivery success/failure
  - Return BroadcastResult
  - _Requirements: 9.1, 9.2_

- [ ] 7.3 Implement compute_delta method
  - Accept old_state and new_state
  - Compare each field
  - Build StateDelta with only changed fields
  - Include version and base_version
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 7.4 Implement broadcast_delta method
  - Accept room_id and delta
  - Send delta to clients that have base_version
  - Send full state to clients with different versions
  - _Requirements: 13.1, 13.3, 13.4_

- [ ] 7.5 Implement retry_failed method
  - Accept room_id and client_id
  - Retry broadcast up to 3 times
  - Use exponential backoff
  - Mark client as desynced after max retries
  - _Requirements: 9.5_

- [ ] 7.6 Add broadcast compression
  - Compress state payload using gzip
  - Only compress if payload > 1KB
  - Include compression flag in message
  - _Requirements: 13.2_

- [ ] 8. Backend: State Validator enhancements
  - Add comprehensive validation rules
  - Implement state integrity checks
  - Add security validations
  - _Requirements: 4.1, 4.2, 4.3, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 8.1 Implement validate_action method
  - Accept current_state and action
  - Validate turn order
  - Validate player owns cards
  - Validate target cards exist
  - Validate game rules (capture/build/trail logic)
  - Return ValidationResult
  - _Requirements: 4.1, 11.3_

- [ ] 8.2 Implement validate_state_integrity method
  - Check total card count = 52
  - Check no duplicate cards
  - Check scores match captured cards
  - Check valid phase transitions
  - Return list of violations
  - _Requirements: 4.3_

- [ ] 8.3 Add turn validation
  - Verify current_turn matches expected player
  - Reject out-of-turn actions
  - Log repeated violations
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [ ] 8.4 Add security validations
  - Detect impossible state transitions
  - Detect card duplication attempts
  - Detect score manipulation
  - Log security events
  - _Requirements: 4.2_

- [ ] 9. Backend: Atomic state updates
  - Implement database transactions
  - Add rollback on failure
  - Ensure consistency
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 9.1 Wrap state updates in transactions
  - Use database session transactions
  - Update all related fields atomically
  - Commit only if all succeed
  - _Requirements: 12.1, 12.3_

- [ ] 9.2 Add rollback on validation failure
  - If validation fails, rollback transaction
  - Maintain previous state
  - Return error to client
  - _Requirements: 12.2_

- [ ] 9.3 Add error logging
  - Log transaction failures
  - Include state before/after
  - Include error details
  - _Requirements: 12.4_

- [ ] 10. Backend: State persistence
  - Implement write-ahead logging
  - Add state recovery
  - Handle server restarts
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 10.1 Add write-ahead logging
  - Log state changes before committing
  - Use separate WAL file per room
  - Flush to disk immediately
  - _Requirements: 14.5_

- [ ] 10.2 Implement state recovery on startup
  - Load all active rooms from database
  - Validate state integrity
  - Replay WAL if needed
  - _Requirements: 14.2, 14.3_

- [ ] 10.3 Add state corruption detection
  - Check checksums on load
  - Verify card counts
  - Mark corrupted games
  - _Requirements: 14.3, 14.4_

- [ ] 11. Backend: Performance monitoring
  - Add metrics collection
  - Implement performance logging
  - Create monitoring endpoints
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 11.1 Add processing time measurement
  - Measure time for each state update
  - Log if > 500ms
  - Track p95 and p99 percentiles
  - _Requirements: 15.1, 15.2_

- [ ] 11.2 Add broadcast latency tracking
  - Measure time to reach each client
  - Log if > 1 second
  - Track per-client latency
  - _Requirements: 15.3, 15.4_

- [ ] 11.3 Create metrics endpoint
  - Add GET /api/metrics endpoint
  - Return state update rate, conflict rate, sync latency
  - Include percentile data
  - _Requirements: 15.5_

- [ ] 11.4 Add Prometheus metrics (optional)
  - Expose metrics in Prometheus format
  - Include counters, gauges, histograms
  - _Requirements: 15.5_



- [ ] 12. Frontend: Optimistic State Manager
  - Create useOptimisticState hook
  - Implement optimistic updates
  - Add rollback mechanism
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 12.1 Create useOptimisticState hook structure
  - Define hook state: localState, pendingActions, stateVersion
  - Add configuration: maxPendingActions
  - Return state and methods
  - _Requirements: 2.1_

- [ ] 12.2 Implement applyOptimistic method
  - Generate unique action ID
  - Apply action to local state immediately
  - Increment local version
  - Add to pendingActions list
  - Update UI
  - Send to server
  - _Requirements: 2.1, 2.2_

- [ ] 12.3 Implement confirmAction method
  - Accept actionId and serverState
  - Find pending action
  - Mark as confirmed
  - Update local state to match server
  - Remove from pending list
  - _Requirements: 2.3_

- [ ] 12.4 Implement rejectAction method
  - Accept actionId and reason
  - Find pending action
  - Rollback local state
  - Remove from pending list
  - Show error message to user
  - _Requirements: 2.4_

- [ ] 12.5 Add pending action UI indicators
  - Show spinner or opacity on pending cards
  - Display "Processing..." tooltip
  - Clear indicator on confirmation
  - _Requirements: 2.5_

- [ ] 13. Frontend: State Validator
  - Create state validation utilities
  - Implement checksum computation
  - Add desync detection
  - _Requirements: 4.4, 4.5, 10.1, 10.2_

- [ ] 13.1 Create stateValidator.ts module
  - Define StateValidator interface
  - Implement validation functions
  - _Requirements: 4.4_

- [ ] 13.2 Implement computeChecksum function
  - Extract canonical state representation
  - Match backend algorithm exactly
  - Use crypto.subtle.digest for SHA-256
  - Return hex string
  - _Requirements: 4.4_

- [ ] 13.3 Implement validateChecksum function
  - Accept state and expectedChecksum
  - Compute actual checksum
  - Compare values
  - Return boolean
  - _Requirements: 4.5_

- [ ] 13.4 Implement detectDesync function
  - Accept localState and serverState
  - Compare versions
  - Compare checksums
  - Return desync details
  - _Requirements: 10.1_

- [ ] 13.5 Add desync notification UI
  - Show warning banner when desynced
  - Display "Resync" button
  - Auto-hide after successful resync
  - _Requirements: 10.2_

- [ ] 14. Frontend: Action Queue
  - Create useActionQueue hook
  - Implement queue management
  - Add retry logic
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14.1 Create useActionQueue hook structure
  - Define state: queue, isProcessing, maxQueueSize
  - Add configuration: maxRetries, retryDelay
  - Return queue methods
  - _Requirements: 7.1_

- [ ] 14.2 Implement enqueue method
  - Accept action
  - Check queue size limit
  - Add to queue with metadata
  - Trigger flush if not processing
  - _Requirements: 7.1, 7.4_

- [ ] 14.3 Implement flush method
  - Process queue in order
  - Send each action to server
  - Handle success/failure
  - Apply exponential backoff on retry
  - _Requirements: 7.2, 7.3_

- [ ] 14.4 Add queue overflow handling
  - Show warning when queue > 5 actions
  - Prevent enqueue when queue full
  - Display error message
  - _Requirements: 7.4_

- [ ] 14.5 Add queue persistence
  - Store queue in sessionStorage
  - Restore on page reload
  - Clear on successful flush
  - _Requirements: 7.2_

- [ ] 15. Frontend: Version tracking
  - Add version to local state
  - Implement version comparison
  - Handle version conflicts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 15.1 Add version to GameState type
  - Update gameTypes.ts
  - Add version: number field
  - Add checksum: string field
  - _Requirements: 1.5_

- [ ] 15.2 Update useGameState hook
  - Track local version
  - Update version on state changes
  - Include version in API calls
  - _Requirements: 1.1_

- [ ] 15.3 Implement version comparison
  - Compare received version with local
  - Reject older versions
  - Request missing updates for gaps
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 15.4 Add version conflict handling
  - Show error when version conflict detected
  - Offer to resync
  - Log conflict details
  - _Requirements: 1.3_

- [ ] 16. Frontend: State synchronization
  - Implement sync on reconnection
  - Add manual resync
  - Handle sync failures
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.2, 10.3, 10.4, 10.5_

- [ ] 16.1 Create useSyncState hook
  - Define sync methods
  - Track sync status
  - Handle sync errors
  - _Requirements: 8.1_

- [ ] 16.2 Implement syncOnReconnect method
  - Trigger on WebSocket reconnect
  - Call /api/sync endpoint with local version
  - Apply server state if outdated
  - Replay pending actions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 16.3 Implement manualResync method
  - Fetch current state from server
  - Replace local state completely
  - Clear pending actions
  - Reset version
  - _Requirements: 10.3_

- [ ] 16.4 Add resync UI
  - Show "Resync" button in desync banner
  - Display sync progress
  - Show success/failure message
  - _Requirements: 10.2, 10.3_

- [ ] 16.5 Add automatic resync
  - Trigger after 3 consecutive checksum mismatches
  - Show notification to user
  - Log resync events
  - _Requirements: 10.5_

- [ ] 17. Frontend: Delta application
  - Implement delta parsing
  - Apply incremental updates
  - Handle delta failures
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 17.1 Create applyDelta function
  - Accept current state and delta
  - Verify base_version matches
  - Apply changed fields
  - Compute new checksum
  - Return updated state
  - _Requirements: 13.1, 13.3_

- [ ] 17.2 Update WebSocket message handler
  - Detect delta vs full state messages
  - Apply delta if base version matches
  - Request full state if base version mismatch
  - _Requirements: 13.3, 13.4_

- [ ] 17.3 Add delta decompression
  - Detect compressed payloads
  - Decompress using pako library
  - Parse decompressed JSON
  - _Requirements: 13.2_

- [ ] 18. Frontend: Conflict handling UI
  - Show conflict notifications
  - Display rejection reasons
  - Handle rollbacks gracefully
  - _Requirements: 3.3, 3.4, 6.3_

- [ ] 18.1 Create ConflictNotification component
  - Display when action rejected due to conflict
  - Show reason: "Opponent played first"
  - Include retry option
  - Auto-dismiss after 5 seconds
  - _Requirements: 3.4, 6.3_

- [ ] 18.2 Add rollback animation
  - Animate card returning to hand
  - Show brief "Action cancelled" message
  - Highlight opponent's action that caused conflict
  - _Requirements: 3.3_

- [ ] 19. Frontend: Integration with existing hooks
  - Update useGameActions
  - Update useWebSocket
  - Update useGameState
  - _Requirements: All frontend requirements_

- [ ] 19.1 Update useGameActions hook
  - Integrate useOptimisticState
  - Apply optimistic updates before API calls
  - Handle confirmations and rejections
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 19.2 Update useWebSocket hook
  - Handle state_update messages with versions
  - Apply delta updates
  - Trigger sync on version mismatch
  - _Requirements: 1.2, 9.2, 9.3, 13.1_

- [ ] 19.3 Update useGameState hook
  - Add version tracking
  - Add checksum validation
  - Integrate with state validator
  - _Requirements: 1.1, 4.4, 4.5_

- [ ] 19.4 Update App.tsx
  - Add desync notification banner
  - Add conflict notification area
  - Wire up resync button
  - _Requirements: 10.2, 10.3, 3.4_

- [ ] 20. Testing: Backend unit tests
  - Test event store
  - Test state synchronizer
  - Test conflict resolver
  - Test broadcast controller
  - _Requirements: All backend requirements_

- [ ] 20.1 Write tests for EventStoreEngine
  - Test store_event
  - Test get_events
  - Test replay_events
  - Test create_snapshot
  - Test automatic snapshot creation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 20.2 Write tests for checksum computation
  - Test compute_checksum with various states
  - Test deterministic output
  - Test validate_checksum
  - _Requirements: 4.4, 4.5_

- [ ] 20.3 Write tests for version management
  - Test version increment
  - Test version validation
  - Test version conflict detection
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 20.4 Write tests for StateSynchronizer
  - Test process_action
  - Test get_current_state
  - Test sync_client
  - Test version gap handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3_

- [ ] 20.5 Write tests for ConflictResolver
  - Test detect_conflict
  - Test resolve with multiple actions
  - Test server-wins strategy
  - Test conflict logging
  - _Requirements: 3.1, 3.2, 6.1, 6.2, 6.5_

- [ ] 20.6 Write tests for BroadcastController
  - Test broadcast to multiple clients
  - Test compute_delta
  - Test broadcast_delta
  - Test retry logic
  - Test compression
  - _Requirements: 9.1, 9.2, 13.1, 13.2, 9.5_

- [ ] 20.7 Write tests for StateValidator
  - Test validate_action
  - Test validate_state_integrity
  - Test turn validation
  - Test security validations
  - _Requirements: 4.1, 4.2, 4.3, 11.1, 11.3_

- [ ] 20.8 Write tests for atomic updates
  - Test transaction rollback
  - Test partial update rejection
  - Test consistency maintenance
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 21. Testing: Frontend unit tests
  - Test optimistic state manager
  - Test state validator
  - Test action queue
  - Test sync logic
  - _Requirements: All frontend requirements_

- [ ] 21.1 Write tests for useOptimisticState
  - Test applyOptimistic
  - Test confirmAction
  - Test rejectAction
  - Test rollback
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 21.2 Write tests for stateValidator
  - Test computeChecksum
  - Test validateChecksum
  - Test detectDesync
  - _Requirements: 4.4, 4.5, 10.1_

- [ ] 21.3 Write tests for useActionQueue
  - Test enqueue
  - Test flush
  - Test retry logic
  - Test queue overflow
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 21.4 Write tests for version tracking
  - Test version comparison
  - Test version conflict handling
  - Test gap detection
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 21.5 Write tests for useSyncState
  - Test syncOnReconnect
  - Test manualResync
  - Test automatic resync
  - _Requirements: 8.1, 8.2, 8.3, 10.5_

- [ ] 21.6 Write tests for delta application
  - Test applyDelta
  - Test base version validation
  - Test decompression
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 22. Testing: Integration tests
  - Test complete sync flow
  - Test conflict resolution
  - Test state recovery
  - Test concurrent actions
  - _Requirements: All requirements_

- [ ] 22.1 Write integration test for optimistic update flow
  - Player makes action
  - Verify immediate local update
  - Verify server confirmation
  - Verify broadcast to opponent
  - Verify version incremented
  - _Requirements: 2.1, 2.2, 2.3, 9.1, 1.1_

- [ ] 22.2 Write integration test for conflict resolution
  - Two players act simultaneously
  - Verify both sent to server
  - Verify one accepted, one rejected
  - Verify rejected player gets rollback
  - Verify both players sync to same state
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2_

- [ ] 22.3 Write integration test for state recovery
  - Client becomes desynced
  - Verify desync detection
  - Verify sync request
  - Verify state replaced
  - Verify checksum matches
  - _Requirements: 10.1, 10.2, 10.3, 8.1, 8.2_

- [ ] 22.4 Write integration test for event replay
  - Create game with 20 actions
  - Create snapshot at action 10
  - Replay from snapshot
  - Verify final state matches
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 22.5 Write integration test for delta broadcasting
  - Make state change
  - Verify delta computed
  - Verify delta sent to clients
  - Verify clients apply delta
  - Verify full state sent if base version mismatch
  - _Requirements: 13.1, 13.3, 13.4, 9.2_

- [ ] 23. Testing: E2E tests with Playwright
  - Test concurrent actions
  - Test state sync
  - Test conflict resolution
  - _Requirements: All requirements_

- [ ] 23.1 Write E2E test for concurrent actions
  - Two players in game
  - Both try to capture same card simultaneously
  - Verify only one succeeds
  - Verify both see same final state
  - Verify versions match
  - _Requirements: 3.1, 3.2, 3.3, 1.1_

- [ ] 23.2 Write E2E test for optimistic updates
  - Player makes action
  - Verify immediate UI update
  - Simulate network delay
  - Verify confirmation after delay
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 23.3 Write E2E test for desync recovery
  - Simulate checksum mismatch
  - Verify desync banner shown
  - Click resync button
  - Verify state recovered
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 23.4 Write E2E test for action queue
  - Disconnect network
  - Make multiple actions
  - Verify actions queued
  - Reconnect network
  - Verify actions sent and processed
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 24. Performance testing
  - Test sync latency
  - Test event store performance
  - Test broadcast performance
  - Test delta compression
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 13.5_

- [ ] 24.1 Write performance test for sync latency
  - Measure time from action to all clients updated
  - Run with 10 concurrent games
  - Verify p95 < 200ms, p99 < 500ms
  - _Requirements: 15.3, 15.4_

- [ ] 24.2 Write performance test for event store
  - Measure event write latency
  - Test with 1000 events/second
  - Verify p95 < 50ms
  - _Requirements: 15.1_

- [ ] 24.3 Write performance test for delta compression
  - Measure payload size reduction
  - Compare full state vs delta
  - Verify > 70% reduction for typical updates
  - _Requirements: 13.5_

- [ ] 24.4 Write performance test for conflict resolution
  - Simulate 10 concurrent conflicts
  - Measure resolution time
  - Verify < 100ms per conflict
  - _Requirements: 15.1_

- [ ] 25. Documentation and deployment
  - Update API documentation
  - Create state sync guide
  - Update monitoring dashboards
  - Deploy to production
  - _Requirements: All requirements_

- [ ] 25.1 Update API documentation
  - Document version and checksum fields
  - Document /api/sync endpoint
  - Document state_update WebSocket messages
  - Document delta format
  - _Requirements: All requirements_

- [ ] 25.2 Create developer guide
  - Explain version tracking
  - Explain optimistic updates
  - Explain conflict resolution
  - Provide troubleshooting tips
  - _Requirements: All requirements_

- [ ] 25.3 Update monitoring dashboards
  - Add sync latency metrics
  - Add conflict rate metrics
  - Add desync rate metrics
  - Add event store performance metrics
  - Set up alerts
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 25.4 Create deployment runbook
  - Document migration steps
  - List rollback procedures
  - Describe monitoring checklist
  - Include troubleshooting guide
  - _Requirements: All requirements_

---

## Implementation Notes

### Execution Order
1. Backend infrastructure (tasks 1-11): Event store, versioning, sync
2. Frontend components (tasks 12-19): Optimistic updates, validation, sync
3. Testing (tasks 20-24): Unit, integration, E2E, performance
4. Documentation and deployment (task 25)

### Testing Approach
- Write tests alongside implementation
- All tests are required for comprehensive coverage
- Integration tests verify component interactions
- E2E tests validate user-facing behavior
- Performance tests ensure latency targets met

### Dependencies
- Task 2 depends on task 1 (database schema)
- Task 5 depends on tasks 2, 3, 4 (event store, checksum, versioning)
- Tasks 12-18 can be done in parallel
- Task 19 integrates all frontend work
- Tasks 20-24 can be done in parallel after implementation

### Estimated Timeline
- Backend (tasks 1-11): 2 weeks
- Frontend (tasks 12-19): 2 weeks
- Testing (tasks 20-24): 1.5 weeks
- Documentation (task 25): 0.5 weeks
- **Total: 6 weeks**

---

**Last Updated:** November 12, 2025  
**Status:** Ready for Implementation
