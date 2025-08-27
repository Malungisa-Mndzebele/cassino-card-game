from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Room(Base):
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
    __tablename__ = "game_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String(6), ForeignKey("rooms.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    last_heartbeat = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
