# Implementation Plan

- [x] 1. Set up WebRTC infrastructure and backend signaling
  - Extend WebSocket manager to support voice signaling message relay
  - Add voice signaling message types (offer, answer, ICE candidate, mute status)
  - Implement session validation for voice connections
  - Implement room membership validation for signaling messages
  - _Requirements: 3.1, 6.1, 6.4_

- [x] 1.1 Write property test for session token validation
  - **Property 17: Session token validation**
  - **Validates: Requirements 6.1**

- [x] 1.2 Write property test for room membership validation
  - **Property 20: Room membership validation**
  - **Validates: Requirements 6.4**

- [x] 2. Create voice chat store with WebRTC peer connection management
  - Implement VoiceChat store using Svelte 5 runes
  - Add state management for connection, audio, and settings
  - Implement WebRTC peer connection initialization with STUN servers
  - Add media stream acquisition with getUserMedia
  - Implement offer/answer creation and handling
  - Implement ICE candidate handling
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 8.1, 8.3_

- [x] 2.1 Write property test for media stream capture
  - **Property 1: Media stream capture on permission grant**
  - **Validates: Requirements 1.2**

- [x] 2.2 Write property test for audio transmission
  - **Property 2: Audio transmission with active stream**
  - **Validates: Requirements 1.3**

- [x] 2.3 Write property test for ICE candidate exchange
  - **Property 6: ICE candidate exchange**
  - **Validates: Requirements 3.1**

- [x] 2.4 Write property test for encryption configuration
  - **Property 27: Encryption configuration**
  - **Validates: Requirements 8.1, 8.4**

- [x] 3. Implement mute/unmute functionality
  - Add toggleMute method to voice chat store
  - Implement microphone permission request handling
  - Add audio track enable/disable logic
  - Implement mute status broadcasting to opponent
  - Add resource cleanup when muting
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 4. Create voice chat UI components
  - Create VoiceChatControls component with mute button
  - Add mute/unmute icon display based on state
  - Implement speaking indicator with audio level detection
  - Add tooltips for mute button states
  - Style components to match casino theme
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 5. Implement volume controls and persistence
  - Add volume slider to VoiceChatControls component
  - Implement setVolume method in voice chat store
  - Add volume application to remote audio element
  - Implement volume persistence to localStorage
  - Add volume restoration on initialization
  - Implement local mute (volume = 0) with speaker icon
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 Write property test for volume control application
  - **Property 10: Volume control application**
  - **Validates: Requirements 4.1**

- [x] 5.2 Write property test for volume persistence round-trip
  - **Property 11: Volume persistence round-trip**
  - **Validates: Requirements 4.3, 4.4**

- [x] 6. Implement error handling and recovery
  - Add permission denied error handling with user message
  - Implement device unavailable detection and error display
  - Add WebRTC connection failure detection and notification
  - Implement ICE gathering timeout (10 seconds)
  - Add signaling message failure handling with retry
  - Implement resource cleanup on all error scenarios
  - _Requirements: 1.5, 3.3, 3.5_

- [x] 7. Implement session integration and security
  - Add session token validation in signaling handlers
  - Implement session expiration cleanup for voice connections
  - Add valid session reconnection support
  - Implement room closure cleanup for voice connections
  - Add secure WebSocket (WSS) verification for signaling
  - Implement logging security (no audio content in logs)
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 8.2, 8.5_

- [x] 8. Implement voice chat settings and preferences
  - Add voice chat enable/disable setting
  - Implement settings persistence to localStorage
  - Add logic to prevent permissions when disabled
  - Add logic to prevent connections when disabled
  - Implement asymmetric voice chat (one player disabled)
  - Add disabled state UI indication
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Integrate voice chat into game UI
  - Add VoiceChatControls component to waiting room view (when opponent present)
  - Add VoiceChatControls component to active game view
  - Position controls in bottom-right corner of game area
  - Add voice chat initialization on room join (when both players present)
  - Add voice chat cleanup on room leave
  - Connect WebSocket messages to voice chat handlers in connectionStore
  - Handle voice signaling messages (offer, answer, ICE candidate, mute status)
  - _Requirements: All_

- [ ] 10. Implement automatic connection establishment
  - Add logic to detect when both players are present in room
  - Implement automatic offer creation from first player
  - Add automatic answer handling from second player
  - Implement connection termination on player leave
  - Add automatic reconnection after disconnection with exponential backoff
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Implement connection resilience and quality management
  - Add ICE connection state monitoring
  - Implement ICE restart on connection degradation
  - Add connection quality indicators to UI
  - Ensure UI updates within 500ms for status changes
  - _Requirements: 2.4, 3.2_

- [ ] 12. Add voice permission dialog component
  - Create VoicePermissionDialog component
  - Add permission request UI with explanation
  - Implement permission denial handling with retry option
  - Add link to browser settings for permission management
  - Style dialog to match casino theme
  - _Requirements: 1.1, 1.5_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Run all voice chat tests (unit and property-based)
  - Test voice chat in browser with two players
  - Verify all requirements are met
  - Ask the user if questions arise
