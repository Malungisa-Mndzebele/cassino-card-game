"""
Room Service - Business logic for room management

Handles room creation, joining, state retrieval, and room lifecycle.
Separates business logic from route handlers for better testability.
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import string
import logging

from models import Room, Player
from schemas import CreateRoomRequest, JoinRoomRequest
from cache_manager import CacheManager
from game_logic import CasinoGameLogic

logger = logging.getLogger(__name__)


class RoomService:
    """
    Service for room-related operations.
    
    Provides methods for creating rooms, joining rooms, finding available rooms,
    and managing room state. Uses caching for performance optimization.
    """
    
    def __init__(
        self,
        db: Session,
        cache_manager: Optional[CacheManager] = None,
        game_logic: Optional[CasinoGameLogic] = None
    ):
        """
        Initialize room service.
        
        Args:
            db: Database session
            cache_manager: Optional cache manager for performance
            game_logic: Optional game logic instance
        """
        self.db = db
        self.cache_manager = cache_manager
        self.game_logic = game_logic or CasinoGameLogic()
    
    def generate_room_code(self, length: int = 6) -> str:
        """
        Generate unique room code.
        
        Args:
            length: Length of room code (default 6)
        
        Returns:
            Unique room code string
        """
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
            existing = self.db.query(Room).filter(Room.id == code).first()
            if not existing:
                return code
    
    def create_room(
        self,
        request: CreateRoomRequest,
        player_ip: str,
        user_agent: str
    ) -> Tuple[Room, Player]:
        """
        Create new game room with initial player.
        
        Args:
            request: Room creation request with player name
            player_ip: Player's IP address
            user_agent: Player's user agent
        
        Returns:
            Tuple of (Room, Player) objects
        
        Raises:
            ValueError: If player name is invalid
        """
        # Validate player name
        if not request.player_name or len(request.player_name.strip()) == 0:
            raise ValueError("Player name cannot be empty")
        
        if len(request.player_name) > 50:
            raise ValueError("Player name too long (max 50 characters)")
        
        # Generate unique room code
        room_code = self.generate_room_code()
        
        # Create room
        room = Room(
            id=room_code,
            status="waiting",
            game_phase="waiting",
            current_turn=1,
            round_number=0,
            deck=[],
            player1_hand=[],
            player2_hand=[],
            table_cards=[],
            builds=[],
            player1_captured=[],
            player2_captured=[],
            player1_score=0,
            player2_score=0,
            shuffle_complete=False,
            card_selection_complete=False,
            dealing_complete=False,
            game_started=False,
            game_completed=False,
            player1_ready=False,
            player2_ready=False
        )
        
        self.db.add(room)
        self.db.flush()  # Get room ID
        
        # Create player 1
        player = Player(
            room_id=room.id,
            player_number=1,
            name=request.player_name.strip(),
            is_ready=False,
            ip_address=player_ip,
            user_agent=user_agent
        )
        
        self.db.add(player)
        self.db.commit()
        self.db.refresh(room)
        self.db.refresh(player)
        
        logger.info(f"Created room {room.id} with player {player.name}")
        
        return room, player
    
    def join_room(
        self,
        request: JoinRoomRequest,
        player_ip: str,
        user_agent: str
    ) -> Tuple[Room, Player]:
        """
        Join existing room as player 2.
        
        Args:
            request: Join room request with room code and player name
            player_ip: Player's IP address
            user_agent: Player's user agent
        
        Returns:
            Tuple of (Room, Player) objects
        
        Raises:
            ValueError: If room not found, full, or player name invalid
        """
        # Validate player name
        if not request.player_name or len(request.player_name.strip()) == 0:
            raise ValueError("Player name cannot be empty")
        
        if len(request.player_name) > 50:
            raise ValueError("Player name too long (max 50 characters)")
        
        # Find room
        room = self.db.query(Room).filter(Room.id == request.room_code.upper()).first()
        if not room:
            raise ValueError(f"Room {request.room_code} not found")
        
        # Check if room is full
        player_count = self.db.query(Player).filter(Player.room_id == room.id).count()
        if player_count >= 2:
            raise ValueError("Room is full")
        
        # Check if game already started
        if room.game_started:
            raise ValueError("Game already in progress")
        
        # Create player 2
        player = Player(
            room_id=room.id,
            player_number=2,
            name=request.player_name.strip(),
            is_ready=False,
            ip_address=player_ip,
            user_agent=user_agent
        )
        
        self.db.add(player)
        self.db.commit()
        self.db.refresh(room)
        self.db.refresh(player)
        
        logger.info(f"Player {player.name} joined room {room.id}")
        
        # Invalidate cache
        if self.cache_manager:
            self.cache_manager.invalidate_game_state(room.id)
        
        return room, player
    
    def find_random_room(self) -> Optional[Room]:
        """
        Find random available room to join.
        
        Returns:
            Available room or None if no rooms available
        """
        # Find rooms with only 1 player and not started
        available_rooms = (
            self.db.query(Room)
            .filter(Room.status == "waiting")
            .filter(Room.game_started == False)
            .all()
        )
        
        # Filter rooms with exactly 1 player
        valid_rooms = []
        for room in available_rooms:
            player_count = self.db.query(Player).filter(Player.room_id == room.id).count()
            if player_count == 1:
                valid_rooms.append(room)
        
        if not valid_rooms:
            return None
        
        # Return random room
        return random.choice(valid_rooms)
    
    def get_room_state(self, room_id: str) -> Optional[Room]:
        """
        Get current room state with caching.
        
        Args:
            room_id: Room code
        
        Returns:
            Room object or None if not found
        """
        # Try cache first
        if self.cache_manager:
            cached_state = self.cache_manager.get_game_state(room_id)
            if cached_state:
                return cached_state
        
        # Fallback to database
        room = self.db.query(Room).filter(Room.id == room_id).first()
        
        # Cache for next time
        if room and self.cache_manager:
            self.cache_manager.cache_game_state(room_id, room)
        
        return room
    
    def get_room_players(self, room_id: str) -> List[Player]:
        """
        Get all players in a room.
        
        Args:
            room_id: Room code
        
        Returns:
            List of Player objects
        """
        return self.db.query(Player).filter(Player.room_id == room_id).all()
    
    def is_room_full(self, room_id: str) -> bool:
        """
        Check if room has 2 players.
        
        Args:
            room_id: Room code
        
        Returns:
            True if room has 2 players
        """
        player_count = self.db.query(Player).filter(Player.room_id == room_id).count()
        return player_count >= 2
    
    def update_room_state(self, room: Room) -> Room:
        """
        Update room state in database and cache.
        
        Args:
            room: Room object with updated state
        
        Returns:
            Updated room object
        """
        self.db.commit()
        self.db.refresh(room)
        
        # Update cache
        if self.cache_manager:
            self.cache_manager.cache_game_state(room.id, room)
        
        return room
