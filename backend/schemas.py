"""
Pydantic Schemas for Request/Response Validation

This module defines all Pydantic v2 models used for API request validation and response
serialization. These schemas ensure type safety and automatic validation of all API
endpoints.

Request schemas validate incoming data from clients.
Response schemas structure outgoing data to clients.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


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
        if not v or not v.strip():
            raise ValueError('Player name cannot be empty')
        return v.strip()


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
        return v.upper()
    
    @field_validator('player_name')
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Player name cannot be empty')
        return v.strip()


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
        if not v or not v.strip():
            raise ValueError('Player name cannot be empty')
        return v.strip()


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
        build_value: Build value for build action
        client_version: Optional client version for conflict detection
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)
    card_id: str = Field(..., min_length=1)
    action: str = Field(..., pattern="^(capture|build|trail)$")
    target_cards: Optional[List[str]] = None
    build_value: Optional[int] = Field(None, ge=1, le=14)
    client_version: Optional[int] = Field(None, ge=0)
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in ['capture', 'build', 'trail']:
            raise ValueError('Action must be capture, build, or trail')
        return v


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
