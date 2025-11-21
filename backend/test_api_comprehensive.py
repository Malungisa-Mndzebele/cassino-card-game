"""
Comprehensive API tests covering all endpoints and edge cases
Tests authentication, validation, error handling, and business logic
"""

import sys
import os
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import Base, get_db
from models import Room, Player

# Create in-memory async SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)
TestingAsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def override_get_db():
    """Override database dependency for tests with async session"""
    async with TestingAsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="class", autouse=True)
async def setup_database_for_class():
    """Set up database tables once for the test class"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup after class
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

class TestComprehensiveAPI:
    """Comprehensive test suite for all API endpoints"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        self.client = TestClient(app)
        self.room_id = None
        self.player1_id = None
        self.player2_id = None
    
    # ==========================================
    # HEALTH AND ROOT ENDPOINTS
    # ==========================================
    
    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = self.client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_health_endpoint_detailed(self):
        """Test health endpoint with database status"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "database" in data
        assert data["database"] in ["connected", "disconnected"]
    
    def test_cors_preflight(self):
        """Test CORS preflight requests"""
        response = self.client.options("/rooms/create")
        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
    
    # ==========================================
    # ROOM MANAGEMENT TESTS
    # ==========================================
    
    def test_create_room_comprehensive(self):
        """Test room creation with all parameters"""
        response = self.client.post("/rooms/create", json={
            "player_name": "TestPlayer1",
            "ip_address": "192.168.1.100"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "room_id" in data
        assert "player_id" in data
        assert "game_state" in data
        
        # Verify room ID format (6 characters)
        assert len(data["room_id"]) == 6
        assert data["room_id"].isalnum()
        
        # Verify game state initialization
        game_state = data["game_state"]
        assert game_state["phase"] == "waiting"
        assert game_state["round"] == 0
        assert len(game_state["players"]) == 1
        assert game_state["players"][0]["name"] == "TestPlayer1"
        assert game_state["player1_ready"] == False
        assert game_state["player2_ready"] == False
        
        self.room_id = data["room_id"]
        self.player1_id = data["player_id"]
    
    def test_create_room_without_ip(self):
        """Test room creation without IP address"""
        response = self.client.post("/rooms/create", json={
            "player_name": "TestPlayer1"
        })
        assert response.status_code == 200
        # Should work with IP detection
    
    def test_create_room_empty_name(self):
        """Test room creation with empty player name"""
        response = self.client.post("/rooms/create", json={
            "player_name": "",
            "ip_address": "127.0.0.1"
        })
        # Should still work - validation happens on frontend
        assert response.status_code == 200
    
    def test_join_room_comprehensive(self):
        """Test joining room with all scenarios"""
        # First create a room
        self.test_create_room_comprehensive()
        
        # Join with second player
        response = self.client.post("/rooms/join", json={
            "room_id": self.room_id,
            "player_name": "TestPlayer2",
            "ip_address": "192.168.1.101"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "player_id" in data
        assert "game_state" in data
        
        # Verify game state has both players
        game_state = data["game_state"]
        assert len(game_state["players"]) == 2
        assert game_state["players"][1]["name"] == "TestPlayer2"
        
        self.player2_id = data["player_id"]
    
    def test_join_nonexistent_room(self):
        """Test joining room that doesn't exist"""
        response = self.client.post("/rooms/join", json={
            "room_id": "NOROOM",
            "player_name": "TestPlayer",
            "ip_address": "127.0.0.1"
        })
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_join_full_room(self):
        """Test joining room that's already full"""
        # Create room and add two players
        self.test_join_room_comprehensive()
        
        # Try to add third player
        response = self.client.post("/rooms/join", json={
            "room_id": self.room_id,
            "player_name": "TestPlayer3",
            "ip_address": "127.0.0.1"
        })
        assert response.status_code == 400
        assert "full" in response.json()["detail"].lower()
    
    def test_join_duplicate_name(self):
        """Test joining room with duplicate player name"""
        self.test_create_room_comprehensive()
        
        response = self.client.post("/rooms/join", json={
            "room_id": self.room_id,
            "player_name": "TestPlayer1",  # Same name as creator
            "ip_address": "127.0.0.1"
        })
        assert response.status_code == 400
        assert "taken" in response.json()["detail"].lower()
    
    def test_join_random_room_empty(self):
        """Test joining random room when no rooms exist"""
        response = self.client.post("/rooms/join-random", json={
            "player_name": "RandomPlayer"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should create new room
        assert "player_id" in data
        assert "game_state" in data
        assert len(data["game_state"]["players"]) == 1
    
    def test_join_random_room_existing(self):
        """Test joining random room when rooms exist"""
        # Create a room with one player
        self.test_create_room_comprehensive()
        
        # Join random should find this room
        response = self.client.post("/rooms/join-random", json={
            "player_name": "RandomPlayer"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should join existing room
        assert data["game_state"]["room_id"] == self.room_id
        assert len(data["game_state"]["players"]) == 2
    
    # ==========================================
    # GAME STATE TESTS
    # ==========================================
    
    def test_get_game_state_comprehensive(self):
        """Test getting game state with all fields"""
        self.test_join_room_comprehensive()
        
        response = self.client.get(f"/rooms/{self.room_id}/state")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields
        required_fields = [
            "room_id", "players", "phase", "round", "deck",
            "player1_hand", "player2_hand", "table_cards", "builds",
            "player1_captured", "player2_captured", "player1_score", "player2_score",
            "current_turn", "card_selection_complete", "shuffle_complete",
            "game_started", "last_play", "last_action", "last_update",
            "game_completed", "winner", "dealing_complete",
            "player1_ready", "player2_ready"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data["players"], list)
        assert isinstance(data["deck"], list)
        assert isinstance(data["player1_hand"], list)
        assert isinstance(data["player2_hand"], list)
        assert isinstance(data["table_cards"], list)
        assert isinstance(data["builds"], list)
        assert isinstance(data["player1_score"], int)
        assert isinstance(data["player2_score"], int)
        assert isinstance(data["current_turn"], int)
        assert isinstance(data["player1_ready"], bool)
        assert isinstance(data["player2_ready"], bool)
    
    def test_get_game_state_nonexistent(self):
        """Test getting state for nonexistent room"""
        response = self.client.get("/rooms/NOROOM/state")
        assert response.status_code == 404
    
    # ==========================================
    # PLAYER READY TESTS
    # ==========================================
    
    def test_set_player_ready_comprehensive(self):
        """Test setting player ready with all scenarios"""
        self.test_join_room_comprehensive()
        
        # Set player 1 ready
        response = self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "is_ready": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["player1_ready"] == True
        assert data["game_state"]["phase"] == "waiting"  # Still waiting for player 2
        
        # Set player 2 ready
        response = self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player2_id,
            "is_ready": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["player2_ready"] == True
        assert data["game_state"]["phase"] == "dealer"  # Auto-transition
        
        # Set player ready to false
        
        response = self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": 99999,
            "is_ready": True
        })
        assert response.status_code == 404
    
    def test_set_ready_invalid_room(self):
        """Test setting ready for invalid room"""
        response = self.client.post("/rooms/player-ready", json={
            "room_id": "NOROOM",
            "player_id": 1,
            "is_ready": True
        })
        assert response.status_code == 404
    
    # ==========================================
    # GAME FLOW TESTS
    # ==========================================
    
    def test_complete_game_flow(self):
        """Test complete game flow from start to finish"""
        # 1. Create room and join players
        self.test_join_room_comprehensive()
        
        # 2. Set both players ready
        self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "is_ready": True
        })
        self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player2_id,
            "is_ready": True
        })
        
        # 3. Start shuffle
        response = self.client.post("/game/start-shuffle", json={
            "room_id": self.room_id,
            "player_id": self.player1_id
        })
        assert response.status_code == 200
        assert response.json()["game_state"]["shuffle_complete"] == True
        
        # 4. Select face-up cards (start game)
        response = self.client.post("/game/select-face-up-cards", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_ids": []
        })
        assert response.status_code == 200
        game_state = response.json()["game_state"]
        assert game_state["phase"] == "round1"
        assert game_state["game_started"] == True
        assert len(game_state["player1_hand"]) == 4
        assert len(game_state["player2_hand"]) == 4
        assert len(game_state["table_cards"]) == 4
        
        # 5. Play cards
        player1_card = game_state["player1_hand"][0]
        response = self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_id": player1_card["id"],
            "action": "trail",
            "target_cards": [],
            "build_value": None
        })
        assert response.status_code == 200
        assert response.json()["game_state"]["current_turn"] == 2
        
        # 6. Reset game
        response = self.client.post("/game/reset", params={"room_id": self.room_id})
        assert response.status_code == 200
        reset_state = response.json()["game_state"]
        assert reset_state["phase"] == "waiting"
        assert reset_state["game_started"] == False
        assert len(reset_state["player1_hand"]) == 0
    
    def test_invalid_card_play_scenarios(self):
        """Test all invalid card play scenarios"""
        # Setup game
        self.test_complete_game_flow()
        
        # Start game again
        self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id, "player_id": self.player1_id, "is_ready": True
        })
        self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id, "player_id": self.player2_id, "is_ready": True
        })
        self.client.post("/game/start-shuffle", json={
            "room_id": self.room_id, "player_id": self.player1_id
        })
        response = self.client.post("/game/select-face-up-cards", json={
            "room_id": self.room_id, "player_id": self.player1_id, "card_ids": []
        })
        game_state = response.json()["game_state"]
        
        # Test wrong turn
        player2_card = game_state["player2_hand"][0]
        response = self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": self.player2_id,  # Player 2 tries to play on player 1's turn
            "card_id": player2_card["id"],
            "action": "trail"
        })
        assert response.status_code == 400
        assert "turn" in response.json()["detail"].lower()
        
        # Test invalid card ID
        response = self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_id": "INVALID_CARD",
            "action": "trail"
        })
        assert response.status_code == 400
        
        # Test invalid action
        player1_card = game_state["player1_hand"][0]
        response = self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_id": player1_card["id"],
            "action": "invalid_action"
        })
        assert response.status_code == 400
    
    def test_build_validation_comprehensive(self):
        """Test comprehensive build validation"""
        # Setup game with known cards for testing
        self.test_complete_game_flow()
        
        # Start game
        self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id, "player_id": self.player1_id, "is_ready": True
        })
        self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id, "player_id": self.player2_id, "is_ready": True
        })
        self.client.post("/game/start-shuffle", json={
            "room_id": self.room_id, "player_id": self.player1_id
        })
        response = self.client.post("/game/select-face-up-cards", json={
            "room_id": self.room_id, "player_id": self.player1_id, "card_ids": []
        })
        game_state = response.json()["game_state"]
        
        # Test invalid build (same value as hand card)
        hand_card = game_state["player1_hand"][0]
        response = self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "card_id": hand_card["id"],
            "action": "build",
            "target_cards": [],
            "build_value": hand_card["value"]  # Same as hand card value
        })
        assert response.status_code == 400

    # ==========================================
    # WEBSOCKET TESTS
    # ==========================================
    
    def test_websocket_connection(self):
        """Test WebSocket connection and messaging"""
        self.test_create_room_comprehensive()
        
        with self.client.websocket_connect(f"/ws/{self.room_id}") as websocket:
            # Receive initial connection status
            initial = websocket.receive_text()
            assert "connection_status" in initial

            # Send test message
            test_message = json.dumps({"type": "test", "data": "hello"})
            websocket.send_text(test_message)
            
            # Should receive the same message back (broadcast)
            received = websocket.receive_text()
            assert received == test_message
    
    def test_websocket_invalid_room(self):
        """Test WebSocket connection to invalid room"""
        # Should still connect but to empty room
        with self.client.websocket_connect("/ws/INVALID") as websocket:
            # Receive initial connection status
            initial = websocket.receive_text()
            
            websocket.send_text("test")
            received = websocket.receive_text()
            assert received == "test"
    
    # ==========================================
    # ERROR HANDLING TESTS
    # ==========================================
    
    def test_malformed_requests(self):
        """Test handling of malformed requests"""
        # Missing required fields
        response = self.client.post("/rooms/create", json={})
        assert response.status_code == 422  # Validation error
        
        # Invalid JSON
        response = self.client.post("/rooms/create", 
                                  data="invalid json",
                                  headers={"Content-Type": "application/json"})
        assert response.status_code == 422
        
        # Wrong content type
        response = self.client.post("/rooms/create", data="player_name=test")
        assert response.status_code == 422
    
    def test_sql_injection_protection(self):
        """Test protection against SQL injection"""
        # Try SQL injection in room ID
        response = self.client.get("/rooms/'; DROP TABLE rooms; --/state")
        assert response.status_code == 404  # Should not crash
        
        # Try SQL injection in player name
        response = self.client.post("/rooms/create", json={
            "player_name": "'; DROP TABLE players; --"
        })
        assert response.status_code == 200  # Should work but be escaped
    
    def test_rate_limiting_simulation(self):
        """Test rapid requests (simulating rate limiting scenarios)"""
        # Make many rapid requests
        for i in range(10):
            response = self.client.post("/rooms/create", json={
                "player_name": f"Player{i}"
            })
            # Should all succeed (no rate limiting implemented yet)
            assert response.status_code == 200
    
    # ==========================================
    # PERFORMANCE TESTS
    # ==========================================
    
    @pytest.mark.skip(reason="SQLite in-memory database does not support concurrent writes well")
    def test_concurrent_room_creation(self):
        """Test creating multiple rooms concurrently"""
        import threading
        import time
        
        results = []
        
        def create_room(player_name):
            response = self.client.post("/rooms/create", json={
                "player_name": player_name
            })
            results.append(response.status_code)
        
        # Create 5 rooms concurrently
        threads = []
        for i in range(5):
            thread = threading.Thread(target=create_room, args=[f"Player{i}"])
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        # All should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 5
    
    def test_large_game_state(self):
        """Test handling of large game states"""
        self.test_complete_game_flow()
        
        # Get game state multiple times
        for i in range(10):
            response = self.client.get(f"/rooms/{self.room_id}/state")
            assert response.status_code == 200
            # Response should be consistent
            assert "room_id" in response.json()