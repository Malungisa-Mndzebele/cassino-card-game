"""
Enhanced WebSocket Manager with Redis Pub/Sub

Handles WebSocket connections with Redis pub/sub for horizontal scaling,
session validation, heartbeat tracking, and message broadcasting across
multiple server instances.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional, Set
import json
import logging
import asyncio
from datetime import datetime

from session_manager import get_session_manager
from redis_client import redis_client
from cache_manager import cache_manager

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """
    WebSocket connection manager with Redis pub/sub for horizontal scaling.
    
    Supports multiple server instances by using Redis pub/sub to broadcast
    messages across all instances. Each instance maintains its own WebSocket
    connections but can send messages to any room on any instance.
    """
    
    def __init__(self):
        # Local connections: room_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
        # Session to WebSocket mapping for quick lookup
        self.session_websockets: Dict[str, WebSocket] = {}
        
        # WebSocket to session_id mapping
        self.websocket_sessions: Dict[WebSocket, str] = {}
        
        # Redis pub/sub subscriber task
        self._subscriber_task: Optional[asyncio.Task] = None
        
        # Instance ID for debugging
        import uuid
        self.instance_id = str(uuid.uuid4())[:8]
        
        logger.info(f"WebSocket manager initialized (instance: {self.instance_id})")
    
    async def start_subscriber(self):
        """Start Redis pub/sub subscriber for cross-instance messaging"""
        if self._subscriber_task is None:
            self._subscriber_task = asyncio.create_task(self._subscribe_to_redis())
            logger.info("Redis pub/sub subscriber started")
    
    async def stop_subscriber(self):
        """Stop Redis pub/sub subscriber"""
        if self._subscriber_task:
            self._subscriber_task.cancel()
            try:
                await self._subscriber_task
            except asyncio.CancelledError:
                pass
            self._subscriber_task = None
            logger.info("Redis pub/sub subscriber stopped")
    
    async def _subscribe_to_redis(self):
        """
        Subscribe to Redis pub/sub channels and forward messages to local WebSockets.
        
        This allows messages published from any server instance to be delivered
        to WebSocket connections on this instance.
        """
        try:
            client = await redis_client.get_async_client()
            pubsub = client.pubsub()
            
            # Subscribe to all room channels (pattern matching)
            await pubsub.psubscribe("room:*")
            
            logger.info("Subscribed to Redis pub/sub channels")
            
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    try:
                        # Extract room_id from channel name (room:ROOM_ID)
                        channel = message["channel"]
                        if isinstance(channel, bytes):
                            channel = channel.decode('utf-8')
                        room_id = channel.split(":", 1)[1]
                        
                        # Parse message data
                        msg_data = message["data"]
                        if isinstance(msg_data, bytes):
                            msg_data = msg_data.decode('utf-8')
                        data = json.loads(msg_data)
                        
                        logger.debug(f"Received message for room {room_id}: type={data.get('type', 'unknown')}")
                        
                        # Forward to local WebSocket connections
                        await self._broadcast_to_local_connections(room_id, data)
                        
                    except Exception as e:
                        logger.error(f"Error processing Redis message: {e}")
        
        except asyncio.CancelledError:
            logger.info("Redis subscriber cancelled")
            raise
        except Exception as e:
            logger.error(f"Redis subscriber error: {e}")
            # Attempt to reconnect after delay
            await asyncio.sleep(5)
            await self._subscribe_to_redis()
    
    async def connect(
        self,
        websocket: WebSocket,
        room_id: str,
        session_token: Optional[str],
        db_session
    ) -> tuple[bool, Optional[str], Optional[dict]]:
        """
        Establish WebSocket connection with session validation
        
        Args:
            websocket: WebSocket connection
            room_id: Room identifier
            session_token: Optional session token for authentication
            db_session: Database session
        
        Returns:
            Tuple of (success, error_message, session_data)
        """
        try:
            await websocket.accept()
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {e}")
            return False, "Connection failed", None
        
        # Validate session if token provided
        session_data = None
        if session_token:
            try:
                session_manager = get_session_manager(db_session)
                session_data = await session_manager.validate_session(session_token)
                
                if not session_data:
                    await websocket.send_json({
                        "type": "error",
                        "code": "invalid_session",
                        "message": "Invalid or expired session token"
                    })
                    await websocket.close(code=1008, reason="Invalid session")
                    return False, "Invalid session token", None
                
                # Check if session belongs to this room
                if session_data.get("room_id") != room_id:
                    await websocket.send_json({
                        "type": "error",
                        "code": "wrong_room",
                        "message": "Session does not belong to this room"
                    })
                    await websocket.close(code=1008, reason="Wrong room")
                    return False, "Session room mismatch", None
                
                # Check for concurrent connection
                session_id = session_data.get("token")
                if session_id in self.session_websockets:
                    # Close old connection
                    old_ws = self.session_websockets[session_id]
                    try:
                        await old_ws.send_json({
                            "type": "connection_takeover",
                            "message": "Connection taken over from another location"
                        })
                        await old_ws.close(code=1000, reason="Connection takeover")
                    except Exception as e:
                        logger.warning(f"Failed to close old connection: {e}")
                    logger.warning(f"Connection takeover for session {session_id}")
                
                # Update heartbeat
                try:
                    await session_manager.update_heartbeat(session_token)
                except Exception as e:
                    logger.warning(f"Failed to update heartbeat: {e}")
                
                # Store session mapping
                self.session_websockets[session_id] = websocket
                self.websocket_sessions[websocket] = session_id
                
                logger.info(f"Session {session_id} connected to room {room_id}")
            except Exception as e:
                logger.error(f"Session validation failed: {e}")
                # Continue without session - allow anonymous connections
                session_data = None
        
        # Add to active connections
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        
        self.active_connections[room_id].add(websocket)
        
        # Broadcast connection status (with error handling)
        try:
            await self.broadcast_to_room({
                "type": "player_connected",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            }, room_id)
        except Exception as e:
            logger.warning(f"Failed to broadcast connection status: {e}")
        
        return True, None, session_data
    
    async def disconnect(self, websocket: WebSocket, room_id: str):
        """
        Handle WebSocket disconnection
        
        Args:
            websocket: WebSocket connection
            room_id: Room identifier
        """
        # Remove from active connections
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        # Remove from session mappings
        session_id = self.websocket_sessions.pop(websocket, None)
        if session_id and session_id in self.session_websockets:
            del self.session_websockets[session_id]
        
        if session_id:
            logger.info(f"Session {session_id} disconnected from room {room_id}")
        
        # Broadcast disconnection
        await self.broadcast_to_room({
            "type": "player_disconnected",
            "room_id": room_id,
            "timestamp": datetime.utcnow().isoformat()
        }, room_id)
    
    async def broadcast_to_room(self, data: dict, room_id: str):
        """
        Broadcast message to all connections in a room across all instances.
        
        Uses Redis pub/sub to ensure message reaches all server instances.
        Falls back to local broadcast if Redis is unavailable.
        
        Args:
            data: Data to broadcast
            room_id: Room identifier
        """
        try:
            # Try to publish to Redis (will be received by all instances including this one)
            await redis_client.publish(f"room:{room_id}", data)
        except Exception as e:
            # Redis unavailable - fallback to local broadcast
            logger.warning(f"Redis publish failed, using local broadcast: {e}")
            await self._broadcast_to_local_connections(room_id, data)
    
    async def broadcast_json_to_room(self, data: dict, room_id: str):
        """
        Broadcast JSON message to all connections in a room.
        
        Convenience method that wraps broadcast_to_room.
        
        Args:
            data: Data to broadcast (will be sent as JSON)
            room_id: Room identifier
        """
        await self.broadcast_to_room(data, room_id)
    
    async def _broadcast_to_local_connections(self, room_id: str, data: dict):
        """
        Broadcast message to local WebSocket connections only.
        
        Called by Redis subscriber when a message is received.
        
        Args:
            room_id: Room identifier
            data: Data to broadcast
        """
        if room_id not in self.active_connections:
            return
        
        # Send to all local connections
        disconnected = []
        connection_count = len(self.active_connections[room_id])
        logger.debug(f"Broadcasting to {connection_count} connections in room {room_id}")
        
        for websocket in self.active_connections[room_id]:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"Failed to send to WebSocket in room {room_id}: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected WebSockets
        if disconnected:
            logger.debug(f"Removing {len(disconnected)} disconnected websockets from room {room_id}")
        for ws in disconnected:
            await self.disconnect(ws, room_id)
    
    async def send_to_session(self, session_id: str, data: dict) -> bool:
        """
        Send data to a specific session (if connected to this instance)
        
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
    
    async def handle_heartbeat(self, websocket: WebSocket, db_session) -> dict:
        """
        Process heartbeat ping and respond with pong
        
        Args:
            websocket: WebSocket connection
            db_session: Database session
        
        Returns:
            Pong response data
        """
        session_id = self.websocket_sessions.get(websocket)
        
        if session_id:
            session_manager = get_session_manager(db_session)
            await session_manager.update_heartbeat(session_id)
        
        return {
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat(),
            "instance_id": self.instance_id
        }
    
    def get_connected_count(self, room_id: str) -> int:
        """
        Get number of connections in a room on this instance
        
        Args:
            room_id: Room identifier
        
        Returns:
            Number of connections
        """
        return len(self.active_connections.get(room_id, set()))
    
    def is_session_connected(self, session_id: str) -> bool:
        """
        Check if a session is connected to this instance
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if connected, False otherwise
        """
        return session_id in self.session_websockets
    
    async def get_room_stats(self, room_id: str) -> dict:
        """
        Get statistics for a room
        
        Args:
            room_id: Room identifier
        
        Returns:
            Statistics dictionary
        """
        return {
            "room_id": room_id,
            "local_connections": self.get_connected_count(room_id),
            "instance_id": self.instance_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def send_to_room_except(
        self,
        room_id: str,
        exclude_session_id: str,
        message: dict
    ) -> bool:
        """
        Send message to all players in room except one.
        Used for voice signaling to relay messages to opponent only.
        
        Args:
            room_id: Room identifier
            exclude_session_id: Session ID to exclude from broadcast
            message: Message data to send
        
        Returns:
            True if sent to at least one recipient, False otherwise
        """
        if room_id not in self.active_connections:
            return False
        
        sent_count = 0
        disconnected = []
        
        for websocket in self.active_connections[room_id]:
            # Get session ID for this websocket
            ws_session_id = self.websocket_sessions.get(websocket)
            
            # Skip if this is the excluded session
            if ws_session_id == exclude_session_id:
                continue
            
            try:
                await websocket.send_json(message)
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to WebSocket: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected WebSockets
        for ws in disconnected:
            await self.disconnect(ws, room_id)
        
        return sent_count > 0


# Global connection manager instance
manager = WebSocketConnectionManager()
