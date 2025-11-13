"""
Enhanced WebSocket Manager with Session Support
Handles WebSocket connections with session validation and heartbeat
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json
import logging
from datetime import datetime

from session_manager import SessionManager
from models import GameSession


logger = logging.getLogger(__name__)


class EnhancedConnectionManager:
    """Enhanced WebSocket connection manager with session support"""
    
    def __init__(self):
        # Map of room_id -> list of (websocket, session_id) tuples
        self.active_connections: Dict[str, List[tuple[WebSocket, str]]] = {}
        # Map of session_id -> websocket for quick lookup
        self.session_websockets: Dict[str, WebSocket] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        room_id: str,
        session_token: Optional[str],
        db_session
    ) -> tuple[bool, Optional[str], Optional[GameSession]]:
        """
        Establish WebSocket connection with session validation
        
        Args:
            websocket: WebSocket connection
            room_id: Room identifier
            session_token: Optional session token for reconnection
            db_session: Database session
            
        Returns:
            Tuple of (success, error_message, game_session)
        """
        await websocket.accept()
        
        # If session token provided, validate it
        game_session = None
        if session_token:
            session_manager = SessionManager(db_session)
            game_session = session_manager.validate_session(session_token)
            
            if not game_session:
                await websocket.send_json({
                    "type": "error",
                    "code": "invalid_session",
                    "message": "Invalid or expired session token"
                })
                await websocket.close(code=1008, reason="Invalid session")
                return False, "Invalid session token", None
            
            # Check if session belongs to this room
            if game_session.room_id != room_id:
                await websocket.send_json({
                    "type": "error",
                    "code": "wrong_room",
                    "message": "Session does not belong to this room"
                })
                await websocket.close(code=1008, reason="Wrong room")
                return False, "Session room mismatch", None
            
            # Check for concurrent connection
            if game_session.id in self.session_websockets:
                # Concurrent connection detected
                await websocket.send_json({
                    "type": "concurrent_connection",
                    "message": "Game is open in another tab. Take over this session?"
                })
                # Don't close yet, wait for client response
                logger.warning(f"Concurrent connection detected for session {game_session.id}")
            
            # Update heartbeat
            session_manager.update_heartbeat(game_session.id)
            
            logger.info(f"Session {game_session.id} connected to room {room_id}")
        
        # Add to active connections
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        session_id = game_session.id if game_session else None
        self.active_connections[room_id].append((websocket, session_id))
        
        if session_id:
            self.session_websockets[session_id] = websocket
        
        # Broadcast connection status
        await self.broadcast_connection_status(room_id, db_session)
        
        return True, None, game_session
    
    def disconnect(self, websocket: WebSocket, room_id: str, session_id: Optional[str], db_session):
        """
        Handle WebSocket disconnection
        
        Args:
            websocket: WebSocket connection
            room_id: Room identifier
            session_id: Session identifier if available
            db_session: Database session
        """
        # Remove from active connections
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                (ws, sid) for ws, sid in self.active_connections[room_id]
                if ws != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        # Remove from session websockets
        if session_id and session_id in self.session_websockets:
            del self.session_websockets[session_id]
        
        # Mark session as disconnected
        if session_id:
            session_manager = SessionManager(db_session)
            session_manager.mark_disconnected(session_id)
            logger.info(f"Session {session_id} disconnected from room {room_id}")
    
    async def broadcast_to_room(self, message: str, room_id: str):
        """
        Broadcast message to all connections in a room
        
        Args:
            message: Message to broadcast
            room_id: Room identifier
        """
        if room_id in self.active_connections:
            disconnected = []
            for websocket, session_id in self.active_connections[room_id]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send to session {session_id}: {e}")
                    disconnected.append((websocket, session_id))
            
            # Remove disconnected websockets
            for ws, sid in disconnected:
                self.active_connections[room_id].remove((ws, sid))
                if sid and sid in self.session_websockets:
                    del self.session_websockets[sid]
    
    async def broadcast_json_to_room(self, data: dict, room_id: str):
        """
        Broadcast JSON data to all connections in a room
        
        Args:
            data: Data to broadcast
            room_id: Room identifier
        """
        message = json.dumps(data)
        await self.broadcast_to_room(message, room_id)
    
    async def broadcast_connection_status(self, room_id: str, db_session):
        """
        Broadcast connection status of all players in room
        
        Args:
            room_id: Room identifier
            db_session: Database session
        """
        session_manager = SessionManager(db_session)
        sessions = session_manager.get_room_sessions(room_id)
        
        players_status = []
        for session in sessions:
            status = {
                "player_id": session.player_id,
                "connected": session.id in self.session_websockets,
                "disconnected_since": session.disconnected_at.isoformat() if session.disconnected_at else None
            }
            players_status.append(status)
        
        await self.broadcast_json_to_room({
            "type": "connection_status",
            "players": players_status
        }, room_id)
    
    async def handle_heartbeat(self, room_id: str, session_id: str, db_session) -> dict:
        """
        Process heartbeat ping and respond with pong
        
        Args:
            room_id: Room identifier
            session_id: Session identifier
            db_session: Database session
            
        Returns:
            Pong response data
        """
        session_manager = SessionManager(db_session)
        session_manager.update_heartbeat(session_id)
        
        return {
            "type": "pong",
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id
        }
    
    async def send_to_session(self, session_id: str, data: dict) -> bool:
        """
        Send data to a specific session
        
        Args:
            session_id: Session identifier
            data: Data to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        if session_id in self.session_websockets:
            try:
                await self.session_websockets[session_id].send_json(data)
                return True
            except Exception as e:
                logger.error(f"Failed to send to session {session_id}: {e}")
                return False
        return False
    
    def get_connected_sessions(self, room_id: str) -> List[str]:
        """
        Get list of connected session IDs for a room
        
        Args:
            room_id: Room identifier
            
        Returns:
            List of session IDs
        """
        if room_id not in self.active_connections:
            return []
        
        return [sid for _, sid in self.active_connections[room_id] if sid]
    
    def is_session_connected(self, session_id: str) -> bool:
        """
        Check if a session is currently connected
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if connected, False otherwise
        """
        return session_id in self.session_websockets
