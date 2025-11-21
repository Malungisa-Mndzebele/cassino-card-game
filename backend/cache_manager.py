"""
Cache manager for frequently accessed game data.

Provides caching layer for game states, player data, and room information
to reduce database load and improve response times.
"""

from redis_client import redis_client
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Caching layer for game data"""

    # Cache key prefixes
    GAME_STATE_PREFIX = "game:state:"
    PLAYER_PREFIX = "player:"
    ROOM_PREFIX = "room:"
    SESSION_PREFIX = "session:"
    ACTIVE_ROOMS_KEY = "rooms:active"

    # Default TTL values (in seconds)
    GAME_STATE_TTL = 300  # 5 minutes
    PLAYER_DATA_TTL = 1800  # 30 minutes
    ROOM_DATA_TTL = 3600  # 1 hour
    SESSION_TTL = 1800  # 30 minutes

    async def cache_game_state(
        self, room_id: str, state: dict, ttl: int = GAME_STATE_TTL
    ) -> bool:
        """
        Cache game state

        Args:
            room_id: Room identifier
            state: Game state dictionary
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        key = f"{self.GAME_STATE_PREFIX}{room_id}"
        success = await redis_client.set_json(key, state, expire=ttl)
        if success:
            logger.debug(f"Cached game state for room {room_id}")
        return success

    async def get_game_state(self, room_id: str) -> Optional[dict]:
        """
        Retrieve cached game state

        Args:
            room_id: Room identifier

        Returns:
            Game state dictionary if found, None otherwise
        """
        key = f"{self.GAME_STATE_PREFIX}{room_id}"
        state = await redis_client.get_json(key)
        if state:
            logger.debug(f"Cache hit for game state: {room_id}")
        else:
            logger.debug(f"Cache miss for game state: {room_id}")
        return state

    async def invalidate_game_state(self, room_id: str) -> bool:
        """
        Invalidate game state cache

        Args:
            room_id: Room identifier

        Returns:
            True if key was deleted
        """
        key = f"{self.GAME_STATE_PREFIX}{room_id}"
        success = await redis_client.delete(key)
        if success:
            logger.debug(f"Invalidated game state cache for room {room_id}")
        return success

    async def cache_player_data(
        self, player_id: str, data: dict, ttl: int = PLAYER_DATA_TTL
    ) -> bool:
        """
        Cache player data

        Args:
            player_id: Player identifier
            data: Player data dictionary
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        key = f"{self.PLAYER_PREFIX}{player_id}"
        success = await redis_client.set_json(key, data, expire=ttl)
        if success:
            logger.debug(f"Cached player data for {player_id}")
        return success

    async def get_player_data(self, player_id: str) -> Optional[dict]:
        """
        Retrieve cached player data

        Args:
            player_id: Player identifier

        Returns:
            Player data dictionary if found, None otherwise
        """
        key = f"{self.PLAYER_PREFIX}{player_id}"
        data = await redis_client.get_json(key)
        if data:
            logger.debug(f"Cache hit for player data: {player_id}")
        else:
            logger.debug(f"Cache miss for player data: {player_id}")
        return data

    async def cache_room_data(
        self, room_id: str, data: dict, ttl: int = ROOM_DATA_TTL
    ) -> bool:
        """
        Cache room data

        Args:
            room_id: Room identifier
            data: Room data dictionary
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        key = f"{self.ROOM_PREFIX}{room_id}"
        success = await redis_client.set_json(key, data, expire=ttl)
        if success:
            logger.debug(f"Cached room data for {room_id}")
        return success

    async def get_room_data(self, room_id: str) -> Optional[dict]:
        """
        Retrieve cached room data

        Args:
            room_id: Room identifier

        Returns:
            Room data dictionary if found, None otherwise
        """
        key = f"{self.ROOM_PREFIX}{room_id}"
        data = await redis_client.get_json(key)
        if data:
            logger.debug(f"Cache hit for room data: {room_id}")
        else:
            logger.debug(f"Cache miss for room data: {room_id}")
        return data

    async def add_active_room(self, room_id: str) -> bool:
        """
        Add room to active rooms set

        Args:
            room_id: Room identifier

        Returns:
            True if successful
        """
        try:
            client = await redis_client.get_async_client()
            await client.sadd(self.ACTIVE_ROOMS_KEY, room_id)
            logger.debug(f"Added room {room_id} to active rooms")
            return True
        except Exception as e:
            logger.error(f"Error adding active room: {e}")
            return False

    async def remove_active_room(self, room_id: str) -> bool:
        """
        Remove room from active rooms set

        Args:
            room_id: Room identifier

        Returns:
            True if successful
        """
        try:
            client = await redis_client.get_async_client()
            await client.srem(self.ACTIVE_ROOMS_KEY, room_id)
            logger.debug(f"Removed room {room_id} from active rooms")
            return True
        except Exception as e:
            logger.error(f"Error removing active room: {e}")
            return False

    async def get_active_rooms(self) -> list[str]:
        """
        Get list of active room IDs

        Returns:
            List of active room IDs
        """
        try:
            client = await redis_client.get_async_client()
            rooms = await client.smembers(self.ACTIVE_ROOMS_KEY)
            return list(rooms)
        except Exception as e:
            logger.error(f"Error getting active rooms: {e}")
            return []

    async def cache_session(
        self, session_id: str, data: dict, ttl: int = SESSION_TTL
    ) -> bool:
        """
        Cache session data

        Args:
            session_id: Session identifier
            data: Session data dictionary
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        key = f"{self.SESSION_PREFIX}{session_id}"
        success = await redis_client.set_json(key, data, expire=ttl)
        if success:
            logger.debug(f"Cached session {session_id}")
        return success

    async def get_session(self, session_id: str) -> Optional[dict]:
        """
        Retrieve cached session data

        Args:
            session_id: Session identifier

        Returns:
            Session data dictionary if found, None otherwise
        """
        key = f"{self.SESSION_PREFIX}{session_id}"
        data = await redis_client.get_json(key)
        if data:
            logger.debug(f"Cache hit for session: {session_id}")
        else:
            logger.debug(f"Cache miss for session: {session_id}")
        return data

    async def invalidate_session(self, session_id: str) -> bool:
        """
        Invalidate session cache

        Args:
            session_id: Session identifier

        Returns:
            True if key was deleted
        """
        key = f"{self.SESSION_PREFIX}{session_id}"
        success = await redis_client.delete(key)
        if success:
            logger.debug(f"Invalidated session cache for {session_id}")
        return success

    async def extend_session_ttl(self, session_id: str, ttl: int = SESSION_TTL) -> bool:
        """
        Extend session TTL (sliding window)

        Args:
            session_id: Session identifier
            ttl: New time to live in seconds

        Returns:
            True if successful
        """
        key = f"{self.SESSION_PREFIX}{session_id}"
        success = await redis_client.expire(key, ttl)
        if success:
            logger.debug(f"Extended session TTL for {session_id}")
        return success

    async def clear_room_cache(self, room_id: str) -> bool:
        """
        Clear all cache entries for a room

        Args:
            room_id: Room identifier

        Returns:
            True if successful
        """
        tasks = [
            self.invalidate_game_state(room_id),
            redis_client.delete(f"{self.ROOM_PREFIX}{room_id}"),
            self.remove_active_room(room_id),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        success = all(r is True or not isinstance(r, Exception) for r in results)

        if success:
            logger.info(f"Cleared all cache for room {room_id}")
        return success


# Global cache manager instance
cache_manager = CacheManager()


# Import asyncio at the end to avoid circular imports
import asyncio
