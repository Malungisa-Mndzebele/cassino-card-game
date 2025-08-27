from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request schemas
class CreateRoomRequest(BaseModel):
    player_name: str
    ip_address: Optional[str] = None

class JoinRoomRequest(BaseModel):
    room_id: str
    player_name: str
    ip_address: Optional[str] = None

class SetPlayerReadyRequest(BaseModel):
    room_id: str
    player_id: int
    is_ready: bool

class PlayCardRequest(BaseModel):
    room_id: str
    player_id: int
    card_id: str
    action: str  # capture, build, trail
    target_cards: Optional[List[str]] = None
    build_value: Optional[int] = None

class StartShuffleRequest(BaseModel):
    room_id: str
    player_id: int

class SelectFaceUpCardsRequest(BaseModel):
    room_id: str
    player_id: int
    card_ids: List[str]

# Response schemas
class PlayerResponse(BaseModel):
    id: int
    name: str
    ready: bool
    joined_at: datetime
    ip_address: Optional[str] = None

class GameStateResponse(BaseModel):
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
    last_update: datetime
    game_completed: bool
    winner: Optional[int]
    dealing_complete: bool
    player1_ready: bool
    player2_ready: bool
    countdown_remaining: Optional[int]

class CreateRoomResponse(BaseModel):
    room_id: str
    player_id: int
    game_state: GameStateResponse

class JoinRoomResponse(BaseModel):
    player_id: int
    game_state: GameStateResponse

class StandardResponse(BaseModel):
    success: bool
    message: str
    game_state: Optional[GameStateResponse] = None
