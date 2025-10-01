"""
Simple unit tests for Casino Card Game API endpoints (no pytest required)
Tests all API endpoints: room creation, joining, player ready, game start, and card play
"""

import sys
import os
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add the backend directory to the path so we can import main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import Base, get_db
from models import Room, Player

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override database dependency for tests"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

class TestCasinoAPI:
    """Test suite for Casino game API endpoints"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        self.client = TestClient(app)
        self.room_id = None
        self.player1_id = None
        self.player2_id = None
    
    def teardown_method(self):
        """Clean up after each test"""
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "message" in data
    
    def test_create_room(self):
        """Test room creation"""
        response = self.client.post("/rooms/create", json={
            "player_name": "test_player1",
            "ip_address": "127.0.0.1"
        })
        assert response.status_code == 200
        data = response.json()
        assert "room_id" in data
        assert "player_id" in data
        assert "game_state" in data
        
        # Save for other tests
        self.room_id = data["room_id"]
        self.player1_id = data["player_id"]
    
    def test_join_room(self):
        """Test joining a room"""
        # First create a room
        self.test_create_room()
        
        # Then join it
        response = self.client.post("/rooms/join", json={
            "room_id": self.room_id,
            "player_name": "test_player2",
            "ip_address": "127.0.0.2"
        })
        assert response.status_code == 200
        data = response.json()
        assert "player_id" in data
        assert "game_state" in data
        
        # Save player2 ID
        self.player2_id = data["player_id"]
    
    def test_get_game_state(self):
        """Test getting game state"""
        # First create a room and join it
        self.test_join_room()
        
        # Then get state
        response = self.client.get(f"/rooms/{self.room_id}/state")
        assert response.status_code == 200
        data = response.json()
        assert data["room_id"] == self.room_id
        assert len(data["players"]) == 2
    
    def test_set_player_ready(self):
        """Test setting player ready status"""
        # First create a room and join it
        self.test_join_room()
        
        # Set player1 ready
        response = self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "is_ready": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["player1_ready"] == True
        
        # Set player2 ready
        response = self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player2_id,
            "is_ready": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["player2_ready"] == True
        assert data["game_state"]["phase"] == "dealer"  # Should auto-transition
    
    def test_start_shuffle(self):
        """Test starting shuffle phase"""
        # First get both players ready
        self.test_set_player_ready()
        
        # Start shuffle
        response = self.client.post("/game/start-shuffle", json={
            "room_id": self.room_id,
            "player_id": self.player1_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["shuffle_complete"] == True
    
    def test_select_face_up_cards(self):
        """Test selecting face-up cards and starting game"""
        # First complete shuffle
        self.test_start_shuffle()
        
        # Select face-up cards (start game)
        response = self.client.post("/game/select-face-up-cards", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_ids": []
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["game_started"] == True
        assert data["game_state"]["phase"] == "round1"
        assert data["game_state"]["current_turn"] == 1
        
        # Verify cards were dealt
        assert len(data["game_state"]["table_cards"]) == 4
        assert len(data["game_state"]["player1_hand"]) == 4
        assert len(data["game_state"]["player2_hand"]) == 4
    
    def test_play_card_trail(self):
        """Test playing a card (trail action)"""
        # First start the game
        self.test_select_face_up_cards()
        
        # Get game state to find a card to play
        response = self.client.get(f"/rooms/{self.room_id}/state")
        data = response.json()
        player1_card = data["player1_hand"][0]
        
        # Play the card (trail)
        response = self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_id": player1_card["id"],
            "action": "trail",
            "target_cards": [],
            "build_value": None
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["current_turn"] == 2  # Turn should switch
        
        # Verify card was moved to table
        assert any(card["id"] == player1_card["id"] for card in data["game_state"]["table_cards"])
        assert not any(card["id"] == player1_card["id"] for card in data["game_state"]["player1_hand"])
    
    def test_reset_game(self):
        """Test resetting the game"""
        # First play a card
        self.test_play_card_trail()
        
        # Reset game
        response = self.client.post("/game/reset", params={"room_id": self.room_id})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify game was reset
        game_state = data["game_state"]
        assert game_state["phase"] == "waiting"
        assert game_state["current_turn"] == 1
        assert game_state["round"] == 0  # Using "round" instead of "round_number"
        assert len(game_state["deck"]) == 0
        assert len(game_state["player1_hand"]) == 0
        assert len(game_state["player2_hand"]) == 0
        assert len(game_state["table_cards"]) == 0
        assert len(game_state["builds"]) == 0
        assert game_state["player1_ready"] == False
        assert game_state["player2_ready"] == False