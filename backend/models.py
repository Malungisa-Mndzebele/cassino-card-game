"""
Database Models for Casino Card Game

This module defines the SQLAlchemy ORM models for the application:
- Room: Game room with complete game state
- Player: Player information and room membership
- GameSession: Session tracking for reconnection support
- GameActionLog: Audit trail of all game actions

All models use SQLAlchemy 2.0 declarative base with proper type hints.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, JSON, ForeignKey, Integer, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


class Room(Base):
    """
    Game room model storing complete game state.
    
    A room represents a single game session between two players. It stores all game state
    including cards, scores, phase, and player ready status. The game state is persisted
    to enable recovery after server restarts or player disconnections.
    
    Attributes:
        id: 6-character unique room code (primary key)
        created_at: Room creation timestamp
        updated_at: Last update timestamp
        status: Room status (waiting, playing, finished)
        game_phase: Current game phase (waiting, dealer, round1, round2, finished)
        current_turn: Current player's turn (1 or 2)
        round_number: Current round number (0, 1, or 2)
        deck: Remaining cards in deck as JSON
        player1_hand: Player 1's hand cards as JSON
        player2_hand: Player 2's hand cards as JSON
        table_cards: Cards on the table as JSON
        builds: Active builds as JSON
        player1_captured: Player 1's captured cards as JSON
        player2_captured: Player 2's captured cards as JSON
        player1_score: Player 1's current score
        player2_score: Player 2's current score
        shuffle_complete: Whether deck has been shuffled
        card_selection_complete: Whether initial cards selected
        dealing_complete: Whether dealing is complete
        game_started: Whether game has started
        game_completed: Whether game has finished
        last_play: Last action played as JSON
        last_action: Type of last action
        last_update: Last state update timestamp
        winner: Winning player (1, 2, or None for tie)
        player1_ready: Player 1 ready status
        player2_ready: Player 2 ready status
        players: Related Player objects
    """
    __tablename__ = "rooms"
    
    # Primary key
    id: Mapped[str] = mapped_column(String(6), primary_key=True, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Room status
    status: Mapped[str] = mapped_column(String(20), default="waiting")
    game_phase: Mapped[str] = mapped_column(String(20), default="waiting")
    current_turn: Mapped[int] = mapped_column(Integer, default=1)
    round_number: Mapped[int] = mapped_column(Integer, default=0)
    
    # Game state as JSON (using dict type hint)
    deck: Mapped[list] = mapped_column(JSON, default=list)
    player1_hand: Mapped[list] = mapped_column(JSON, default=list)
    player2_hand: Mapped[list] = mapped_column(JSON, default=list)
    table_cards: Mapped[list] = mapped_column(JSON, default=list)
    builds: Mapped[list] = mapped_column(JSON, default=list)
    player1_captured: Mapped[list] = mapped_column(JSON, default=list)
    player2_captured: Mapped[list] = mapped_column(JSON, default=list)
    
    # Scores
    player1_score: Mapped[int] = mapped_column(Integer, default=0)
    player2_score: Mapped[int] = mapped_column(Integer, default=0)
    
    # Game flags
    shuffle_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    card_selection_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    dealing_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    game_started: Mapped[bool] = mapped_column(Boolean, default=False)
    game_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Last play information
    last_play: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    last_action: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_update: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Winner
    winner: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Player ready status
    player1_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    player2_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Version tracking for state synchronization
    version: Mapped[int] = mapped_column(Integer, default=0, index=True)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    last_modified: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    modified_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Relationships
    players: Mapped[List["Player"]] = relationship(
        "Player",
        back_populates="room",
        foreign_keys="[Player.room_id]",
        cascade="all, delete-orphan"
    )
    sessions: Mapped[List["GameSession"]] = relationship(
        "GameSession",
        cascade="all, delete-orphan"
    )
    action_logs: Mapped[List["GameActionLog"]] = relationship(
        "GameActionLog",
        cascade="all, delete-orphan"
    )
    events: Mapped[List["GameEvent"]] = relationship(
        "GameEvent",
        cascade="all, delete-orphan"
    )
    snapshots: Mapped[List["StateSnapshot"]] = relationship(
        "StateSnapshot",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Room(id={self.id}, phase={self.game_phase}, status={self.status})>"


class Player(Base):
    """
    Player model representing a user in a game room.
    
    Players are associated with a specific room and have a unique name within that room.
    The model tracks ready status and connection information for session management.
    
    Attributes:
        id: Auto-incrementing player ID (primary key)
        room_id: Foreign key to Room
        name: Player display name (max 50 characters)
        ready: Whether player is ready to start
        joined_at: When player joined the room
        ip_address: Player's IP address (supports IPv6, max 45 chars)
        room: Related Room object
    """
    __tablename__ = "players"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("rooms.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    ready: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    
    # Relationship
    room: Mapped["Room"] = relationship(
        "Room",
        back_populates="players",
        foreign_keys=[room_id]
    )
    
    def __repr__(self) -> str:
        return f"<Player(id={self.id}, name={self.name}, room_id={self.room_id})>"


class GameSession(Base):
    """
    Game session model for tracking player connections and enabling reconnection.
    
    Sessions maintain connection state and heartbeat information to support automatic
    reconnection after temporary disconnections. Each session has a unique token that
    clients use to restore their game state.
    
    Attributes:
        id: UUID session identifier (primary key)
        room_id: Foreign key to Room
        player_id: Foreign key to Player
        session_token: Unique session token for reconnection (max 256 chars, indexed)
        connected_at: Initial connection timestamp
        last_heartbeat: Last heartbeat received timestamp
        disconnected_at: Disconnection timestamp (None if connected)
        reconnected_at: Last reconnection timestamp
        is_active: Whether session is active
        connection_count: Number of times connected
        ip_address: Client IP address
        user_agent: Client user agent string (max 256 chars)
    """
    __tablename__ = "game_sessions"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    room_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("rooms.id", ondelete="CASCADE")
    )
    player_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="CASCADE")
    )
    session_token: Mapped[Optional[str]] = mapped_column(
        String(256),
        unique=True,
        index=True,
        nullable=True
    )
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    last_heartbeat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    disconnected_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    reconnected_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    connection_count: Mapped[int] = mapped_column(Integer, default=0)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    
    def __repr__(self) -> str:
        return f"<GameSession(id={self.id}, room_id={self.room_id}, active={self.is_active})>"


class GameActionLog(Base):
    """
    Game action log model for audit trail and replay functionality.
    
    Logs all game actions with sequence numbers to enable action replay, state recovery,
    and deduplication. Each action has a unique ID to prevent duplicate processing.
    
    Attributes:
        id: Auto-incrementing log entry ID (primary key)
        room_id: Foreign key to Room (indexed)
        player_id: Foreign key to Player who performed action
        action_type: Type of action (capture, build, trail, ready, shuffle)
        action_data: Action details as JSON
        timestamp: When action occurred
        sequence_number: Sequential action number within room
        action_id: Unique action identifier for deduplication (indexed)
    """
    __tablename__ = "game_action_log"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        index=True
    )
    player_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="CASCADE")
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    action_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True
    )
    
    def __repr__(self) -> str:
        return f"<GameActionLog(id={self.id}, room_id={self.room_id}, type={self.action_type})>"


class GameEvent(Base):
    """
    Game event model for event sourcing and state synchronization.
    
    Stores all game state changes as immutable events with sequence numbers and versions.
    Enables event replay, state reconstruction, and conflict resolution. This is the
    foundation for the state synchronization system.
    
    Attributes:
        id: Auto-incrementing event ID (primary key)
        room_id: Foreign key to Room (indexed)
        sequence_number: Sequential event number within room (unique per room)
        version: State version after this event was applied
        player_id: Foreign key to Player who triggered the event (nullable)
        action_type: Type of action (capture, build, trail, ready, shuffle, etc.)
        action_data: Event details and state changes as JSON
        timestamp: When event occurred (server timestamp)
        checksum: SHA-256 hash of the event data for integrity verification
    """
    __tablename__ = "game_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        index=True
    )
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    player_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=True
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    def __repr__(self) -> str:
        return f"<GameEvent(id={self.id}, room_id={self.room_id}, seq={self.sequence_number}, version={self.version})>"


class StateSnapshot(Base):
    """
    State snapshot model for optimized event replay.
    
    Stores periodic snapshots of complete game state to optimize event replay performance.
    Instead of replaying all events from the beginning, the system can start from the
    most recent snapshot and replay only subsequent events.
    
    Attributes:
        id: Auto-incrementing snapshot ID (primary key)
        room_id: Foreign key to Room (indexed)
        version: State version at the time of snapshot
        state_data: Complete game state as JSON
        checksum: SHA-256 hash of the state for integrity verification
        created_at: When snapshot was created
    """
    __tablename__ = "state_snapshots"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    state_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<StateSnapshot(id={self.id}, room_id={self.room_id}, version={self.version})>"

# Social Features Models

class User(Base):
    """
    User model for social features authentication and profiles.
    
    Represents a registered user with persistent identity across game sessions.
    Stores authentication credentials, profile information, and privacy settings.
    
    Attributes:
        id: Auto-incrementing user ID (primary key)
        username: Unique username (max 50 characters, indexed)
        email: Unique email address (max 255 characters, indexed)
        password_hash: Bcrypt hashed password (max 255 characters)
        display_name: Optional display name (max 100 characters)
        bio: Optional user biography (text)
        avatar_url: Optional avatar image URL (max 500 characters)
        is_verified: Whether email is verified
        privacy_settings: Privacy preferences as JSON
        created_at: Account creation timestamp
        updated_at: Last profile update timestamp
        last_seen: Last activity timestamp
        is_active: Whether account is active (not banned/suspended)
    """
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    privacy_settings: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    last_seen: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    sent_friend_requests: Mapped[List["Friendship"]] = relationship(
        "Friendship",
        foreign_keys="[Friendship.user1_id]",
        back_populates="requester",
        cascade="all, delete-orphan"
    )
    received_friend_requests: Mapped[List["Friendship"]] = relationship(
        "Friendship",
        foreign_keys="[Friendship.user2_id]",
        back_populates="recipient",
        cascade="all, delete-orphan"
    )
    statistics: Mapped[Optional["UserStatistics"]] = relationship(
        "UserStatistics",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )
    reported_by: Mapped[List["ModerationReport"]] = relationship(
        "ModerationReport",
        foreign_keys="[ModerationReport.reporter_id]",
        back_populates="reporter",
        cascade="all, delete-orphan"
    )
    reports_against: Mapped[List["ModerationReport"]] = relationship(
        "ModerationReport",
        foreign_keys="[ModerationReport.reported_user_id]",
        back_populates="reported_user",
        cascade="all, delete-orphan"
    )
    blocked_users: Mapped[List["UserBlock"]] = relationship(
        "UserBlock",
        foreign_keys="[UserBlock.blocker_id]",
        back_populates="blocker",
        cascade="all, delete-orphan"
    )
    blocked_by: Mapped[List["UserBlock"]] = relationship(
        "UserBlock",
        foreign_keys="[UserBlock.blocked_id]",
        back_populates="blocked",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"


class Friendship(Base):
    """
    Friendship model for managing friend relationships.
    
    Represents bidirectional friendship relationships between users.
    Tracks friendship status (pending, accepted, declined, blocked).
    
    Attributes:
        id: Auto-incrementing friendship ID (primary key)
        user1_id: Foreign key to User who sent the request
        user2_id: Foreign key to User who received the request
        status: Friendship status (pending, accepted, declined, blocked)
        created_at: Friend request timestamp
        accepted_at: Friendship acceptance timestamp (nullable)
        updated_at: Last status update timestamp
    """
    __tablename__ = "friendships"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user1_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    user2_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    requester: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user1_id],
        back_populates="sent_friend_requests"
    )
    recipient: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user2_id],
        back_populates="received_friend_requests"
    )
    
    def __repr__(self) -> str:
        return f"<Friendship(id={self.id}, user1_id={self.user1_id}, user2_id={self.user2_id}, status={self.status})>"


class UserStatistics(Base):
    """
    User statistics model for tracking game performance.
    
    Stores aggregated statistics for each user's game performance.
    Updated automatically after each completed game.
    
    Attributes:
        user_id: Foreign key to User (primary key)
        games_played: Total number of games played
        games_won: Total number of games won
        total_score: Cumulative score across all games
        best_game_score: Highest score achieved in a single game
        current_streak: Current winning streak
        longest_streak: Longest winning streak achieved
        last_game_at: Timestamp of last game played
        updated_at: Last statistics update timestamp
    """
    __tablename__ = "user_statistics"
    
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    games_won: Mapped[int] = mapped_column(Integer, default=0)
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    best_game_score: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_game_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="statistics"
    )
    
    def __repr__(self) -> str:
        return f"<UserStatistics(user_id={self.user_id}, games_played={self.games_played}, games_won={self.games_won})>"


class ModerationReport(Base):
    """
    Moderation report model for user reporting system.
    
    Stores reports of inappropriate behavior or content.
    Used for automated and manual moderation processes.
    
    Attributes:
        id: Auto-incrementing report ID (primary key)
        reporter_id: Foreign key to User who made the report (nullable)
        reported_user_id: Foreign key to User being reported
        report_type: Type of report (harassment, spam, inappropriate_content)
        description: Optional description of the issue
        status: Report status (pending, reviewed, resolved)
        created_at: Report creation timestamp
        resolved_at: Report resolution timestamp (nullable)
        resolved_by: Foreign key to User who resolved the report (nullable)
        resolution_notes: Optional notes about the resolution
    """
    __tablename__ = "moderation_reports"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reporter_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    reported_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    resolved_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    reporter: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reporter_id],
        back_populates="reported_by"
    )
    reported_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[reported_user_id],
        back_populates="reports_against"
    )
    resolver: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[resolved_by]
    )
    
    def __repr__(self) -> str:
        return f"<ModerationReport(id={self.id}, type={self.report_type}, status={self.status})>"


class UserBlock(Base):
    """
    User block model for blocking unwanted interactions.
    
    Represents one user blocking another to prevent communication.
    Blocks are unidirectional - user A can block user B without B blocking A.
    
    Attributes:
        id: Auto-incrementing block ID (primary key)
        blocker_id: Foreign key to User who is doing the blocking
        blocked_id: Foreign key to User who is being blocked
        created_at: Block creation timestamp
        reason: Optional reason for the block
    """
    __tablename__ = "user_blocks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    blocker_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    blocked_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    blocker: Mapped["User"] = relationship(
        "User",
        foreign_keys=[blocker_id],
        back_populates="blocked_users"
    )
    blocked: Mapped["User"] = relationship(
        "User",
        foreign_keys=[blocked_id],
        back_populates="blocked_by"
    )
    
    def __repr__(self) -> str:
        return f"<UserBlock(id={self.id}, blocker_id={self.blocker_id}, blocked_id={self.blocked_id})>"