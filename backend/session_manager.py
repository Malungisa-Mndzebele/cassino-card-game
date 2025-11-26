"""
Session Manager Service with Redis Backend

Handles session creation, validation, heartbeat tracking, and cleanup using Redis
for high-performance session storage with automatic expiration.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
import hashlib
import secrets

from models import GameSession, Player, Room
from redis_client import redis_client
from cache_manager import cache_manager

logger = logging.getLogger(__name__)


class SessionToken:
    """Session token with metadata"""
    
    def __init__(
        self,
        token: str,
        room_id: str,
        player_id: int,
        player_name: str,
        created_at: datetime,
        expires_at: datetime
    ):
        self.token = token
        self.room_id = room_id
        self.player_id = player_id
        self.player_name = player_name
        self.created_at = created_at
        self.expires_at = expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Redis storage"""
        return {
            "token": self.token,
            "room_id": self.room_id,
            "player_id": self.player_id,
            "player_name": self.player_name,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionToken":
        """Create from dictionary"""
        return cls(
            token=data["token"],
            room_id=data["room_id"],
            player_id=data["player_id"],
            player_name=data["player_name"],
            created_at=datetime.fromisoformat(data["created_at"]),
            expires_at=datetime.fromisoformat(data["expires_at"])
        )
    
    def to_string(self) -> str:
        """Get token string"""
        return self.token
    
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at


def create_session_token(
    room_id: str,
    player_id: int,
    player_name: str,
    ttl_hours: int = 24
) -> SessionToken:
    """
    Create a new session token
    
    Args:
        room_id: Room identifier
        player_id: Player identifier
        player_name: Player display name
        ttl_hours: Token time-to-live in hours
    
    Returns:
        SessionToken object
    """
    # Generate secure random token
    token = secrets.token_urlsafe(32)
    
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(hours=ttl_hours)
    
    return SessionToken(
        token=token,
        room_id=room_id,
        player_id=player_id,
        player_name=player_name,
        created_at=created_at,
        expires_at=expires_at
    )


def create_session_fingerprint(ip_address: str, user_agent: str) -> str:
    """
    Create session fingerprint for security
    
    Args:
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        Fingerprint hash
    """
    data = f"{ip_address}:{user_agent}"
    return hashlib.sha256(data.encode()).hexdigest()


class SessionManager:
    """Manages game sessions with Redis backend"""
    
    # Session TTL in seconds (30 minutes with sliding window)
    SESSION_TTL = 1800
    
    # Heartbeat interval (session extends TTL on heartbeat)
    HEARTBEAT_INTERVAL = 30
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_session(
        self,
        room_id: str,
        player_id: int,
        player_name: str,
        ip_address: str,
        user_agent: str
    ) -> SessionToken:
        """
        Create a new session and store in Redis
        
        Args:
            room_id: Room identifier
            player_id: Player identifier
            player_name: Player display name
            ip_address: Client IP address
            user_agent: Client user agent string
        
        Returns:
            SessionToken object
        """
        # Generate session token
        token = create_session_token(room_id, player_id, player_name)
        
        # Create session fingerprint
        fingerprint = create_session_fingerprint(ip_address, user_agent)
        
        # Session data for Redis
        session_data = {
            **token.to_dict(),
            "ip_address": ip_address,
            "user_agent": user_agent,
            "fingerprint": fingerprint,
            "connected_at": datetime.utcnow().isoformat(),
            "last_heartbeat": datetime.utcnow().isoformat(),
            "connection_count": 1,
            "is_active": True
        }
        
        # Store in Redis with TTL
        await cache_manager.cache_session(
            token.to_string(),
            session_data,
            ttl=self.SESSION_TTL
        )
        
        # Also store in database for persistence
        existing_session = await self.db.execute(
            select(GameSession).where(
                and_(
                    GameSession.room_id == room_id,
                    GameSession.player_id == player_id,
                    GameSession.is_active == True
                )
            )
        )
        existing_session = existing_session.scalar_one_or_none()
        
        if existing_session:
            # Update existing session
            existing_session.session_token = token.to_string()
            existing_session.connected_at = datetime.utcnow()
            existing_session.last_heartbeat = datetime.utcnow()
            existing_session.disconnected_at = None
            existing_session.connection_count += 1
            existing_session.ip_address = ip_address
            existing_session.user_agent = user_agent
            existing_session.is_active = True
        else:
            # Create new session
            session = GameSession(
                room_id=room_id,
                player_id=player_id,
                session_token=token.to_string(),
                connected_at=datetime.utcnow(),
                last_heartbeat=datetime.utcnow(),
                is_active=True,
                connection_count=1,
                ip_address=ip_address,
                user_agent=user_agent
            )
            self.db.add(session)
        
        await self.db.commit()
        
        logger.info(f"Session created for player {player_id} in room {room_id}")
        
        return token
    
    async def validate_session(
        self,
        token_str: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Validate session token and return session data
        
        Args:
            token_str: Session token string
            ip_address: Client IP for fingerprint validation
            user_agent: Client user agent for fingerprint validation
        
        Returns:
            Session data dict if valid, None otherwise
        """
        # Try to get from Redis first (fast path)
        session_data = await cache_manager.get_session(token_str)
        
        if not session_data:
            logger.warning("Session not found in Redis")
            return None
        
        # Check if session is active
        if not session_data.get("is_active", False):
            logger.warning("Session is not active")
            return None
        
        # Validate fingerprint if provided
        if ip_address and user_agent:
            fingerprint = create_session_fingerprint(ip_address, user_agent)
            if session_data.get("fingerprint") != fingerprint:
                logger.warning("Session fingerprint mismatch - possible session hijacking")
                return None
        
        # Check expiration
        expires_at = datetime.fromisoformat(session_data["expires_at"])
        if datetime.utcnow() > expires_at:
            logger.warning("Session token expired")
            await self.invalidate_session(token_str)
            return None
        
        return session_data
    
    async def update_heartbeat(self, token_str: str) -> bool:
        """
        Update last heartbeat timestamp and extend session TTL (sliding window)
        
        Args:
            token_str: Session token string
        
        Returns:
            True if successful
        """
        session_data = await cache_manager.get_session(token_str)
        
        if not session_data:
            return False
        
        # Update heartbeat timestamp
        session_data["last_heartbeat"] = datetime.utcnow().isoformat()
        
        # Extend session TTL (sliding window)
        await cache_manager.extend_session_ttl(token_str, self.SESSION_TTL)
        
        # Update session data
        await cache_manager.cache_session(token_str, session_data, ttl=self.SESSION_TTL)
        
        logger.debug(f"Heartbeat updated for session")
        
        return True
    
    async def invalidate_session(self, token_str: str) -> bool:
        """
        Invalidate a session
        
        Args:
            token_str: Session token string
        
        Returns:
            True if successful
        """
        success = await cache_manager.invalidate_session(token_str)
        
        if success:
            logger.info(f"Session invalidated")
        
        return success
    
    async def get_active_sessions(self, room_id: str) -> List[Dict[str, Any]]:
        """
        Get all active sessions for a room
        
        Args:
            room_id: Room identifier
        
        Returns:
            List of session data dictionaries
        """
        # Query database for active sessions
        result = await self.db.execute(
            select(GameSession).where(
                and_(
                    GameSession.room_id == room_id,
                    GameSession.is_active == True
                )
            )
        )
        sessions = result.scalars().all()
        
        # Get session data from Redis
        active_sessions = []
        for session in sessions:
            session_data = await cache_manager.get_session(session.session_token)
            if session_data:
                active_sessions.append(session_data)
        
        return active_sessions
    
    async def cleanup_expired_sessions(self) -> int:
        """
        Remove expired sessions from database
        
        Returns:
            Number of sessions cleaned up
        """
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        # Find expired sessions
        result = await self.db.execute(
            select(GameSession).where(
                GameSession.connected_at < twenty_four_hours_ago
            )
        )
        expired_sessions = result.scalars().all()
        
        count = len(expired_sessions)
        
        # Delete expired sessions
        for session in expired_sessions:
            await self.db.delete(session)
        
        await self.db.commit()
        
        if count > 0:
            logger.info(f"Cleaned up {count} expired sessions")
        
        return count
    
    async def mark_disconnected(self, session_id: int) -> bool:
        """
        Mark a session as disconnected
        
        Args:
            session_id: Session database ID
        
        Returns:
            True if successful
        """
        result = await self.db.execute(
            select(GameSession).where(GameSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            return False
        
        session.disconnected_at = datetime.utcnow()
        session.is_active = False
        
        # Invalidate session in Redis
        if session.session_token:
            await self.invalidate_session(session.session_token)
        
        await self.db.commit()
        
        logger.info(f"Session {session_id} marked as disconnected")
        
        return True
    
    def get_room_sessions(self, room_id: str) -> List[GameSession]:
        """
        Get all sessions for a room (synchronous for compatibility)
        
        Args:
            room_id: Room identifier
        
        Returns:
            List of GameSession objects
        """
        # This is a synchronous wrapper for backward compatibility
        # In async context, use get_active_sessions instead
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If called from async context, return empty list
                # Caller should use get_active_sessions instead
                logger.warning("get_room_sessions called from async context, use get_active_sessions instead")
                return []
        except RuntimeError:
            pass
        
        # For now, return empty list - this method is deprecated
        return []
    
    async def check_abandoned_games(self) -> List[str]:
        """
        Check for games where all players have been disconnected for > 5 minutes
        
        Returns:
            List of room IDs with abandoned games
        """
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        
        # Find rooms where all players are disconnected for > 5 minutes
        result = await self.db.execute(
            select(GameSession.room_id)
            .where(
                and_(
                    GameSession.disconnected_at != None,
                    GameSession.disconnected_at < five_minutes_ago
                )
            )
            .distinct()
        )
        
        potential_abandoned_rooms = [row[0] for row in result.all()]
        
        # Verify these rooms have no active sessions
        abandoned_rooms = []
        for room_id in potential_abandoned_rooms:
            active_result = await self.db.execute(
                select(GameSession).where(
                    and_(
                        GameSession.room_id == room_id,
                        GameSession.is_active == True
                    )
                )
            )
            active_sessions = active_result.scalars().all()
            
            if not active_sessions:
                abandoned_rooms.append(room_id)
        
        return abandoned_rooms


# Global session manager instance (will be initialized with db session)
def get_session_manager(db: AsyncSession) -> SessionManager:
    """Get session manager instance"""
    return SessionManager(db)
