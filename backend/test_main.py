#!/usr/bin/env python3
"""
Unit tests for the Casino Card Game FastAPI backend
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import json
from datetime import datetime

from main import app
from database import get_db, Base
from models import Room, Player
from schemas import CreateRoomRequest, JoinRoomRequest

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test that health endpoint returns 200"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "Casino Card Game Backend is running" in data["message"]

class TestRoomCreation:
    """Test room creation functionality"""
    
    def test_create_room_success(self):
        """Test successful room creation"""
        data = {"player_name": "TestPlayer"}
        response = client.post("/rooms/create", json=data)
        
        assert response.status_code == 200
        data = response.json()
        assert "room_id" in data
        assert "player_id" in data
        assert "game_state" in data
        assert len(data["room_id"]) == 6  # 6-character room ID
        assert data["game_state"]["phase"] == "waiting"
        assert len(data["game_state"]["players"]) == 1
        assert data["game_state"]["players"][0]["name"] == "TestPlayer"
    
    def test_create_room_missing_player_name(self):
        """Test room creation with missing player name"""
        response = client.post("/rooms/create", json={})
        assert response.status_code == 422  # Validation error
    
    def test_create_room_empty_player_name(self):
        """Test room creation with empty player name"""
        response = client.post("/rooms/create", json={"player_name": ""})
        assert response.status_code == 422  # Validation error

class TestRoomJoining:
    """Test room joining functionality"""
    
    def test_join_room_success(self):
        """Test successful room joining"""
        # First create a room
        create_data = {"player_name": "HostPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_id = create_response.json()["room_id"]
        
        # Then join the room
        join_data = {"room_id": room_id, "player_name": "JoinerPlayer"}
        response = client.post("/rooms/join", json=join_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "player_id" in data
        assert "game_state" in data
        assert len(data["game_state"]["players"]) == 2
        assert data["game_state"]["players"][1]["name"] == "JoinerPlayer"
    
    def test_join_nonexistent_room(self):
        """Test joining a room that doesn't exist"""
        data = {"room_id": "INVALID", "player_name": "TestPlayer"}
        response = client.post("/rooms/join", json=data)
        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]
    
    def test_join_full_room(self):
        """Test joining a room that's already full"""
        # Create a room
        create_data = {"player_name": "Player1"}
        create_response = client.post("/rooms/create", json=create_data)
        room_id = create_response.json()["room_id"]
        
        # Join with second player
        join_data = {"room_id": room_id, "player_name": "Player2"}
        client.post("/rooms/join", json=join_data)
        
        # Try to join with third player
        join_data = {"room_id": room_id, "player_name": "Player3"}
        response = client.post("/rooms/join", json=join_data)
        assert response.status_code == 400
        assert "Room is full" in response.json()["detail"]
    
    def test_join_with_duplicate_name(self):
        """Test joining with a name that already exists in the room"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_id = create_response.json()["room_id"]
        
        # Try to join with same name
        join_data = {"room_id": room_id, "player_name": "TestPlayer"}
        response = client.post("/rooms/join", json=join_data)
        assert response.status_code == 400
        assert "Player name already taken" in response.json()["detail"]

class TestGameState:
    """Test game state retrieval"""
    
    def test_get_game_state_success(self):
        """Test successful game state retrieval"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_id = create_response.json()["room_id"]
        
        # Get game state
        response = client.get(f"/rooms/{room_id}/state")
        assert response.status_code == 200
        data = response.json()
        assert "game_state" in data
        assert data["game_state"]["roomId"] == room_id
    
    def test_get_nonexistent_game_state(self):
        """Test getting game state for non-existent room"""
        response = client.get("/rooms/INVALID/state")
        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]

class TestPlayerReady:
    """Test player ready functionality"""
    
    def test_set_player_ready_success(self):
        """Test successful player ready setting"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_data = create_response.json()
        room_id = room_data["room_id"]
        player_id = room_data["player_id"]
        
        # Set player ready
        ready_data = {"room_id": room_id, "player_id": player_id, "is_ready": True}
        response = client.post("/rooms/player-ready", json=ready_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "Player ready status updated" in data["message"]
    
    def test_set_player_ready_nonexistent_room(self):
        """Test setting ready for non-existent room"""
        data = {"room_id": "INVALID", "player_id": 1, "is_ready": True}
        response = client.post("/rooms/player-ready", json=data)
        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]
    
    def test_set_player_ready_nonexistent_player(self):
        """Test setting ready for non-existent player"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_id = create_response.json()["room_id"]
        
        # Try to set ready for non-existent player
        data = {"room_id": room_id, "player_id": 999, "is_ready": True}
        response = client.post("/rooms/player-ready", json=data)
        assert response.status_code == 404
        assert "Player not found" in response.json()["detail"]

class TestGameActions:
    """Test game action endpoints"""
    
    def test_start_shuffle_success(self):
        """Test successful shuffle start"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_data = create_response.json()
        room_id = room_data["room_id"]
        player_id = room_data["player_id"]
        
        # Start shuffle
        shuffle_data = {"room_id": room_id, "player_id": player_id}
        response = client.post("/game/start-shuffle", json=shuffle_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["shuffle_complete"] == True
    
    def test_play_card_success(self):
        """Test successful card play"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_data = create_response.json()
        room_id = room_data["room_id"]
        player_id = room_data["player_id"]
        
        # Play a card
        card_data = {
            "room_id": room_id,
            "player_id": player_id,
            "card_id": "A_hearts",
            "action": "trail"
        }
        response = client.post("/game/play-card", json=card_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "Card played successfully" in data["message"]
    
    def test_reset_game_success(self):
        """Test successful game reset"""
        # Create a room
        create_data = {"player_name": "TestPlayer"}
        create_response = client.post("/rooms/create", json=create_data)
        room_id = create_response.json()["room_id"]
        
        # Reset game
        response = client.post(f"/game/reset", json={"room_id": room_id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "Game reset successfully" in data["message"]

class TestCORS:
    """Test CORS functionality"""
    
    def test_cors_preflight(self):
        """Test CORS preflight request"""
        response = client.options("/rooms/create")
        assert response.status_code == 200
        headers = response.headers
        assert "access-control-allow-origin" in headers
        assert "access-control-allow-methods" in headers
        assert "access-control-allow-headers" in headers

class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_json(self):
        """Test handling of invalid JSON"""
        response = client.post("/rooms/create", data="invalid json")
        assert response.status_code == 422
    
    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        response = client.post("/rooms/create", json={"wrong_field": "value"})
        assert response.status_code == 422

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
