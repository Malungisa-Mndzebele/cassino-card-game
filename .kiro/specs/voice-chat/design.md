# Voice Chat System Design

## Overview

The voice chat system enables real-time peer-to-peer audio communication between two players in a Casino card game room. The system uses WebRTC for direct audio streaming between browsers, with the existing WebSocket infrastructure handling signaling for connection establishment. The design prioritizes simplicity, reliability, and integration with the existing session management system.

## Architecture

### High-Level Architecture

```
Player 1 Browser                    Backend Server                    Player 2 Browser
┌─────────────────┐                ┌──────────────┐                 ┌─────────────────┐
│                 │                │              │                 │                 │
│  Microphone     │                │  WebSocket   │                 │  Microphone     │
│      ↓          │                │  Signaling   │                 │      ↓          │
│  MediaStream    │                │  Server      │                 │  MediaStream    │
│      ↓          │   Signaling    │      ↓       │   Signaling     │      ↓          │
│  RTCPeerConn ←──┼────Messages────┼→ Relay   ←───┼────Messages─────┼→ RTCPeerConn   │
│      ║          │                │              │                 │      ║          │
│      ║          │                └──────────────┘                 │      ║          │
│      ║          │                                                 │      ║          │
│      ╚══════════╪═════════ Direct P2P Audio ═════════════════════╪══════╝          │
│                 │         (DTLS-SRTP Encrypted)                   │                 │
│   Speakers      │                                                 │   Speakers      │
└─────────────────┘                                                 └─────────────────┘
```

### Component Architecture

The system consists of three main layers:

1. **Frontend Voice Chat Manager** (Svelte store)
   - Manages WebRTC peer connections
   - Handles media stream acquisition
   - Controls mute/unmute state
   - Manages volume settings

2. **Signaling Service** (Backend FastAPI)
   - Relays WebRTC signaling messages via WebSocket
   - Validates session tokens
   - Ensures players are in the same room
   - Manages connection lifecycle

3. **UI Components** (Svelte)
   - Mute/unmute button
   - Volume slider
   - Visual indicators (speaking, muted)
   - Permission error handling

## Components and Interfaces

### Frontend Components

#### 1. VoiceChat Store (`src/lib/stores/voiceChat.svelte.ts`)

Manages all voice chat state and WebRTC connections using Svelte 5 runes.

```typescript
interface VoiceChatState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Audio state
  isMuted: boolean;
  isOpponentMuted: boolean;
  isSpeaking: boolean;
  isOpponentSpeaking: boolean;
  
  // Settings
  volume: number; // 0-100
  isEnabled: boolean; // User preference
  
  // Media
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // WebRTC
  peerConnection: RTCPeerConnection | null;
}

interface VoiceChatActions {
  // Lifecycle
  initialize(roomId: string, playerId: string): Promise<void>;
  cleanup(): void;
  
  // Controls
  toggleMute(): Promise<void>;
  setVolume(volume: number): void;
  setEnabled(enabled: boolean): void;
  
  // Connection
  createOffer(): Promise<void>;
  handleOffer(offer: RTCSessionDescriptionInit): Promise<void>;
  handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
  handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
}
```

#### 2. VoiceChatControls Component (`src/lib/components/VoiceChatControls.svelte`)

UI component for voice chat controls.

```svelte
<script lang="ts">
  import { voiceChat } from '$lib/stores/voiceChat.svelte';
  
  // Props
  let { position = 'bottom-right' } = $props();
</script>

<div class="voice-chat-controls">
  <!-- Mute/Unmute Button -->
  <button on:click={voiceChat.toggleMute}>
    {#if voiceChat.isMuted}
      <MicOffIcon />
    {:else}
      <MicOnIcon />
    {/if}
  </button>
  
  <!-- Volume Slider -->
  <input 
    type="range" 
    min="0" 
    max="100" 
    value={voiceChat.volume}
    on:input={(e) => voiceChat.setVolume(e.target.value)}
  />
  
  <!-- Speaking Indicators -->
  <div class="indicators">
    <div class:speaking={voiceChat.isSpeaking}>You</div>
    <div class:speaking={voiceChat.isOpponentSpeaking}>Opponent</div>
  </div>
</div>
```

#### 3. VoicePermissionDialog Component

Handles microphone permission requests and errors.

### Backend Components

#### 1. Voice Signaling Routes (`backend/main.py`)

WebSocket message handlers for voice chat signaling.

```python
# Message types
class VoiceSignalType(str, Enum):
    OFFER = "voice_offer"
    ANSWER = "voice_answer"
    ICE_CANDIDATE = "voice_ice_candidate"
    MUTE_STATUS = "voice_mute_status"

# WebSocket message handler
async def handle_voice_signal(
    websocket: WebSocket,
    message: dict,
    room_id: str,
    player_id: str
):
    """Relay voice signaling messages to opponent"""
    signal_type = message.get("type")
    data = message.get("data")
    
    # Validate session
    session = await session_manager.validate_session(...)
    if not session:
        return
    
    # Relay to opponent in same room
    await websocket_manager.send_to_room_except(
        room_id=room_id,
        exclude_player_id=player_id,
        message={
            "type": signal_type,
            "data": data,
            "from_player": player_id
        }
    )
```

#### 2. WebSocket Manager Extension

Add methods to support voice signaling.

```python
class WebSocketManager:
    async def send_to_room_except(
        self,
        room_id: str,
        exclude_player_id: str,
        message: dict
    ):
        """Send message to all players in room except one"""
        connections = self.active_connections.get(room_id, {})
        for player_id, ws in connections.items():
            if player_id != exclude_player_id:
                await ws.send_json(message)
```

## Data Models

### WebRTC Configuration

```typescript
const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    // Public STUN servers for NAT traversal
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};
```

### Media Constraints

```typescript
const mediaConstraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1, // Mono for voice
  },
  video: false,
};
```

### Signaling Messages

```typescript
// Offer message
interface VoiceOfferMessage {
  type: 'voice_offer';
  data: {
    sdp: string;
    type: 'offer';
  };
  from_player: string;
}

// Answer message
interface VoiceAnswerMessage {
  type: 'voice_answer';
  data: {
    sdp: string;
    type: 'answer';
  };
  from_player: string;
}

// ICE candidate message
interface VoiceIceCandidateMessage {
  type: 'voice_ice_candidate';
  data: {
    candidate: string;
    sdpMLineIndex: number;
    sdpMid: string;
  };
  from_player: string;
}

// Mute status message
interface VoiceMuteStatusMessage {
  type: 'voice_mute_status';
  data: {
    is_muted: boolean;
  };
  from_player: string;
}
```

### Local Storage Schema

```typescript
interface VoiceChatSettings {
  enabled: boolean;
  volume: number; // 0-100
  lastMutedState: boolean;
}

// Storage key: 'voice_chat_settings'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 2.1 and 2.2 (muted/unmuted icons) can be combined into a single UI state property
- Property 8.4 (end-to-end encryption) is redundant with 8.1 (DTLS-SRTP encryption)
- Properties 5.1 and 5.2 (connection establishment) can be combined as they test the same behavior

### Core Properties

**Property 1: Media stream capture on permission grant**
*For any* microphone permission grant, the Voice Chat System should successfully capture an audio stream from the user's microphone
**Validates: Requirements 1.2**

**Property 2: Audio transmission with active stream**
*For any* active audio stream, the Voice Chat System should configure the peer connection to transmit the audio to the opponent
**Validates: Requirements 1.3**

**Property 3: Mute state reflects UI icon**
*For any* player mute state (muted or unmuted), the Voice Chat System should display the corresponding icon (muted icon when muted, unmuted icon when unmuted)
**Validates: Requirements 2.1, 2.2**

**Property 4: Audio activity indicator**
*For any* audio stream where audio levels exceed the detection threshold, the Voice Chat System should display a visual speaking indicator
**Validates: Requirements 2.3**

**Property 5: UI update responsiveness**
*For any* opponent audio status change, the Voice Chat System should update the UI within 500 milliseconds
**Validates: Requirements 2.4**

**Property 6: ICE candidate exchange**
*For any* peer connection establishment, the Signaling Server should relay ICE candidates between both players
**Validates: Requirements 3.1**

**Property 7: Connection resilience with ICE restart**
*For any* network condition change that affects connection quality, the Voice Chat System should attempt ICE restart to maintain the connection
**Validates: Requirements 3.2**

**Property 8: Failure notification and reconnection**
*For any* peer connection failure, the Voice Chat System should notify the user and initiate automatic reconnection attempts
**Validates: Requirements 3.3**

**Property 9: Resource cleanup on disconnection**
*For any* player disconnection, the Voice Chat System should clean up the peer connection and release all media stream resources
**Validates: Requirements 3.5**

**Property 10: Volume control application**
*For any* volume adjustment, the Voice Chat System should apply the new volume level to the opponent's audio output
**Validates: Requirements 4.1**

**Property 11: Volume persistence round-trip**
*For any* volume setting, saving to local storage and then retrieving should return the same volume value
**Validates: Requirements 4.3, 4.4**

**Property 12: Local mute UI state**
*For any* local audio output mute state, the Voice Chat System should display a speaker-off icon when muted
**Validates: Requirements 4.5**

**Property 13: Automatic connection establishment**
*For any* room with two players present, the Voice Chat System should automatically initiate peer connection establishment
**Validates: Requirements 5.1, 5.2**

**Property 14: Connection termination on player leave**
*For any* player leaving the room, the Voice Chat System should terminate the peer connection
**Validates: Requirements 5.3**

**Property 15: Automatic reconnection**
*For any* player reconnecting after disconnection, the Voice Chat System should automatically re-establish the peer connection
**Validates: Requirements 5.4**

**Property 16: Exponential backoff retry**
*For any* connection establishment failure, the Voice Chat System should retry with exponential backoff (1s, 2s, 4s) up to 3 attempts maximum
**Validates: Requirements 5.5**

**Property 17: Session token validation**
*For any* voice connection establishment attempt, the Signaling Server should validate the player's session token and reject invalid tokens
**Validates: Requirements 6.1**

**Property 18: Session expiration cleanup**
*For any* session expiration, the Voice Chat System should terminate the associated peer connection
**Validates: Requirements 6.2**

**Property 19: Valid session reconnection**
*For any* player reconnecting with a valid session token, the Voice Chat System should restore the voice connection
**Validates: Requirements 6.3**

**Property 20: Room membership validation**
*For any* signaling message exchange, the Signaling Server should verify both players belong to the same room and reject messages between players in different rooms
**Validates: Requirements 6.4**

**Property 21: Room closure cleanup**
*For any* room closure, the Signaling Server should terminate all associated voice connections
**Validates: Requirements 6.5**

**Property 22: Disabled voice chat prevents permissions**
*For any* player with voice chat disabled in settings, the Voice Chat System should not request microphone permissions
**Validates: Requirements 7.1**

**Property 23: Disabled voice chat prevents connections**
*For any* player with voice chat disabled, the Voice Chat System should not establish peer connections
**Validates: Requirements 7.2**

**Property 24: Asymmetric voice chat support**
*For any* room where one player has voice chat disabled, the Voice Chat System should still allow the other player to transmit audio
**Validates: Requirements 7.3**

**Property 25: Voice preference persistence**
*For any* voice chat preference change, the setting should persist across sessions (save and retrieve returns same value)
**Validates: Requirements 7.4**

**Property 26: Disabled state UI indication**
*For any* player with voice chat disabled, the Voice Chat System should display a clear visual indication in the UI
**Validates: Requirements 7.5**

**Property 27: Encryption configuration**
*For any* peer connection establishment, the Voice Chat System should configure DTLS-SRTP encryption for audio streams
**Validates: Requirements 8.1, 8.4**

**Property 28: Secure signaling transport**
*For any* signaling message exchange, the Signaling Server should use the existing secure WebSocket (WSS) connection
**Validates: Requirements 8.2**

**Property 29: Secure ICE candidate preference**
*For any* ICE candidate gathering, the Voice Chat System should configure the peer connection to prefer secure transport protocols
**Validates: Requirements 8.3**

**Property 30: Logging security**
*For any* connection metadata logged by the Signaling Server, the logs should not contain audio content or unencrypted sensitive data
**Validates: Requirements 8.5**

## Error Handling

### Frontend Error Scenarios

1. **Microphone Permission Denied**
   - Display user-friendly error message explaining why permissions are needed
   - Keep mute button disabled with visual indication
   - Provide link to browser settings for permission management
   - Store denial state to avoid repeated prompts

2. **Media Device Not Available**
   - Detect when no microphone is available
   - Display error message suggesting user check hardware
   - Gracefully disable voice chat features
   - Allow retry when device becomes available

3. **WebRTC Connection Failure**
   - Detect connection state failures (failed, disconnected, closed)
   - Display connection status to user
   - Implement automatic reconnection with exponential backoff
   - Provide manual reconnect button after max retries
   - Log connection errors for debugging

4. **ICE Gathering Timeout**
   - Set timeout for ICE candidate gathering (10 seconds)
   - Fall back to relay candidates if direct connection fails
   - Notify user of connection quality issues
   - Continue attempting connection in background

5. **Signaling Message Failure**
   - Detect WebSocket disconnection during signaling
   - Queue signaling messages during temporary disconnection
   - Retry message delivery when connection restored
   - Abort connection attempt if signaling fails completely

6. **Audio Playback Failure**
   - Detect when remote audio stream cannot be played
   - Check for browser autoplay policies
   - Prompt user interaction if required for autoplay
   - Display error if audio element fails

### Backend Error Scenarios

1. **Invalid Session Token**
   - Validate session token before relaying signaling messages
   - Return 401 Unauthorized for invalid tokens
   - Log authentication failures for security monitoring
   - Close WebSocket connection for repeated failures

2. **Room Mismatch**
   - Verify both players are in the same room
   - Reject signaling messages between different rooms
   - Log security violations
   - Prevent cross-room communication

3. **Player Not Found**
   - Handle cases where opponent has disconnected
   - Return appropriate error to sender
   - Clean up orphaned connections
   - Notify remaining player of opponent disconnection

4. **WebSocket Connection Lost**
   - Detect WebSocket disconnection
   - Clean up associated voice connections
   - Remove player from active connections map
   - Notify opponent of disconnection

5. **Message Parsing Failure**
   - Validate signaling message format
   - Reject malformed messages
   - Log parsing errors for debugging
   - Continue processing other messages

### Error Recovery Strategies

1. **Automatic Reconnection**
   - Implement exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Maximum 3 connection attempts
   - Reset backoff on successful connection
   - Provide manual retry option

2. **Graceful Degradation**
   - Allow game to continue without voice chat
   - Clearly indicate voice chat unavailable
   - Preserve game functionality
   - Allow voice chat re-enable attempt

3. **State Cleanup**
   - Always clean up media streams on error
   - Close peer connections properly
   - Remove event listeners
   - Reset UI state to default

4. **User Feedback**
   - Display clear, actionable error messages
   - Avoid technical jargon in user-facing errors
   - Provide troubleshooting suggestions
   - Show connection status indicators

## Testing Strategy

### Unit Testing

The voice chat system will use **Vitest** for unit testing with the following focus areas:

1. **VoiceChat Store Tests**
   - Test state initialization and cleanup
   - Test mute/unmute toggle logic
   - Test volume control and persistence
   - Test settings enable/disable
   - Mock WebRTC APIs (getUserMedia, RTCPeerConnection)
   - Mock localStorage for settings persistence

2. **Signaling Message Handling**
   - Test offer/answer creation and handling
   - Test ICE candidate handling
   - Test mute status message handling
   - Mock WebSocket for message sending
   - Verify message format and validation

3. **Error Handling**
   - Test permission denial handling
   - Test connection failure scenarios
   - Test device unavailable scenarios
   - Test WebSocket disconnection handling
   - Verify error messages and UI state

4. **Settings Persistence**
   - Test volume saving and loading
   - Test voice chat enable/disable persistence
   - Test mute state persistence
   - Mock localStorage operations

### Property-Based Testing

The voice chat system will use **fast-check** (JavaScript property-based testing library) for property-based tests. Each property-based test should run a minimum of 100 iterations.

Each property-based test must be tagged with a comment explicitly referencing the correctness property using this format: `**Feature: voice-chat, Property {number}: {property_text}**`

Property-based tests will verify:

1. **Volume Control Properties**
   - Property 10: Volume adjustments are applied correctly
   - Property 11: Volume persistence round-trip
   - Generate random volume values (0-100)
   - Verify save/load returns same value

2. **Connection Lifecycle Properties**
   - Property 13: Automatic connection with two players
   - Property 14: Connection termination on leave
   - Property 15: Automatic reconnection
   - Generate random room states and player actions
   - Verify connection state transitions

3. **Security Properties**
   - Property 17: Session token validation
   - Property 20: Room membership validation
   - Generate random valid/invalid tokens
   - Generate random room assignments
   - Verify rejection of invalid scenarios

4. **UI State Properties**
   - Property 3: Mute state reflects UI
   - Property 12: Local mute UI state
   - Property 26: Disabled state UI indication
   - Generate random mute states
   - Verify UI reflects state correctly

5. **Retry Logic Properties**
   - Property 16: Exponential backoff retry
   - Generate random failure scenarios
   - Verify retry timing and attempt limits

### Integration Testing

Integration tests will use **Playwright** to test the complete voice chat flow:

1. **Two-Player Voice Chat Flow**
   - Open two browser contexts (Player 1 and Player 2)
   - Join same room
   - Verify automatic connection establishment
   - Test mute/unmute functionality
   - Test volume controls
   - Verify speaking indicators
   - Test disconnection and reconnection

2. **Permission Handling**
   - Test permission grant flow
   - Test permission denial flow
   - Verify error messages
   - Test retry after permission change

3. **Settings Persistence**
   - Change voice chat settings
   - Refresh page
   - Verify settings restored
   - Test across different rooms

4. **Error Scenarios**
   - Simulate connection failures
   - Simulate WebSocket disconnection
   - Verify error messages and recovery
   - Test manual reconnection

### Backend Testing

Backend tests will use **Pytest** for testing signaling functionality:

1. **Signaling Message Relay**
   - Test offer/answer relay between players
   - Test ICE candidate relay
   - Test mute status relay
   - Verify messages reach correct opponent

2. **Session Validation**
   - Test valid session token acceptance
   - Test invalid session token rejection
   - Test expired session handling
   - Test session-room association

3. **Room Membership Validation**
   - Test same-room message relay
   - Test cross-room message rejection
   - Test player not found scenarios
   - Test room closure cleanup

4. **WebSocket Manager Extension**
   - Test send_to_room_except method
   - Verify message delivery to correct players
   - Test with multiple rooms
   - Test with disconnected players

### Testing Configuration

```typescript
// vitest.config.ts - Add WebRTC mocks
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});

// vitest.setup.ts - Mock WebRTC APIs
global.RTCPeerConnection = vi.fn();
global.RTCSessionDescription = vi.fn();
global.RTCIceCandidate = vi.fn();
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(),
};
```

### Test Coverage Goals

- Unit test coverage: 80%+ for voice chat store and components
- Property-based tests: All 30 correctness properties implemented
- Integration tests: All critical user flows covered
- Backend tests: 90%+ coverage for signaling routes

### Manual Testing Checklist

- [ ] Test on Chrome, Firefox, Safari
- [ ] Test with different microphone devices
- [ ] Test with no microphone available
- [ ] Test with permission denied
- [ ] Test on mobile devices
- [ ] Test with poor network conditions
- [ ] Test with firewall/NAT restrictions
- [ ] Test volume controls at extremes (0, 100)
- [ ] Test rapid mute/unmute toggling
- [ ] Test disconnection during active call
- [ ] Test with voice chat disabled in settings
- [ ] Test settings persistence across sessions

