"""
Pydantic Schemas for Request/Response Validation

This module defines all Pydantic v2 models used for API request validation and response
serialization. These schemas ensure type safety and automatic validation of all API
endpoints.

Request schemas validate incoming data from clients.
Response schemas structure outgoing data to clients.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import re


def sanitize_player_name(name: str) -> str:
    """
    Sanitize player name to prevent XSS and injection attacks.
    
    Args:
        name: Raw player name input
        
    Returns:
        Sanitized player name
        
    Raises:
        ValueError: If name is empty or contains only invalid characters
    """
    if not name or not name.strip():
        raise ValueError('Player name cannot be empty')
    # Remove HTML tags
    sanitized = re.sub(r'<[^>]*>', '', name.strip())
    # Remove dangerous characters that could be used for XSS
    sanitized = re.sub(r'[<>"\'\\/`]', '', sanitized)
    # Remove control characters
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', sanitized)
    if not sanitized:
        raise ValueError('Player name contains only invalid characters')
    return sanitized[:50]  # Ensure max length after sanitization


# Request schemas

class CreateRoomRequest(BaseModel):
    """
    Request schema for creating a new game room.
    
    Attributes:
        player_name: Display name for the creating player (1-50 chars)
        ip_address: Client IP address (auto-detected if not provided)
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    player_name: str = Field(..., min_length=1, max_length=50)
    ip_address: Optional[str] = Field(None, max_length=45)
    
    @field_validator('player_name')
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        return sanitize_player_name(v)


class JoinRoomRequest(BaseModel):
    """
    Request schema for joining an existing room.
    
    Attributes:
        room_id: 6-character room code to join
        player_name: Display name for the joining player
        ip_address: Client IP address
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    room_id: str = Field(..., min_length=6, max_length=6)
    player_name: str = Field(..., min_length=1, max_length=50)
    ip_address: Optional[str] = Field(None, max_length=45)
    
    @field_validator('room_id')
    @classmethod
    def validate_room_id(cls, v: str) -> str:
        if not v or len(v) != 6:
            raise ValueError('Room ID must be exactly 6 characters')
        # Only allow alphanumeric characters
        if not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError('Room ID must contain only letters and numbers')
        return v.upper()
    
    @field_validator('player_name')
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        return sanitize_player_name(v)


class JoinRandomRoomRequest(BaseModel):
    """
    Request schema for joining a random available room.
    
    Attributes:
        player_name: Display name for the player
        ip_address: Client IP address
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    player_name: str = Field(..., min_length=1, max_length=50)
    ip_address: Optional[str] = Field(None, max_length=45)
    
    @field_validator('player_name')
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        return sanitize_player_name(v)


class LeaveRoomRequest(BaseModel):
    """
    Request schema for leaving a room.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)


class SetPlayerReadyRequest(BaseModel):
    """
    Request schema for setting player ready status.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier
        is_ready: Ready status to set
        client_version: Optional client version for conflict detection
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)
    is_ready: bool
    client_version: Optional[int] = Field(None, ge=0)


class PlayCardRequest(BaseModel):
    """
    Request schema for playing a card action.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier
        card_id: Card being played (format: "rank_suit")
        action: Action type (capture, build, or trail)
        target_cards: Target card IDs for capture/build
        components: List of card-ID groups for multi-component builds
        target_builds: Existing build IDs to augment
        build_value: Build value for build action (1-14)
        client_version: Optional client version for conflict detection
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)
    card_id: str = Field(..., min_length=1)
    action: str = Field(..., pattern="^(capture|build|trail)$")
    target_cards: Optional[List[str]] = None
    components: Optional[List[List[str]]] = None
    target_builds: Optional[List[str]] = None
    build_value: Optional[int] = Field(None, ge=1, le=14)
    client_version: Optional[int] = Field(None, ge=0)
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in ['capture', 'build', 'trail']:
            raise ValueError('Action must be capture, build, or trail')
        return v
        
    @model_validator(mode='after')
    def validate_build_action(self) -> 'PlayCardRequest':
        if self.action == 'build':
            if self.build_value is None:
                raise ValueError('Build value is required for build action')
            
            if self.components is not None:
                if len(self.components) < 1:
                    raise ValueError('Components list cannot be empty if provided')
            
        return self





class TableBuildRequest(BaseModel):
    """
    Request schema for table-only build action (non-standard rule).
    
    Combines table cards into a build WITHOUT playing a hand card.
    Does NOT consume a turn.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier
        target_cards: Table card IDs to combine into build
        build_value: Target build value
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)
    target_cards: List[str] = Field(..., min_length=2)
    build_value: int = Field(..., ge=2, le=14)

class StartShuffleRequest(BaseModel):
    """
    Request schema for starting the shuffle phase.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier (must be Player 1)
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)


class SelectFaceUpCardsRequest(BaseModel):
    """
    Request schema for selecting initial face-up cards.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier (must be Player 1)
        card_ids: List of card IDs to place face-up (exactly 4 cards)
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)
    card_ids: List[str] = Field(..., min_length=4, max_length=4)


class StartGameRequest(BaseModel):
    """
    Request schema for starting the game after dealer animation.
    
    This endpoint combines shuffle and deal into a single action,
    automatically dealing cards to both players and the table.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier (any player can trigger this)
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)


class CreateAIGameRequest(BaseModel):
    """
    Request schema for creating a single-player game against AI.
    
    Attributes:
        player_name: Display name for the human player
        difficulty: AI difficulty level (easy, medium, hard)
        ip_address: Client IP address (auto-detected if not provided)
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    player_name: str = Field(..., min_length=1, max_length=50)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    ip_address: Optional[str] = Field(None, max_length=45)
    
    @field_validator('player_name')
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        return sanitize_player_name(v)


class SyncRequest(BaseModel):
    """
    Request schema for client state synchronization.
    
    Used when a client reconnects or detects desynchronization and needs
    to sync with the server's authoritative state.
    
    Attributes:
        room_id: Room identifier
        client_version: Client's current state version number
    
    Requirements: 8.1, 8.5
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    client_version: int = Field(..., ge=0)


# Response schemas

class PlayerResponse(BaseModel):
    """
    Response schema for player information.
    
    Attributes:
        id: Player identifier
        name: Player display name
        ready: Player ready status
        joined_at: When player joined
        ip_address: Player IP address
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    ready: bool
    joined_at: Optional[datetime] = None
    ip_address: Optional[str] = None


class GameStateResponse(BaseModel):
    """
    Response schema for complete game state.
    
    Contains all information about the current game state including cards, scores,
    phase, and player status. This is the primary response for most game endpoints.
    """
    model_config = ConfigDict(from_attributes=True)
    
    room_id: str
    players: List[PlayerResponse]
    phase: str
    round: int
    deck: List[Dict[str, Any]]
    player1_hand: List[Dict[str, Any]]
    player2_hand: List[Dict[str, Any]]
    table_cards: List[Dict[str, Any]]
    builds: List[Dict[str, Any]]
    player1_captured: List[Dict[str, Any]]
    player2_captured: List[Dict[str, Any]]
    player1_score: int
    player2_score: int
    current_turn: int
    card_selection_complete: bool
    shuffle_complete: bool
    countdown_start_time: Optional[datetime] = None
    game_started: bool
    last_play: Optional[Dict[str, Any]] = None
    last_action: Optional[str] = None
    last_update: Optional[datetime] = None
    game_completed: bool
    winner: Optional[int] = None
    dealing_complete: bool
    player1_ready: bool
    player2_ready: bool
    countdown_remaining: Optional[int] = None
    version: int = 0
    checksum: Optional[str] = None


class CreateRoomResponse(BaseModel):
    """
    Response schema for room creation.
    
    Attributes:
        room_id: Created room identifier
        player_id: Creating player's ID
        session_token: Session token for reconnection
        game_state: Initial game state
    """
    room_id: str
    player_id: int
    session_token: Optional[str] = None
    game_state: GameStateResponse


class JoinRoomResponse(BaseModel):
    """
    Response schema for joining a room.
    
    Attributes:
        player_id: Joining player's ID
        session_token: Session token for reconnection
        game_state: Current game state
    """
    player_id: int
    session_token: Optional[str] = None
    game_state: GameStateResponse


class StandardResponse(BaseModel):
    """
    Standard response schema for most game actions.
    
    Attributes:
        success: Whether action succeeded
        message: Human-readable message
        game_state: Updated game state
    """
    success: bool
    message: str
    game_state: Optional[GameStateResponse] = None


class ErrorResponse(BaseModel):
    """
    Error response schema.
    
    Attributes:
        detail: Error message
        error_code: Optional error code for client handling
    """
    detail: str
    error_code: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """
    Health check response schema.
    
    Attributes:
        status: Service status (healthy, degraded, unhealthy)
        database: Database connection status ("connected" or "disconnected")
        redis: Redis connection status ("connected" or "disconnected")
        timestamp: Check timestamp
    """
    status: str
    database: str  # "connected" or "disconnected"
    redis: str  # "connected" or "disconnected"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ConflictNotificationResponse(BaseModel):
    """
    Response schema for conflict notifications sent to clients.
    
    This notification is sent when a player's action is rejected due to
    a conflict with another player's action. It provides details about
    what happened and why the action was rejected.
    
    Attributes:
        type: Message type (always "action_rejected")
        subtype: Notification subtype (always "conflict")
        message: Human-readable explanation of the conflict
        rejected_action: Details of the action that was rejected
        conflicting_action: Details of the action that caused the conflict
        time_difference_ms: Time difference between the two actions in milliseconds
        timestamp: When the notification was created
    
    Requirements: 3.4, 6.3
    """
    type: str = Field(default="action_rejected", description="Message type")
    subtype: str = Field(default="conflict", description="Notification subtype")
    message: str = Field(..., description="Human-readable explanation")
    rejected_action: Dict[str, Any] = Field(..., description="Rejected action details")
    conflicting_action: Dict[str, Any] = Field(..., description="Conflicting action details")
    time_difference_ms: int = Field(..., description="Time difference in milliseconds")
    timestamp: str = Field(..., description="Notification timestamp")


class ActionRejectionDetails(BaseModel):
    """
    Details about an action in a conflict notification.
    
    Attributes:
        id: Unique action identifier
        action_type: Type of action (capture, build, trail, etc.)
        card_id: ID of card being played (if applicable)
        target_cards: List of target card IDs (if applicable)
        timestamp: When the action was received by server
    """
    id: str
    action_type: str
    card_id: Optional[str] = None
    target_cards: Optional[List[str]] = None
    timestamp: int

# Social Features Schemas

# Authentication Schemas

class UserRegistrationRequest(BaseModel):
    """
    Request schema for user registration.
    
    Attributes:
        username: Unique username (3-50 characters)
        email: Valid email address
        password: Password (8-128 characters)
        display_name: Optional display name (1-100 characters)
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip().lower()
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()


class UserLoginRequest(BaseModel):
    """
    Request schema for user login.
    
    Attributes:
        username: Username or email
        password: User password
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    username: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class EmailVerificationRequest(BaseModel):
    """
    Request schema for email verification.
    
    Attributes:
        token: Verification token from email
    """
    token: str = Field(..., min_length=1, max_length=256)


# Profile Schemas

class ProfileUpdateRequest(BaseModel):
    """
    Request schema for updating user profile.
    
    Attributes:
        display_name: Optional display name
        bio: Optional biography
        privacy_settings: Privacy preferences
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    privacy_settings: Optional[Dict[str, Any]] = None


class PrivacySettingsRequest(BaseModel):
    """
    Request schema for privacy settings.
    
    Attributes:
        profile_visibility: Profile visibility (public, friends, private)
        allow_friend_requests: Whether to allow friend requests
        allow_private_messages: Who can send private messages (everyone, friends, none)
        show_online_status: Whether to show online status
        show_game_activity: Whether to show game activity
        show_statistics: Whether to show game statistics
    """
    profile_visibility: str = Field(default="public", pattern="^(public|friends|private)$")
    allow_friend_requests: bool = Field(default=True)
    allow_private_messages: str = Field(default="friends", pattern="^(everyone|friends|none)$")
    show_online_status: bool = Field(default=True)
    show_game_activity: bool = Field(default=True)
    show_statistics: bool = Field(default=True)


# Friend System Schemas

class FriendRequestRequest(BaseModel):
    """
    Request schema for sending friend requests.
    
    Attributes:
        recipient_username: Username of the user to send friend request to
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    recipient_username: str = Field(..., min_length=3, max_length=50)


class FriendRequestResponseRequest(BaseModel):
    """
    Request schema for responding to friend requests.
    
    Attributes:
        request_id: ID of the friend request
        accept: Whether to accept (True) or decline (False) the request
    """
    request_id: int = Field(..., ge=1)
    accept: bool


class UserSearchRequest(BaseModel):
    """
    Request schema for searching users.
    
    Attributes:
        query: Search query (username or display name)
        limit: Maximum number of results (default 20, max 50)
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    query: str = Field(..., min_length=1, max_length=50)
    limit: int = Field(default=20, ge=1, le=50)


# Chat Schemas

class SendChatMessageRequest(BaseModel):
    """
    Request schema for sending chat messages.
    
    Attributes:
        message: Message content
        room_id: Optional room ID for game chat
        recipient_id: Optional recipient ID for private messages
    """
    model_config = ConfigDict(str_strip_whitespace=True)
    
    message: str = Field(..., min_length=1, max_length=1000)
    room_id: Optional[str] = Field(None, min_length=6, max_length=6)
    recipient_id: Optional[int] = Field(None, ge=1)
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()


class GetChatHistoryRequest(BaseModel):
    """
    Request schema for getting chat history.
    
    Attributes:
        room_id: Optional room ID for game chat history
        conversation_with: Optional user ID for private message history
        limit: Maximum number of messages (default 50, max 100)
        before: Optional timestamp to get messages before
    """
    room_id: Optional[str] = Field(None, min_length=6, max_length=6)
    conversation_with: Optional[int] = Field(None, ge=1)
    limit: int = Field(default=50, ge=1, le=100)
    before: Optional[datetime] = None


# Moderation Schemas

class CreateReportRequest(BaseModel):
    """
    Request schema for creating moderation reports.
    
    Attributes:
        reported_user_id: ID of the user being reported
        report_type: Type of report (harassment, spam, inappropriate_content)
        description: Optional description of the issue
    """
    reported_user_id: int = Field(..., ge=1)
    report_type: str = Field(..., pattern="^(harassment|spam|inappropriate_content)$")
    description: Optional[str] = Field(None, max_length=1000)


class BlockUserRequest(BaseModel):
    """
    Request schema for blocking users.
    
    Attributes:
        user_id: ID of the user to block
        reason: Optional reason for blocking
    """
    user_id: int = Field(..., ge=1)
    reason: Optional[str] = Field(None, max_length=255)


# Notification Schemas

class NotificationPreferencesRequest(BaseModel):
    """
    Request schema for notification preferences.
    
    Attributes:
        friend_requests: Enable friend request notifications
        friend_online: Enable friend online notifications
        private_messages: Enable private message notifications
        game_invites: Enable game invitation notifications
        mentions: Enable mention notifications
    """
    friend_requests: bool = Field(default=True)
    friend_online: bool = Field(default=True)
    private_messages: bool = Field(default=True)
    game_invites: bool = Field(default=True)
    mentions: bool = Field(default=True)


# Response Schemas

class UserResponse(BaseModel):
    """
    Response schema for user information.
    
    Attributes:
        id: User ID
        username: Username
        display_name: Display name
        avatar_url: Avatar image URL
        is_verified: Whether email is verified
        created_at: Account creation timestamp
        last_seen: Last activity timestamp
        is_online: Current online status
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool
    created_at: datetime
    last_seen: Optional[datetime] = None
    is_online: bool = False


class UserProfileResponse(BaseModel):
    """
    Response schema for detailed user profile.
    
    Attributes:
        id: User ID
        username: Username
        display_name: Display name
        bio: User biography
        avatar_url: Avatar image URL
        is_verified: Whether email is verified
        created_at: Account creation timestamp
        last_seen: Last activity timestamp
        is_online: Current online status
        statistics: User game statistics
        privacy_settings: Privacy preferences (only for own profile)
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool
    created_at: datetime
    last_seen: Optional[datetime] = None
    is_online: bool = False
    statistics: Optional['UserStatisticsResponse'] = None
    privacy_settings: Optional[Dict[str, Any]] = None


class UserStatisticsResponse(BaseModel):
    """
    Response schema for user statistics.
    
    Attributes:
        games_played: Total games played
        games_won: Total games won
        win_rate: Win rate percentage
        total_score: Cumulative score
        best_game_score: Best single game score
        current_streak: Current winning streak
        longest_streak: Longest winning streak
        last_game_at: Last game timestamp
    """
    model_config = ConfigDict(from_attributes=True)
    
    games_played: int
    games_won: int
    win_rate: float
    total_score: int
    best_game_score: int
    current_streak: int
    longest_streak: int
    last_game_at: Optional[datetime] = None


class FriendshipResponse(BaseModel):
    """
    Response schema for friendship information.
    
    Attributes:
        id: Friendship ID
        user: Friend user information
        status: Friendship status
        created_at: Friend request timestamp
        accepted_at: Friendship acceptance timestamp
        is_online: Friend's online status
        unread_messages: Number of unread messages from this friend
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user: UserResponse
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None
    is_online: bool = False
    unread_messages: int = 0


class ChatMessageResponse(BaseModel):
    """
    Response schema for chat messages.
    
    Attributes:
        id: Message ID
        sender: Sender information
        recipient: Recipient information (for private messages)
        room_id: Room ID (for game chat)
        message: Message content
        timestamp: Message timestamp
        message_type: Type of message (game_chat, private_message, global_chat)
        is_moderated: Whether message was moderated
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    sender: UserResponse
    recipient: Optional[UserResponse] = None
    room_id: Optional[str] = None
    message: str
    timestamp: datetime
    message_type: str
    is_moderated: bool = False


class NotificationResponse(BaseModel):
    """
    Response schema for notifications.
    
    Attributes:
        id: Notification ID
        type: Notification type
        title: Notification title
        message: Notification message
        data: Additional notification data
        is_read: Whether notification is read
        created_at: Notification timestamp
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime


class AuthenticationResponse(BaseModel):
    """
    Response schema for authentication.
    
    Attributes:
        user: User information
        session_token: Session token for authentication
        expires_at: Token expiration timestamp
    """
    user: UserResponse
    session_token: str
    expires_at: datetime


class FriendRequestResponse(BaseModel):
    """
    Response schema for friend requests.
    
    Attributes:
        id: Friend request ID
        requester: User who sent the request
        recipient: User who received the request
        status: Request status
        created_at: Request timestamp
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    requester: UserResponse
    recipient: UserResponse
    status: str
    created_at: datetime


# Update forward references
UserProfileResponse.model_rebuild()