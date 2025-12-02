# Implementation Plan

- [ ] 1. Set up WebRTC infrastructure and backend signaling
  - Extend WebSocket manager to support voice signaling message relay
  - Add voice signaling message types (offer, answer, ICE candidate, mute status)
  - Implement session validation for voice connections
  - Implement room membership validation for signaling messages
  - _Requirements: 3.1, 6.1, 6.4_

- [ ] 1.1 Write property test for session token validation
  - **Property 17: Session token validation**
  - **Validates: Requirements 6.1**

- [ ] 1.2 Write property test for room membership validation
  - **Property 20: Room membership validation**
  - **Validates: Requirements 6.4**

- [ ] 2. Create voice chat store with WebRTC peer connection management
  - Implement VoiceChat store using Svelte 5 runes
  - Add state management for connection, audio, and settings
  - Implement WebRTC peer connection initialization with STUN servers
  - Add media stream acquisition with getUserMedia
  - Implement offer/answer creation and handling
  - Implement ICE candidate handling
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 8.1, 8.3_

- [ ] 2.1 Write property test for media stream capture
  - **Property 1: Media stream capture on permission grant**
  - **Validates: Requirements 1.2**

- [ ] 2.2 Write property test for audio transmission
  - **Property 2: Audio transmission with active stream**
  - **Validates: Requirements 1.3**

- [ ] 2.3 Write property test for ICE candidate exchange
  - **Property 6: ICE candidate exchange**
  - **Validates: Requirements 3.1**

- [ ] 2.4 Write property test for encryption configuration
  - **Property 27: Encryption configuration**
  - **Validates: Requirements 8.1, 8.4**

- [ ] 3. Implement mute/unmute functionality
  - Add toggleMute method to voice chat store
  - Implement microphone permission request handling
  - Add audio track enable/disable logic
  - Implement mute status broadcasting to opponent
  - Add resource cleanup when muting
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 3.1 Write unit test for mute button click handling
  - Test unmute button triggers permission request
  - Test mute button stops transmission and releases microphone
  - _Requirements: 1.1, 1.4_

- [ ] 4. Create voice chat UI components
  - Create VoiceChatControls component with mute button
  - Add mute/unmute icon display based on state
  - Implement speaking indicator with audio level detection
  - Add tooltips for mute button states
  - Style components to match casino theme
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 4.1 Write property test for mute state UI reflection
  - **Property 3: Mute state reflects UI icon**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 4.2 Write property test for audio activity indicator
  - **Property 4: Audio activity indicator**
  - **Validates: Requirements 2.3**

- [ ] 4.3 Write unit test for tooltip display
  - Test hover shows tooltip with current state
  - _Requirements: 2.5_

- [ ] 5. Implement volume controls and persistence
  - Add volume slider to VoiceChatControls component
  - Implement setVolume method in voice chat store
  - Add volume application to remote audio element
  - Implement volume persistence to localStorage
  - Add volume restoration on initialization
  - Implement local mute (volume = 0) with speaker icon
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.1 Write property test for volume control application
  - **Property 10: Volume control application**
  - **Validates: Requirements 4.1**

- [ ] 5.2 Write property test for volume persistence round-trip
  - **Property 11: Volume persistence round-trip**
  - **Validates: Requirements 4.3, 4.4**

- [ ] 5.3 Write property test for local mute UI state
  - **Property 12: Local mute UI state**
  - **Validates: Requirements 4.5**

- [ ] 6. Implement automatic connection establishment and lifecycle
  - Add connection initialization when both players present
  - Implement automatic connection on second player join
  - Add connection termination on player leave
  - Implement automatic reconnection after disconnection
  - Add exponential backoff retry logic (1s, 2s, 4s, max 3 attempts)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6.1 Write property test for automatic connection establishment
  - **Property 13: Automatic connection establishment**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 6.2 Write property test for connection termination on leave
  - **Property 14: Connection termination on player leave**
  - **Validates: Requirements 5.3**

- [ ] 6.3 Write property test for automatic reconnection
  - **Property 15: Automatic reconnection**
  - **Validates: Requirements 5.4**

- [ ] 6.4 Write property test for exponential backoff retry
  - **Property 16: Exponential backoff retry**
  - **Validates: Requirements 5.5**

- [ ] 7. Implement error handling and recovery
  - Add permission denied error handling with user message
  - Implement device unavailable detection and error display
  - Add WebRTC connection failure detection and notification
  - Implement ICE gathering timeout (10 seconds)
  - Add signaling message failure handling with retry
  - Implement resource cleanup on all error scenarios
  - _Requirements: 1.5, 3.3, 3.5_

- [ ] 7.1 Write unit test for permission denied handling
  - Test error message display and disabled button state
  - _Requirements: 1.5_

- [ ] 7.2 Write property test for failure notification and reconnection
  - **Property 8: Failure notification and reconnection**
  - **Validates: Requirements 3.3**

- [ ] 7.3 Write property test for resource cleanup on disconnection
  - **Property 9: Resource cleanup on disconnection**
  - **Validates: Requirements 3.5**

- [ ] 8. Implement connection resilience and quality management
  - Add ICE connection state monitoring
  - Implement ICE restart on connection degradation
  - Add connection quality indicators
  - Implement UI update responsiveness (< 500ms for status changes)
  - _Requirements: 2.4, 3.2_

- [ ] 8.1 Write property test for UI update responsiveness
  - **Property 5: UI update responsiveness**
  - **Validates: Requirements 2.4**

- [ ] 8.2 Write property test for connection resilience with ICE restart
  - **Property 7: Connection resilience with ICE restart**
  - **Validates: Requirements 3.2**

- [ ] 9. Implement session integration and security
  - Add session token validation in signaling handlers
  - Implement session expiration cleanup for voice connections
  - Add valid session reconnection support
  - Implement room closure cleanup for voice connections
  - Add secure WebSocket (WSS) verification for signaling
  - Implement logging security (no audio content in logs)
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 8.2, 8.5_

- [ ] 9.1 Write property test for session expiration cleanup
  - **Property 18: Session expiration cleanup**
  - **Validates: Requirements 6.2**

- [ ] 9.2 Write property test for valid session reconnection
  - **Property 19: Valid session reconnection**
  - **Validates: Requirements 6.3**

- [ ] 9.3 Write property test for room closure cleanup
  - **Property 21: Room closure cleanup**
  - **Validates: Requirements 6.5**

- [ ] 9.4 Write property test for secure signaling transport
  - **Property 28: Secure signaling transport**
  - **Validates: Requirements 8.2**

- [ ] 9.5 Write property test for logging security
  - **Property 30: Logging security**
  - **Validates: Requirements 8.5**

- [ ] 10. Implement voice chat settings and preferences
  - Add voice chat enable/disable setting
  - Implement settings persistence to localStorage
  - Add logic to prevent permissions when disabled
  - Add logic to prevent connections when disabled
  - Implement asymmetric voice chat (one player disabled)
  - Add disabled state UI indication
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.1 Write property test for disabled voice chat prevents permissions
  - **Property 22: Disabled voice chat prevents permissions**
  - **Validates: Requirements 7.1**

- [ ] 10.2 Write property test for disabled voice chat prevents connections
  - **Property 23: Disabled voice chat prevents connections**
  - **Validates: Requirements 7.2**

- [ ] 10.3 Write property test for asymmetric voice chat support
  - **Property 24: Asymmetric voice chat support**
  - **Validates: Requirements 7.3**

- [ ] 10.4 Write property test for voice preference persistence
  - **Property 25: Voice preference persistence**
  - **Validates: Requirements 7.4**

- [ ] 10.5 Write property test for disabled state UI indication
  - **Property 26: Disabled state UI indication**
  - **Validates: Requirements 7.5**

- [ ] 11. Integrate voice chat into game UI
  - Add VoiceChatControls component to game room view
  - Add VoiceChatControls component to waiting room view
  - Position controls appropriately in UI layout
  - Add voice chat initialization on room join
  - Add voice chat cleanup on room leave
  - Test voice chat with existing game functionality
  - _Requirements: All_

- [ ] 11.1 Write integration test for two-player voice chat flow
  - Test complete flow: join room, connect, mute/unmute, volume, disconnect
  - Use Playwright with two browser contexts
  - _Requirements: All_

- [ ] 12. Add voice permission dialog component
  - Create VoicePermissionDialog component
  - Add permission request UI with explanation
  - Implement permission denial handling with retry option
  - Add link to browser settings for permission management
  - Style dialog to match casino theme
  - _Requirements: 1.1, 1.5_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
