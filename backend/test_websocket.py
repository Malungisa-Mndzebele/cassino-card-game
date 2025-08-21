#!/usr/bin/env python3
"""
WebSocket tests for the Casino Card Game FastAPI backend
Tests real-time communication functionality
"""

import pytest
import asyncio
import json
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db, Base
from models import Room, Player

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

class TestWebSocket:
    """Test WebSocket functionality"""
    
    def test_websocket_connection(self):
        """Test basic WebSocket connection"""
        with client.websocket_connect("/ws/TEST123") as websocket:
            # Connection should be established
            assert websocket is not None
    
    def test_websocket_message_send_receive(self):
        """Test sending and receiving messages via WebSocket"""
        with client.websocket_connect("/ws/TEST123") as websocket:
            # Send a test message
            test_message = {"type": "test", "data": "hello"}
            websocket.send_text(json.dumps(test_message))
            
            # Should receive the same message back (echo functionality)
            response = websocket.receive_text()
            received_data = json.loads(response)
            
            assert received_data["type"] == "test"
            assert received_data["data"] == "hello"
    
    def test_websocket_room_broadcast(self):
        """Test broadcasting messages to all clients in a room"""
        # Connect two clients to the same room
        with client.websocket_connect("/ws/TEST123") as websocket1:
            with client.websocket_connect("/ws/TEST123") as websocket2:
                # Send message from first client
                message = {"type": "game_action", "action": "play_card"}
                websocket1.send_text(json.dumps(message))
                
                # Second client should receive the message
                response = websocket2.receive_text()
                received_data = json.loads(response)
                
                assert received_data["type"] == "game_action"
                assert received_data["action"] == "play_card"
    
    def test_websocket_disconnect(self):
        """Test WebSocket disconnection handling"""
        with client.websocket_connect("/ws/TEST123") as websocket:
            # Connection should be active
            assert websocket is not None
            
            # Close the connection
            websocket.close()
            
            # Should not be able to send messages after closing
            with pytest.raises(Exception):
                websocket.send_text("test")
    
    def test_websocket_invalid_json(self):
        """Test handling of invalid JSON messages"""
        with client.websocket_connect("/ws/TEST123") as websocket:
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should handle gracefully (no crash)
            # The exact behavior depends on implementation
            pass
    
    def test_websocket_large_message(self):
        """Test handling of large messages"""
        with client.websocket_connect("/ws/TEST123") as websocket:
            # Send a large message
            large_message = {"type": "large_data", "data": "x" * 10000}
            websocket.send_text(json.dumps(large_message))
            
            # Should handle without issues
            response = websocket.receive_text()
            received_data = json.loads(response)
            
            assert received_data["type"] == "large_data"
    
    def test_websocket_multiple_rooms(self):
        """Test WebSocket connections to different rooms"""
        with client.websocket_connect("/ws/ROOM1") as websocket1:
            with client.websocket_connect("/ws/ROOM2") as websocket2:
                # Send message to room 1
                message1 = {"type": "room1_message"}
                websocket1.send_text(json.dumps(message1))
                
                # Send message to room 2
                message2 = {"type": "room2_message"}
                websocket2.send_text(json.dumps(message2))
                
                # Each client should only receive messages from their room
                response1 = websocket1.receive_text()
                response2 = websocket2.receive_text()
                
                data1 = json.loads(response1)
                data2 = json.loads(response2)
                
                assert data1["type"] == "room1_message"
                assert data2["type"] == "room2_message"
    
    def test_websocket_connection_manager(self):
        """Test connection manager functionality"""
        # Test that connections are properly tracked
        with client.websocket_connect("/ws/TEST123") as websocket1:
            with client.websocket_connect("/ws/TEST123") as websocket2:
                # Both connections should be active
                assert websocket1 is not None
                assert websocket2 is not None
                
                # Send message from first client
                websocket1.send_text(json.dumps({"type": "test"}))
                
                # Both clients should receive the message
                response1 = websocket1.receive_text()
                response2 = websocket2.receive_text()
                
                assert response1 == response2

class TestWebSocketIntegration:
    """Test WebSocket integration with game logic"""
    
    def test_websocket_game_state_updates(self):
        """Test that game state updates are broadcast via WebSocket"""
        # First create a room via HTTP
        create_response = client.post("/rooms/create", json={"player_name": "TestPlayer"})
        room_data = create_response.json()
        room_id = room_data["room_id"]
        
        # Connect to the room via WebSocket
        with client.websocket_connect(f"/ws/{room_id}") as websocket:
            # Send a game action
            game_action = {
                "type": "game_action",
                "action": "set_ready",
                "player_id": room_data["player_id"],
                "is_ready": True
            }
            websocket.send_text(json.dumps(game_action))
            
            # Should receive game state update
            response = websocket.receive_text()
            update_data = json.loads(response)
            
            # Verify the update contains game state information
            assert "game_state" in update_data or "type" in update_data
    
    def test_websocket_player_join_notification(self):
        """Test that player join events are broadcast"""
        # Create a room
        create_response = client.post("/rooms/create", json={"player_name": "Host"})
        room_id = create_response.json()["room_id"]
        
        # Connect to the room
        with client.websocket_connect(f"/ws/{room_id}") as websocket:
            # Join the room via HTTP
            join_response = client.post("/rooms/join", json={
                "room_id": room_id,
                "player_name": "Joiner"
            })
            
            # Should receive notification about new player
            response = websocket.receive_text()
            notification = json.loads(response)
            
            # Verify it's a player join notification
            assert "type" in notification
            assert notification["type"] in ["player_joined", "game_state_update"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
