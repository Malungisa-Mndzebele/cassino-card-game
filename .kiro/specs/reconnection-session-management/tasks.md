# Implementation Plan: Reconnection & Session Management

## Overview

This implementation plan breaks down the Reconnection & Session Management feature into discrete, actionable coding tasks. Each task builds incrementally on previous work, ensuring the system remains functional throughout development.

The implementation follows a backend-first approach to establish the infrastructure, then adds frontend capabilities, and finally integrates everything with comprehensive testing.

---

## Task List

- [x] 1. Backend: Database schema and migrations



  - Add GameSession table enhancements for session management
  - Create migration scripts for session_token, disconnected_at, and connection_count columns
  - Add indexes for performance optimization
  - _Requirements: 2.1, 2.2, 10.1_



- [ ] 1.1 Create Alembic migration for session management
  - Write migration to add session_token column (String 256, unique, indexed)
  - Add disconnected_at column (DateTime, nullable)
  - Add reconnected_at column (DateTime, nullable)
  - Add connection_count column (Integer, default 0)
  - Add user_agent column (String 256)
  - Test migration up and down on local SQLite


  - _Requirements: 2.1, 2.2_

- [x] 1.2 Create GameActionLog table for action replay


  - Define GameActionLog model with room_id, player_id, action_type, action_data, timestamp, sequence_number
  - Create migration for new table
  - Add foreign key relationships to rooms and players
  - Add index on (room_id, sequence_number) for fast retrieval
  - _Requirements: 4.5, 7.4_



- [ ] 2. Backend: Session token generation and validation
  - Implement cryptographic token generation with HMAC-SHA256
  - Create token validation logic

  - Add token storage and retrieval methods
  - _Requirements: 2.5, 10.1, 10.2, 10.3_

- [ ] 2.1 Implement SessionToken data class
  - Create SessionToken dataclass with roomId, playerId, playerName, signature, nonce, createdAt, expiresAt, version
  - Add method to serialize token to string (base64 encoded JSON)

  - Add method to deserialize token from string
  - _Requirements: 2.5, 10.1_

- [ ] 2.2 Implement token signature generation
  - Create generate_signature function using HMAC-SHA256



  - Use server-side secret from environment variable
  - Include roomId, playerId, createdAt, and nonce in signature payload
  - Generate random nonce using secrets module
  - _Requirements: 10.1, 10.2_


- [ ] 2.3 Implement token validation logic
  - Create validate_token function to verify signature
  - Check token expiration (24 hours from creation)
  - Verify token version compatibility
  - Return validation result with error details
  - _Requirements: 10.2, 10.3, 10.5_


- [ ] 3. Backend: SessionManager service
  - Create SessionManager class for session CRUD operations
  - Implement session creation, retrieval, and cleanup
  - Add heartbeat tracking
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2_


- [ ] 3.1 Implement create_session method
  - Accept room_id, player_id, player_name, ip_address, user_agent
  - Generate session token using token generation logic
  - Store session in database with all metadata
  - Return SessionToken object

  - _Requirements: 2.1, 10.4_

- [ ] 3.2 Implement validate_session method
  - Accept session token string
  - Validate token signature and expiration

  - Retrieve session from database
  - Check if session is still active
  - Return Session object or None
  - _Requirements: 2.3, 10.2_


- [ ] 3.3 Implement update_heartbeat method
  - Accept session_id
  - Update last_heartbeat timestamp in database



  - Mark session as active if it was disconnected
  - _Requirements: 3.1, 3.2_

- [x] 3.4 Implement mark_disconnected method

  - Accept session_id
  - Set disconnected_at timestamp
  - Keep session active for recovery window
  - _Requirements: 5.1_

- [ ] 3.5 Implement check_abandoned_games method
  - Query sessions disconnected > 5 minutes

  - Return list of room_ids with abandoned players
  - Mark games as abandoned in database
  - _Requirements: 5.2, 5.3_

- [ ] 3.6 Implement cleanup_expired_sessions method
  - Query sessions older than 24 hours

  - Delete expired sessions from database
  - Return count of cleaned sessions
  - _Requirements: 10.5_

- [x] 4. Backend: WebSocket connection enhancements

  - Update WebSocket manager to handle reconnection
  - Implement session validation on connection
  - Add connection status broadcasting
  - _Requirements: 1.5, 2.3, 9.1, 9.2, 9.3_




- [ ] 4.1 Update WebSocket connect handler
  - Accept session_token parameter in connection request
  - Validate session token using SessionManager
  - Reject connection if token invalid (send 401)
  - Store connection with session_id mapping

  - Broadcast connection status to room
  - _Requirements: 1.5, 2.3, 10.2_

- [ ] 4.2 Update WebSocket disconnect handler
  - Mark session as disconnected in SessionManager

  - Keep session active for 5 minutes
  - Broadcast disconnection status to opponent
  - Start abandoned game timer
  - _Requirements: 5.1, 9.2_

- [x] 4.3 Implement connection status broadcast


  - Create broadcast_connection_status method
  - Send connection status message to all players in room


  - Include player_id, connected status, disconnected_since timestamp
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 4.4 Add concurrent connection detection
  - Check if player already has active WebSocket in room

  - Send 409 Conflict if concurrent connection detected
  - Provide option to take over session
  - Close old connection if takeover confirmed
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 5. Backend: Heartbeat protocol implementation
  - Add ping/pong message handlers

  - Implement heartbeat timeout detection
  - Update session heartbeat timestamps
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Implement ping message handler

  - Accept ping message with timestamp
  - Update session heartbeat in SessionManager
  - Respond with pong message including server timestamp
  - _Requirements: 3.1, 3.2_


- [ ] 5.2 Implement heartbeat timeout checker
  - Create background task to check heartbeat timeouts
  - Run every 30 seconds
  - Mark sessions as unhealthy if no heartbeat > 15 seconds
  - Trigger disconnection if no heartbeat > 30 seconds


  - _Requirements: 3.3, 3.4_

- [ ] 5.3 Add heartbeat monitoring endpoint
  - Create GET /api/heartbeat/{room_id} endpoint
  - Return heartbeat status for all players in room

  - Include last_heartbeat timestamp and health status
  - _Requirements: 3.3, 3.4_

- [ ] 6. Backend: Game state recovery service
  - Create StateRecoveryService for state retrieval


  - Implement missed actions summary
  - Add state consistency validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [ ] 6.1 Implement get_recovery_state method
  - Accept room_id and player_id
  - Retrieve current game state from database
  - Calculate time player was disconnected
  - Get opponent connection status

  - Return RecoveryState object
  - _Requirements: 4.1, 4.2_

- [x] 6.2 Implement get_missed_actions method



  - Accept room_id, player_id, since timestamp
  - Query GameActionLog for actions after timestamp
  - Return list of GameAction objects ordered by sequence
  - _Requirements: 4.5_


- [ ] 6.3 Implement missed actions summary
  - Convert missed actions to human-readable summary
  - Example: "Opponent captured 3 cards", "Your turn"
  - Limit to last 5 actions
  - _Requirements: 4.5_


- [ ] 6.4 Add state consistency validation
  - Verify game state integrity (card counts, scores)
  - Check for duplicate cards across hands/table/captured
  - Validate turn order and phase transitions
  - Log inconsistencies for debugging
  - _Requirements: 4.1_


- [ ] 7. Backend: Game action logging
  - Log all game actions to GameActionLog table



  - Add sequence numbers for ordering
  - Implement action deduplication
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7.1 Create log_game_action function

  - Accept room_id, player_id, action_type, action_data
  - Generate sequence number (auto-increment per room)
  - Store action in GameActionLog table
  - _Requirements: 7.4_


- [ ] 7.2 Update play_card endpoint to log actions
  - Call log_game_action before processing card play
  - Include card_id, action_type (capture/build/trail), target_cards
  - Generate unique action_id for deduplication
  - _Requirements: 7.1, 7.2_


- [ ] 7.3 Implement action deduplication
  - Check for duplicate action_id before processing
  - Return cached result if action already processed
  - Prevent double-processing on reconnection retry
  - _Requirements: 7.3_

- [ ] 7.4 Add action acknowledgment response
  - Return action_id in play_card response
  - Include timestamp and sequence number
  - Frontend can verify action was processed
  - _Requirements: 7.1_

- [ ] 8. Backend: Abandoned game handling
  - Implement abandoned game detection
  - Add claim victory endpoint
  - Handle reconnection to abandoned games
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.1 Create abandoned game checker background task
  - Run every 60 seconds
  - Call SessionManager.check_abandoned_games()
  - Broadcast abandoned game notification to connected players
  - _Requirements: 5.2, 5.3_

- [ ] 8.2 Implement POST /api/game/claim-victory endpoint
  - Accept room_id and player_id
  - Verify opponent disconnected > 5 minutes
  - Award win to claiming player
  - Update game status to finished
  - Broadcast game end to all connections
  - _Requirements: 5.4_

- [ ] 8.3 Handle reconnection to abandoned game
  - Check if game was marked abandoned
  - If opponent chose "Wait", allow rejoin
  - If opponent claimed victory, show game ended message
  - _Requirements: 5.5_

- [ ] 9. Frontend: Session token management
  - Create SessionTokenManager utility
  - Implement localStorage operations
  - Add token validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 9.1 Create SessionToken interface
  - Define TypeScript interface matching backend structure
  - Add helper methods for serialization/deserialization
  - _Requirements: 2.5_

- [ ] 9.2 Implement SessionTokenManager class
  - Create createToken method to generate and store token
  - Implement getToken method to retrieve from localStorage
  - Add validateToken method to check expiration
  - Implement clearToken and clearAllTokens methods
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 9.3 Add token storage helpers
  - Use localStorage key format: casino_session_${roomId}
  - Implement error handling for localStorage quota exceeded
  - Add fallback to sessionStorage if localStorage unavailable
  - _Requirements: 2.1_

- [ ] 10. Frontend: Reconnection handler hook
  - Create useReconnection custom hook
  - Implement exponential backoff logic
  - Add reconnection state management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 10.1 Create useReconnection hook structure
  - Define hook state: isReconnecting, reconnectAttempts, maxAttempts
  - Add configuration: baseDelay, maxDelay, maxAttempts
  - Return reconnection methods and state
  - _Requirements: 1.1, 1.2_

- [ ] 10.2 Implement exponential backoff algorithm
  - Calculate delay: baseDelay * (2 ^ attemptNumber)
  - Add random jitter: 0-1000ms
  - Cap maximum delay at 16 seconds
  - _Requirements: 1.3_

- [ ] 10.3 Implement startReconnection method
  - Retrieve session token from SessionTokenManager
  - Attempt WebSocket connection with token
  - Apply exponential backoff between attempts
  - Track attempt count
  - _Requirements: 1.1, 1.3, 1.5_

- [ ] 10.4 Implement reconnection callbacks
  - onReconnectSuccess: Reset attempts, update UI
  - onReconnectFailure: Increment attempts, schedule retry
  - onMaxAttemptsReached: Show manual retry option
  - _Requirements: 1.4_

- [ ] 10.5 Add automatic reconnection trigger
  - Listen for WebSocket close events
  - Automatically start reconnection if close was unexpected
  - Don't reconnect if user explicitly left game
  - _Requirements: 1.1_

- [ ] 11. Frontend: Heartbeat client hook
  - Create useHeartbeat custom hook
  - Implement ping/pong protocol
  - Add connection health detection
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11.1 Create useHeartbeat hook structure
  - Define state: isHealthy, lastPongTime, consecutiveFailures
  - Add configuration: pingInterval (10s), pongTimeout (15s)
  - Return health status and control methods
  - _Requirements: 3.1, 3.2_

- [ ] 11.2 Implement ping sender
  - Send ping message every 10 seconds
  - Include client timestamp in ping
  - Track pending pings
  - _Requirements: 3.1_

- [ ] 11.3 Implement pong handler
  - Listen for pong messages from server
  - Update lastPongTime
  - Reset consecutiveFailures counter
  - Calculate round-trip time
  - _Requirements: 3.2_

- [ ] 11.4 Implement health detection logic
  - Check if time since last pong > 15 seconds
  - Increment consecutiveFailures if timeout
  - Mark unhealthy after 3 consecutive failures
  - Mark healthy after 3 consecutive successes
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 11.5 Trigger reconnection on timeout
  - If consecutiveFailures >= 3, trigger reconnection
  - Call useReconnection.startReconnection()
  - _Requirements: 3.3_

- [ ] 12. Frontend: Connection status UI component
  - Create ConnectionStatus component
  - Implement visual indicators for all states
  - Add manual retry button
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.1 Create ConnectionStatus component
  - Accept props: status, reconnectAttempt, maxAttempts, onManualRetry
  - Render status indicator in top-right corner
  - Use Tailwind CSS for styling
  - _Requirements: 8.1, 8.5_

- [ ] 12.2 Implement status indicators
  - Connected: Green dot + "Connected" text
  - Unhealthy: Yellow dot + "Connection unstable" text
  - Reconnecting: Orange spinner + "Reconnecting... (X/5)" text
  - Disconnected: Red dot + "Disconnected" text + Retry button
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12.3 Add manual retry button
  - Show button only when status is "disconnected"
  - Call onManualRetry callback when clicked
  - Disable button while retry in progress
  - _Requirements: 8.4_

- [ ] 12.4 Add opponent connection status
  - Accept opponentConnected and opponentDisconnectedDuration props
  - Show opponent status below player status
  - Display timer if opponent disconnected > 1 minute
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 13. Frontend: Multi-tab session management
  - Implement BroadcastChannel for tab coordination
  - Add session transfer logic
  - Handle concurrent session detection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13.1 Create useMultiTab hook
  - Use BroadcastChannel API for tab communication
  - Detect when game opened in another tab
  - Broadcast session takeover messages
  - _Requirements: 6.1, 6.5_

- [ ] 13.2 Implement session conflict detection
  - Listen for "session_active" messages from other tabs
  - Show warning dialog when conflict detected
  - Offer "Take Over" and "Cancel" options
  - _Requirements: 6.1, 6.2_

- [ ] 13.3 Implement session transfer
  - Broadcast "session_takeover" message to other tabs
  - Close WebSocket in old tab
  - Transfer session to new tab
  - Show "Session moved" message in old tab
  - _Requirements: 6.3, 6.4_

- [ ] 14. Frontend: Integration with existing hooks
  - Update useWebSocket to use reconnection
  - Integrate session tokens with room joining
  - Add heartbeat to WebSocket connection
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 14.1 Update useWebSocket hook
  - Import and use useReconnection hook
  - Import and use useHeartbeat hook
  - Pass session token when connecting
  - Handle reconnection events
  - _Requirements: 1.1, 1.5_

- [ ] 14.2 Update useRoomActions hook
  - Create session token after successful room join
  - Store token using SessionTokenManager
  - Pass token to WebSocket connection
  - _Requirements: 2.1_

- [ ] 14.3 Update useConnectionState hook
  - Add reconnection state fields
  - Add heartbeat health state
  - Update connection status based on reconnection/heartbeat
  - _Requirements: 1.2, 3.3_

- [ ] 14.4 Add ConnectionStatus to App.tsx
  - Import ConnectionStatus component
  - Place in top-right corner (below settings)
  - Pass connection state from useConnectionState
  - Wire up manual retry callback
  - _Requirements: 8.5_

- [ ] 15. Frontend: Game state recovery UI
  - Show reconnection progress
  - Display missed actions summary
  - Highlight current turn after reconnection
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 15.1 Create ReconnectionProgress component
  - Show loading spinner during state recovery
  - Display "Recovering game state..." message
  - Show progress percentage if available
  - _Requirements: 4.2_

- [ ] 15.2 Create MissedActionsModal component
  - Display after successful reconnection
  - Show summary of actions that occurred during disconnect
  - Include "Continue" button to dismiss
  - Auto-dismiss after 5 seconds
  - _Requirements: 4.5_

- [ ] 15.3 Add turn highlight after reconnection
  - Flash current player indicator if it's your turn
  - Show "Your turn!" notification
  - Highlight playable cards
  - _Requirements: 4.3, 4.4_

- [ ] 16. Frontend: Abandoned game UI
  - Show opponent disconnection timer
  - Add claim victory dialog
  - Handle reconnection to abandoned game
  - _Requirements: 5.3, 5.4, 5.5, 9.4_

- [ ] 16.1 Create OpponentDisconnectedBanner component
  - Show when opponent disconnected > 2 minutes
  - Display timer showing disconnection duration
  - Show "Opponent disconnected" message
  - _Requirements: 5.1, 9.4_

- [ ] 16.2 Create AbandonedGameDialog component
  - Show when opponent disconnected > 5 minutes
  - Display "Opponent has abandoned the game" message
  - Offer "Wait" and "Claim Victory" buttons
  - Call claim victory API when button clicked
  - _Requirements: 5.3, 5.4_

- [ ] 16.3 Handle reconnection to abandoned game
  - Check game status on reconnection
  - If game ended, show final results
  - If opponent waiting, resume game normally
  - _Requirements: 5.5_

- [ ] 17. Testing: Backend unit tests
  - Test session token generation and validation
  - Test SessionManager methods
  - Test heartbeat protocol
  - Test state recovery
  - _Requirements: All backend requirements_

- [ ] 17.1 Write tests for session token operations
  - Test token generation with valid inputs
  - Test signature validation
  - Test token expiration checking
  - Test invalid token handling
  - _Requirements: 2.5, 10.1, 10.2_

- [ ] 17.2 Write tests for SessionManager
  - Test create_session
  - Test validate_session
  - Test update_heartbeat
  - Test mark_disconnected
  - Test check_abandoned_games
  - Test cleanup_expired_sessions
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 5.1, 5.2_

- [ ] 17.3 Write tests for WebSocket connection handling
  - Test connection with valid token
  - Test connection with invalid token
  - Test concurrent connection detection
  - Test disconnection handling
  - Test connection status broadcast
  - _Requirements: 1.5, 2.3, 6.1, 9.1, 9.2_

- [ ] 17.4 Write tests for heartbeat protocol
  - Test ping/pong message exchange
  - Test heartbeat timeout detection
  - Test session marking as unhealthy
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 17.5 Write tests for state recovery
  - Test get_recovery_state
  - Test get_missed_actions
  - Test state consistency validation
  - _Requirements: 4.1, 4.5_

- [ ] 17.6 Write tests for game action logging
  - Test log_game_action
  - Test action deduplication
  - Test action acknowledgment
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 18. Testing: Frontend unit tests
  - Test reconnection hook logic
  - Test session token manager
  - Test heartbeat hook
  - Test UI components
  - _Requirements: All frontend requirements_

- [ ] 18.1 Write tests for useReconnection hook
  - Test exponential backoff calculation
  - Test reconnection attempt tracking
  - Test max attempts handling
  - Test automatic reconnection trigger
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 18.2 Write tests for SessionTokenManager
  - Test token creation and storage
  - Test token retrieval
  - Test token validation
  - Test token clearing
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 18.3 Write tests for useHeartbeat hook
  - Test ping sending
  - Test pong handling
  - Test health detection
  - Test reconnection trigger
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 18.4 Write tests for ConnectionStatus component
  - Test all status states rendering
  - Test manual retry button
  - Test opponent status display
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2_

- [ ] 18.5 Write tests for useMultiTab hook
  - Test session conflict detection
  - Test session transfer
  - Test BroadcastChannel communication
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 19. Testing: Integration tests
  - Test complete reconnection flow
  - Test abandoned game handling
  - Test multi-tab scenarios
  - Test critical action during disconnect
  - _Requirements: All requirements_

- [ ] 19.1 Write integration test for basic reconnection
  - Player connects, disconnects, reconnects
  - Verify game state preserved
  - Verify turn order maintained
  - _Requirements: 1.1, 1.5, 4.1, 4.2_

- [ ] 19.2 Write integration test for abandoned game
  - Player disconnects for 5+ minutes
  - Verify opponent notified
  - Verify claim victory works
  - Verify reconnection handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 19.3 Write integration test for multi-tab prevention
  - Open game in two tabs
  - Verify warning displayed
  - Verify session transfer works
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 19.4 Write integration test for critical action during disconnect
  - Player plays card, immediate disconnect
  - Verify action processed
  - Verify no duplicate on reconnect
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 19.5 Write integration test for heartbeat failure
  - Simulate network degradation
  - Verify unhealthy status shown
  - Verify automatic reconnection triggered
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 20. Testing: E2E tests with Playwright
  - Test reconnection in real browser
  - Test network offline/online transitions
  - Test abandoned game flow
  - _Requirements: All requirements_

- [ ] 20.1 Write E2E test for player reconnection
  - Join game, simulate disconnect, reconnect
  - Verify UI shows reconnecting state
  - Verify game state restored
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 8.2, 8.3_

- [ ] 20.2 Write E2E test for abandoned game
  - Two players join, one disconnects
  - Wait 5 minutes (or mock time)
  - Verify abandoned game dialog shown
  - Test claim victory flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 20.3 Write E2E test for multi-tab detection
  - Open game in first tab
  - Open same game in second tab
  - Verify warning shown
  - Test session takeover
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 21. Documentation and deployment
  - Update API documentation
  - Add reconnection guide to README
  - Create deployment runbook
  - Update monitoring dashboards
  - _Requirements: All requirements_

- [ ] 21.1 Update API documentation
  - Document new WebSocket connection parameters (session_token)
  - Document heartbeat ping/pong protocol
  - Document connection status messages
  - Document claim victory endpoint
  - _Requirements: All backend requirements_

- [ ] 21.2 Create user-facing documentation
  - Add "Connection Issues" section to README
  - Explain reconnection behavior
  - Document session persistence
  - Add troubleshooting guide
  - _Requirements: All requirements_

- [ ] 21.3 Create deployment runbook
  - Document database migration steps
  - List environment variables needed
  - Describe rollback procedure
  - Add monitoring checklist
  - _Requirements: All requirements_

- [ ] 21.4 Update monitoring dashboards
  - Add reconnection success rate metric
  - Add average reconnection time metric
  - Add session abandonment rate metric
  - Add heartbeat failure rate metric
  - Set up alerts for anomalies
  - _Requirements: All requirements_

---

## Implementation Notes

### Execution Order
1. Start with backend infrastructure (tasks 1-8)
2. Build frontend components (tasks 9-16)
3. Integrate everything (task 14)
4. Comprehensive testing (tasks 17-20)
5. Documentation and deployment (task 21)

### Testing Approach
- Optional test tasks (marked with *) focus on core functionality
- Write tests alongside implementation, not after
- Run tests frequently during development
- Integration tests verify component interactions
- E2E tests validate user-facing behavior

### Dependencies
- Task 2 depends on task 1 (database schema)
- Task 3 depends on task 2 (token generation)
- Task 4 depends on task 3 (session management)
- Tasks 9-13 can be done in parallel
- Task 14 integrates all frontend work
- Tasks 17-20 can be done in parallel after implementation

### Estimated Timeline
- Backend (tasks 1-8): 1.5 weeks
- Frontend (tasks 9-16): 1.5 weeks
- Testing (tasks 17-20): 1 week
- Documentation (task 21): 0.5 weeks
- **Total: 4.5 weeks**

---

**Last Updated:** November 12, 2025  
**Status:** Ready for Implementation
