"""
Database Models for Casino Card Game

This module defines the SQLAlchemy ORM models for the application:
- Room: Game room with complete game state
- Player: Player information and room membership
- GameSession: Session tracking for reconnection support
- GameActionLog: Audit trail of all game actions

All models use SQLAlchemy declarative base and support both SQLite (dev) and PostgreSQL (prod).
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid


class Room(Base):
    """
    Game room model storing complete game state.
    
    A room represents a single game session between two players. It stores all game state
    including cards, scores, phase, and player ready status. The game state is persisted
    to enable recovery after server restarts or player disconnections.
    
    Attributes:
        id (str): 6-character unique room code (primary key)
        created_at (datetime): Room creation timestamp
        status (str): Room status (waiting, playing, finished)
        game_phase (str): Current game phase (waiting, dealer, round1, round2, finished)
        current_turn (int): Current player's turn (1 or 2)
        round_number (int): Current round number (0, 1, or 2)
        deck (list): Remaining cards in deck as JSON
        player1_hand (list): Player 1's hand cards as JSON
        player2_hand (list): Player 2's hand cards as JSON
        table_cards (list): Cards on the table as JSON
        builds (list): Active builds as JSON
        player1_captured (list): Player 1's captured cards as JSON
        player2_captured (list): Player 2's captured cards as JSON
        player1_score (int): Player 1's current score
        player2_score (int): Player 2's current score
        shuffle_complete (bool): Whether deck has been shuffled
        card_selection_complete (bool): Whether initial cards selected
        dealing_complete (bool): Whether dealing is complete
        game_started (bool): Whether game has started
        game_completed (bool): Whether game has finished
        last_play (dict): Last action played as JSON
        last_action (str): Type of last action
        last_update (datetime): Last state update timestamp
        winner (int): Winning player (1, 2, or None for tie)
        player1_ready (bool): Player 1 ready status
        player2_ready (bool): Player 2 ready status
        players (relationship): Related Player objects
    
    Example:
        >>> room = Room(id="ABC123")
        >>> room.game_phase = "waiting"
        >>> room.player1_score = 0
        >>> db.add(room)
        >>> db.commit()
    """
    __tablename__ = "rooms"
    
    id = Column(String(6), primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="waiting")  # waiting, playing, finished
    game_phase = Column(String(20), default="waiting")  # waiting, dealer, round1, round2, finished
    current_turn = Column(Integer, default=1)
    round_number = Column(Integer, default=0)
    
    # Game state as JSON
    deck = Column(JSON, default=list)
    player1_hand = Column(JSON, default=list)
    player2_hand = Column(JSON, default=list)
    table_cards = Column(JSON, default=list)
    builds = Column(JSON, default=list)
    player1_captured = Column(JSON, default=list)
    player2_captured = Column(JSON, default=list)
    player1_score = Column(Integer, default=0)
    player2_score = Column(Integer, default=0)
    
    # Game flags
    shuffle_complete = Column(Boolean, default=False)
    card_selection_complete = Column(Boolean, default=False)
    dealing_complete = Column(Boolean, default=False)
    game_started = Column(Boolean, default=False)
    game_completed = Column(Boolean, default=False)
    
    # Last play information
    last_play = Column(JSON, nullable=True)
    last_action = Column(String(50), nullable=True)
    last_update = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Winner
    winner = Column(Integer, nullable=True)  # 1, 2, or null for tie
    
    # Player ready status
    player1_ready = Column(Boolean, default=False)
    player2_ready = Column(Boolean, default=False)
    
    # Relationships
    players = relationship("Player", back_populates="room")

class Player(Base):
    """
    Player model representing a user in a game room.
    
    Players are associated with a specific room and have a unique name within that room.
    The model tracks ready status and connection information for session management.
    
    Attributes:
        id (int): Auto-incrementing player ID (primary key)
        room_id (str): Foreign key to Room
        name (str): Player display name (max 50 characters)
        ready (bool): Whether player is ready to start
        joined_at (datetime): When player joined the room
        ip_address (str): Player's IP address (supports IPv6, max 45 chars)
        room (relationship): Related Room object
    
    Example:
        >>> player = Player(room_id="ABC123", name="Alice", ip_address="192.168.1.1")
        >>> player.ready = True
        >>> db.add(player)
        >>> db.commit()
    """
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(6), ForeignKey("rooms.id"))
    name = Column(String(50), nullable=False)
    ready = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45), nullable=True)  # IPv6 addresses can be up to 45 characters
    
    # Relationship
    room = relationship("Room", back_populates="players")

class GameSession(Base):
    """
    Game session model for tracking player connections and enabling reconnection.
    
    Sessions maintain connection state and heartbeat information to support automatic
    reconnection after temporary disconnections. Each session has a unique token that
    clients use to restore their game state.
    
    Attributes:
        id (str): UUID session identifier (primary key)
        room_id (str): Foreign key to Room
        player_id (int): Foreign key to Player
        session_token (str): Unique session token for reconnection (max 256 chars, indexed)
        connected_at (datetime): Initial connection timestamp
        last_heartbeat (datetime): Last heartbeat received timestamp
        disconnected_at (datetime): Disconnection timestamp (None if connected)
        reconnected_at (datetime): Last reconnection timestamp
        is_active (bool): Whether session is active
        connection_count (int): Number of times connected
        ip_address (str): Client IP address
        user_agent (str): Client user agent string (max 256 chars)
    
    Example:
        >>> session = GameSession(room_id="ABC123", player_id=1)
        >>> session.session_token = "abc123def456..."
        >>> session.last_heartbeat = datetime.now()
        >>> db.add(session)
        >>> db.commit()
    """
    __tablename__ = "game_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String(6), ForeignKey("rooms.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    session_token = Column(String(256), unique=True, index=True, nullable=True)
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    last_heartbeat = Column(DateTime(timezone=True), server_default=func.now())
    disconnected_at = Column(DateTime(timezone=True), nullable=True)
    reconnected_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    connection_count = Column(Integer, default=0)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(256), nullable=True)


class GameActionLog(Base):
    """
    Game action log model for audit trail and replay functionality.
    
    Logs all game actions with sequence numbers to enable action replay, state recovery,
    and deduplication. Each action has a unique ID to prevent duplicate processing.
    
    Attributes:
        id (int): Auto-incrementing log entry ID (primary key)
        room_id (str): Foreign key to Room (indexed)
        player_id (int): Foreign key to Player who performed action
        action_type (str): Type of action (capture, build, trail, ready, shuffle)
        action_data (dict): Action details as JSON
        timestamp (datetime): When action occurred
        sequence_number (int): Sequential action number within room
        action_id (str): Unique action identifier for deduplication (indexed)
    
    Example:
        >>> action = GameActionLog(
        ...     room_id="ABC123",
        ...     player_id=1,
        ...     action_type="capture",
        ...     action_data={"card_id": "A_hearts", "target_cards": ["2_spades"]},
        ...     sequence_number=5,
        ...     action_id="abc123def456"
        ... )
        >>> db.add(action)
        >>> db.commit()
    """
    __tablename__ = "game_action_log"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(6), ForeignKey("rooms.id"), index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    action_type = Column(String(50), nullable=False)  # "capture", "build", "trail", "ready", "shuffle"
    action_data = Column(JSON, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    sequence_number = Column(Integer, nullable=False)
    action_id = Column(String(64), unique=True, index=True)  # For deduplication
