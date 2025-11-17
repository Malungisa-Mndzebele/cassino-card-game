"""
Pydantic Schemas for Request/Response Validation

This module defines all Pydantic models used for API request validation and response
serialization. These schemas ensure type safety and automatic validation of all API
endpoints.

Request schemas validate incoming data from clients.
Response schemas structure outgoing data to clients.
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


# Request schemas

class CreateRoomRequest(BaseModel):
    """
    Request schema for creating a new game room.
    
    Attributes:
        player_name (str): Display name for the creating player
        ip_address (str, optional): Client IP address (auto-detected if not provided)
    
    Example:
        >>> request = CreateRoomRequest(player_name="Alice")
    """
    player_name: str
    ip_address: Optional[str] = None

class JoinRoomRequest(BaseModel):
    """
    Request schema for joining an existing room.
    
    Attributes:
        room_id (str): 6-character room code to join
        player_name (str): Display name for the joining player
        ip_address (str, optional): Client IP address
    
    Example:
        >>> request = JoinRoomRequest(room_id="ABC123", player_name="Bob")
    """
    room_id: str
    player_name: str
    ip_address: Optional[str] = None


class JoinRandomRoomRequest(BaseModel):
    """
    Request schema for joining a random available room.
    
    Attributes:
        player_name (str): Display name for the player
        ip_address (str, optional): Client IP address
    
    Example:
        >>> request = JoinRandomRoomRequest(player_name="Charlie")
    """
    player_name: str
    ip_address: Optional[str] = None


class SetPlayerReadyRequest(BaseModel):
    """
    Request schema for setting player ready status.
    
    Attributes:
        room_id (str): Room identifier
        player_id (int): Player identifier
        is_ready (bool): Ready status to set
    
    Example:
        >>> request = SetPlayerReadyRequest(room_id="ABC123", player_id=1, is_ready=True)
    """
    room_id: str
    player_id: int
    is_ready: bool


class PlayCardRequest(BaseModel):
    """
    Request schema for playing a card action.
    
    Attributes:
        room_id (str): Room identifier
        player_id (int): Player identifier
        card_id (str): Card being played (format: "rank_suit")
        action (str): Action type (capture, build, or trail)
        target_cards (list, optional): Target card IDs for capture/build
        build_value (int, optional): Build value for build action
    
    Example:
        >>> # Capture action
        >>> request = PlayCardRequest(
        ...     room_id="ABC123",
        ...     player_id=1,
        ...     card_id="8_hearts",
        ...     action="capture",
        ...     target_cards=["3_spades", "5_diamonds"]
        ... )
        >>> # Build action
        >>> request = PlayCardRequest(
        ...     room_id="ABC123",
        ...     player_id=1,
        ...     card_id="5_hearts",
        ...     action="build",
        ...     target_cards=["3_spades"],
        ...     build_value=8
        ... )
    """
    room_id: str
    player_id: int
    card_id: str
    action: str  # capture, build, trail
    target_cards: Optional[List[str]] = None
    build_value: Optional[int] = None


class StartShuffleRequest(BaseModel):
    """
    Request schema for starting the shuffle phase.
    
    Attributes:
        room_id (str): Room identifier
        player_id (int): Player identifier (must be Player 1)
    
    Example:
        >>> request = StartShuffleRequest(room_id="ABC123", player_id=1)
    """
    room_id: str
    player_id: int


class SelectFaceUpCardsRequest(BaseModel):
    """
    Request schema for selecting initial face-up cards.
    
    Attributes:
        room_id (str): Room identifier
        player_id (int): Player identifier (must be Player 1)
        card_ids (list): List of card IDs to place face-up
    
    Example:
        >>> request = SelectFaceUpCardsRequest(
        ...     room_id="ABC123",
        ...     player_id=1,
        ...     card_ids=["A_hearts", "K_spades", "Q_diamonds", "J_clubs"]
        ... )
    """
    room_id: str
    player_id: int
    card_ids: List[str]


# Response schemas

class PlayerResponse(BaseModel):
    """
    Response schema for player information.
    
    Attributes:
        id (int): Player identifier
        name (str): Player display name
        ready (bool): Player ready status
        joined_at (datetime, optional): When player joined
        ip_address (str, optional): Player IP address
    
    Example:
        >>> player = PlayerResponse(id=1, name="Alice", ready=True, joined_at=datetime.now())
    """
    id: int
    name: str
    ready: bool
    joined_at: Optional[datetime]
    ip_address: Optional[str] = None

class GameStateResponse(BaseModel):
    """
    Response schema for complete game state.
    
    Contains all information about the current game state including cards, scores,
    phase, and player status. This is the primary response for most game endpoints.
    
    Attributes:
        room_id (str): Room identifier
        players (list): List of PlayerResponse objects
        phase (str): Current game phase
        round (int): Current round number (0, 1, or 2)
        deck (list): Remaining deck cards as dicts
        player1_hand (list): Player 1's hand cards
        player2_hand (list): Player 2's hand cards
        table_cards (list): Cards on the table
        builds (list): Active builds
        player1_captured (list): Player 1's captured cards
        player2_captured (list): Player 2's captured cards
        player1_score (int): Player 1's score
        player2_score (int): Player 2's score
        current_turn (int): Current player's turn (1 or 2)
        card_selection_complete (bool): Whether card selection is done
        shuffle_complete (bool): Whether shuffle is complete
        countdown_start_time (datetime, optional): Countdown start time
        game_started (bool): Whether game has started
        last_play (dict, optional): Last action played
        last_action (str, optional): Type of last action
        last_update (datetime, optional): Last update timestamp
        game_completed (bool): Whether game is finished
        winner (int, optional): Winning player (1, 2, or None)
        dealing_complete (bool): Whether dealing is complete
        player1_ready (bool): Player 1 ready status
        player2_ready (bool): Player 2 ready status
        countdown_remaining (int, optional): Countdown seconds remaining
    """
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
    countdown_start_time: Optional[datetime]
    game_started: bool
    last_play: Optional[Dict[str, Any]]
    last_action: Optional[str]
    last_update: Optional[datetime]
    game_completed: bool
    winner: Optional[int]
    dealing_complete: bool
    player1_ready: bool
    player2_ready: bool
    countdown_remaining: Optional[int]


class CreateRoomResponse(BaseModel):
    """
    Response schema for room creation.
    
    Attributes:
        room_id (str): Created room identifier
        player_id (int): Creating player's ID
        game_state (GameStateResponse): Initial game state
    
    Example:
        >>> response = CreateRoomResponse(
        ...     room_id="ABC123",
        ...     player_id=1,
        ...     game_state=game_state
        ... )
    """
    room_id: str
    player_id: int
    game_state: GameStateResponse


class JoinRoomResponse(BaseModel):
    """
    Response schema for joining a room.
    
    Attributes:
        player_id (int): Joining player's ID
        game_state (GameStateResponse): Current game state
    
    Example:
        >>> response = JoinRoomResponse(player_id=2, game_state=game_state)
    """
    player_id: int
    game_state: GameStateResponse


class StandardResponse(BaseModel):
    """
    Standard response schema for most game actions.
    
    Attributes:
        success (bool): Whether action succeeded
        message (str): Human-readable message
        game_state (GameStateResponse, optional): Updated game state
    
    Example:
        >>> response = StandardResponse(
        ...     success=True,
        ...     message="Card played successfully",
        ...     game_state=game_state
        ... )
    """
    success: bool
    message: str
    game_state: Optional[GameStateResponse] = None
