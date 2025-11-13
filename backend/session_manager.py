"""
Session Manager Service
Handles session creation, validation, heartbeat tracking, and cleanup
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from models import GameSession, Player, Room
from session_token import SessionToken, create_session_token, validate_token


logger = logging.getLogger(__name__)


class SessionManager:
    """Manages game sessions and their lifecycle"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(
        self,
        room_id: str,
        player_id: int,
        player_name: str,
        ip_address: str,
        user_agent: str
    ) -> SessionToken:
        """
        Create a new session and return token
        
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
        
        # Check if session already exists for this player in this room
        existing_session = self.db.query(GameSession).filter(
            and_(
                GameSession.room_id == room_id,
                GameSession.player_id == player_id,
                GameSession.is_active == True
            )
        ).first()
        
        if existing_session:
            # Update existing session
            existing_session.session_token = token.to_string()
            existing_session.connected_at = datetime.now()
            existing_session.last_heartbeat = datetime.now()
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
                connected_at=datetime.now(),
                last_heartbeat=datetime.now(),
                is_active=True,
                connection_count=1,
                ip_address=ip_address,
                user_agent=user_agent
            )
            self.db.add(session)
        
        self.db.commit()
        
        logger.info(f"Session created for player {player_id} in room {room_id}")
        
        return token
    
    def validate_session(self, token_str: str) -> Optional[GameSession]:
        """
        Validate session token and return session if valid
        
        Args:
            token_str: Serialized token string
            
        Returns:
            GameSession object if valid, None otherwise
        """
        # Deserialize token
        token = SessionToken.from_string(token_str)
        if not token:
            logger.warning("Failed to deserialize token")
            return None
        
        # Validate token
        is_valid, error = validate_token(token)
        if not is_valid:
            logger.warning(f"Token validation failed: {error}")
            return None
        
        # Retrieve session from database
        session = self.db.query(GameSession).filter(
            GameSession.session_token == token_str
        ).first()
        
        if not session:
            logger.warning(f"Session not found for token")
            return None
        
        if not session.is_active:
            logger.warning(f"Session is not active")
            return None
        
        return session
    
    def update_heartbeat(self, session_id: str) -> None:
        """
        Update last heartbeat timestamp for a session
        
        Args:
            session_id: Session identifier
        """
        session = self.db.query(GameSession).filter(
            GameSession.id == session_id
        ).first()
        
        if session:
            session.last_heartbeat = datetime.now()
            
            # If session was disconnected, mark as reconnected
            if session.disconnected_at:
                session.reconnected_at = datetime.now()
                session.disconnected_at = None
                session.connection_count += 1
                logger.info(f"Session {session_id} reconnected")
            
            self.db.commit()
    
    def mark_disconnected(self, session_id: str) -> None:
        """
        Mark session as disconnected
        
        Args:
            session_id: Session identifier
        """
        session = self.db.query(GameSession).filter(
            GameSession.id == session_id
        ).first()
        
        if session:
            session.disconnected_at = datetime.now()
            self.db.commit()
            logger.info(f"Session {session_id} marked as disconnected")
    
    def check_abandoned_games(self) -> List[str]:
        """
        Find games with players disconnected > 5 minutes
        
        Returns:
            List of room IDs with abandoned players
        """
        five_minutes_ago = datetime.now() - timedelta(minutes=5)
        
        # Find sessions disconnected for more than 5 minutes
        abandoned_sessions = self.db.query(GameSession).filter(
            and_(
                GameSession.disconnected_at != None,
                GameSession.disconnected_at < five_minutes_ago,
                GameSession.is_active == True
            )
        ).all()
        
        # Get unique room IDs
        room_ids = list(set(session.room_id for session in abandoned_sessions))
        
        if room_ids:
            logger.info(f"Found {len(room_ids)} rooms with abandoned players")
        
        return room_ids
    
    def cleanup_expired_sessions(self) -> int:
        """
        Remove sessions older than 24 hours
        
        Returns:
            Number of sessions cleaned up
        """
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        
        # Find expired sessions
        expired_sessions = self.db.query(GameSession).filter(
            GameSession.connected_at < twenty_four_hours_ago
        ).all()
        
        count = len(expired_sessions)
        
        # Delete expired sessions
        for session in expired_sessions:
            self.db.delete(session)
        
        self.db.commit()
        
        if count > 0:
            logger.info(f"Cleaned up {count} expired sessions")
        
        return count
    
    def get_session_by_player(self, room_id: str, player_id: int) -> Optional[GameSession]:
        """
        Get active session for a player in a room
        
        Args:
            room_id: Room identifier
            player_id: Player identifier
            
        Returns:
            GameSession if found, None otherwise
        """
        return self.db.query(GameSession).filter(
            and_(
                GameSession.room_id == room_id,
                GameSession.player_id == player_id,
                GameSession.is_active == True
            )
        ).first()
    
    def get_room_sessions(self, room_id: str) -> List[GameSession]:
        """
        Get all active sessions for a room
        
        Args:
            room_id: Room identifier
            
        Returns:
            List of GameSession objects
        """
        return self.db.query(GameSession).filter(
            and_(
                GameSession.room_id == room_id,
                GameSession.is_active == True
            )
        ).all()
    
    def deactivate_session(self, session_id: str) -> None:
        """
        Deactivate a session
        
        Args:
            session_id: Session identifier
        """
        session = self.db.query(GameSession).filter(
            GameSession.id == session_id
        ).first()
        
        if session:
            session.is_active = False
            self.db.commit()
            logger.info(f"Session {session_id} deactivated")
