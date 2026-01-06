"""
Player Service - Business logic for player management

Handles player ready status, player retrieval, and player lifecycle.
Separates business logic from route handlers for better testability.
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
from datetime import datetime

from models import Room, Player
from cache_manager import CacheManager

logger = logging.getLogger(__name__)


class PlayerService:
    """
    Service for player-related operations.
    
    Provides methods for managing player ready status, retrieving players,
    and handling player lifecycle within rooms.
    """
    
    def __init__(
        self,
        db: AsyncSession,
        cache_manager: Optional[CacheManager] = None
    ):
        """
        Initialize player service.
        
        Args:
            db: Async database session
            cache_manager: Optional cache manager for performance
        """
        self.db = db
        self.cache_manager = cache_manager
    
    def get_sorted_players(self, room: Room) -> List[Player]:
        """Return players sorted by join time (player 1 first)."""
        if not room.players:
            return []
        return sorted(room.players, key=lambda p: p.joined_at or datetime.min)
    
    async def get_player(self, room_id: str, player_id: int) -> Optional[Player]:
        """
        Get player by ID in a specific room.
        
        Args:
            room_id: Room code
            player_id: Player identifier
        
        Returns:
            Player object or None if not found
        """
        result = await self.db.execute(
            select(Player).where(
                Player.id == player_id,
                Player.room_id == room_id
            )
        )
        return result.scalar_one_or_none()
    
    async def set_player_ready(
        self,
        room: Room,
        player: Player,
        is_ready: bool,
        client_version: Optional[int] = None
    ) -> Tuple[Room, bool]:
        """
        Set player ready status and handle game phase transitions.
        
        Args:
            room: Room object
            player: Player object
            is_ready: Ready status to set
            client_version: Client's version for conflict detection
        
        Returns:
            Tuple of (updated room, phase_changed)
        
        Raises:
            VersionConflictError: If client version doesn't match server
        """
        from version_validator import validate_version
        from services.game_service import VersionConflictError
        
        # Version conflict handling
        if client_version is not None:
            validation = validate_version(client_version, room.version)
            if not validation.valid:
                raise VersionConflictError(
                    message=validation.message,
                    client_version=client_version,
                    server_version=room.version,
                    requires_sync=validation.requires_sync,
                    has_gap=validation.has_gap,
                    gap_size=validation.gap_size
                )
        
        # Update player ready status
        player.ready = is_ready
        
        # Get sorted players to determine player position
        players_in_room = self.get_sorted_players(room)
        
        # Update room ready status based on player position
        if len(players_in_room) >= 1 and player.id == players_in_room[0].id:
            room.player1_ready = is_ready
        elif len(players_in_room) >= 2 and player.id == players_in_room[1].id:
            room.player2_ready = is_ready
        
        # Increment version and update metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = player.id
        
        # Check for phase transition
        phase_changed = False
        if room.player1_ready and room.player2_ready and room.game_phase == "waiting":
            logger.info(f"Both players ready! Transitioning room {room.id} to dealer phase")
            room.game_phase = "dealer"
            room.version += 1
            room.last_modified = datetime.utcnow()
            phase_changed = True
        
        await self.db.commit()
        
        logger.info(
            f"Room {room.id} ready status: player1={room.player1_ready}, "
            f"player2={room.player2_ready}, phase={room.game_phase}"
        )
        
        # Invalidate cache
        if self.cache_manager:
            self.cache_manager.invalidate_game_state(room.id)
        
        return room, phase_changed
    
    async def remove_player_from_room(self, room: Room, player: Player) -> Room:
        """
        Remove a player from a room.
        
        Args:
            room: Room object
            player: Player to remove
        
        Returns:
            Updated room object
        """
        # Get player position before removal
        players_in_room = self.get_sorted_players(room)
        is_player1 = len(players_in_room) >= 1 and player.id == players_in_room[0].id
        
        # Delete the player
        await self.db.delete(player)
        
        # Update room ready status
        if is_player1:
            room.player1_ready = False
        else:
            room.player2_ready = False
        
        # Reset game if in progress
        if room.game_started:
            room.game_phase = "waiting"
            room.game_started = False
            room.game_completed = False
        
        # Increment version
        room.version += 1
        room.last_modified = datetime.utcnow()
        
        await self.db.commit()
        
        logger.info(f"Player {player.id} removed from room {room.id}")
        
        # Invalidate cache
        if self.cache_manager:
            self.cache_manager.invalidate_game_state(room.id)
        
        return room
    
    async def get_player_count(self, room_id: str) -> int:
        """
        Get number of players in a room.
        
        Args:
            room_id: Room code
        
        Returns:
            Number of players
        """
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count(Player.id)).where(Player.room_id == room_id)
        )
        return result.scalar() or 0
