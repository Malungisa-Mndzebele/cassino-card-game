"""
Simple unit tests for Casino Card Game API endpoints
Tests all API endpoints: room creation, joining, player ready, game start, and card play
"""

import sys
import os
import json
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Add the backend directory to the path so we can import main
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

@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    """Set up database tables before each test"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
class TestCasinoAPI:
    """Test suite for Casino game API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_test(self, client):
        """Set up test instance with client"""
        self.client = client
        self.room_id = None
        self.player1_id = None
        self.player2_id = None
    
    async def test_health_check(self):
        """Test health check endpoint"""
        response = await self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        assert "redis" in data
    
    async def test_create_room(self):
        """Test room creation"""
        response = await self.client.post("/rooms/create", json={
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
    
    async def test_join_room(self):
        """Test joining a room"""
        # First create a room
        await self.test_create_room()
        
        # Then join it
        response = await self.client.post("/rooms/join", json={
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
    
    async def test_get_game_state(self):
        """Test getting game state"""
        # First create a room and join it
        await self.test_join_room()
        
        # Then get state
        response = await self.client.get(f"/rooms/{self.room_id}/state")
        assert response.status_code == 200
        data = response.json()
        assert data["room_id"] == self.room_id
        assert len(data["players"]) == 2
    
    async def test_set_player_ready(self):
        """Test setting player ready status"""
        # First create a room and join it
        await self.test_join_room()
        
        # Set player1 ready
        response = await self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player1_id,
            "is_ready": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["player1_ready"] == True
        
        # Set player2 ready
        response = await self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": self.player2_id,
            "is_ready": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["player2_ready"] == True
        assert data["game_state"]["phase"] == "dealer"  # Should auto-transition
    
    async def test_start_shuffle(self):
        """Test starting shuffle phase"""
        # First get both players ready
        await self.test_set_player_ready()
        
        # Start shuffle
        response = await self.client.post("/game/start-shuffle", json={
            "room_id": self.room_id,
            "player_id": self.player1_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["game_state"]["shuffle_complete"] == True
    
    async def test_select_face_up_cards(self):
        """Test selecting face-up cards and starting game"""
        # First complete shuffle
        await self.test_start_shuffle()
        
        # Select face-up cards (start game)
        response = await self.client.post("/game/select-face-up-cards", json={
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
    
    async def test_play_card_trail(self):
        """Test playing a card (trail action)"""
        # First start the game
        await self.test_select_face_up_cards()
        
        # Get game state to find a card to play
        response = await self.client.get(f"/rooms/{self.room_id}/state")
        data = response.json()
        player1_card = data["player1_hand"][0]
        
        # Play the card (trail)
        response = await self.client.post("/game/play-card", json={
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
    
    async def test_reset_game(self):
        """Test resetting the game"""
        # First play a card
        await self.test_play_card_trail()
        
        # Reset game
        response = await self.client.post("/game/reset", params={"room_id": self.room_id})
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

    async def test_join_nonexistent_room(self):
        response = await self.client.post("/rooms/join", json={
            "room_id": "ZZZZZZ",
            "player_name": "ghost",
            "ip_address": "127.0.0.9"
        })
        assert response.status_code == 404

    async def test_join_room_full(self):
        # Create room and add two players
        await self.test_join_room()
        # Try to add third player
        response = await self.client.post("/rooms/join", json={
            "room_id": self.room_id,
            "player_name": "third",
            "ip_address": "127.0.0.3"
        })
        assert response.status_code == 400

    async def test_set_ready_invalid_player(self):
        await self.test_join_room()
        response = await self.client.post("/rooms/player-ready", json={
            "room_id": self.room_id,
            "player_id": 999999,
            "is_ready": True
        })
        assert response.status_code == 404

    async def test_play_wrong_turn(self):
        # start game to round1
        await self.test_select_face_up_cards()
        # Get state
        response = await self.client.get(f"/rooms/{self.room_id}/state")
        state = response.json()
        p1 = state["players"][0]["id"]
        p2 = state["players"][1]["id"]
        # Player 2 tries to play first
        card = state["player2_hand"][0]
        response = await self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": p2,
            "card_id": card["id"],
            "action": "trail",
            "target_cards": [],
            "build_value": None
        })
        assert response.status_code == 400

    async def test_play_invalid_action(self):
        await self.test_select_face_up_cards()
        response = await self.client.get(f"/rooms/{self.room_id}/state")
        state = response.json()
        p1 = state["players"][0]["id"]
        card = state["player1_hand"][0]
        response = await self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": p1,
            "card_id": card["id"],
            "action": "invalid_action",
            "target_cards": [],
            "build_value": None
        })
        assert response.status_code == 400

    async def test_build_invalid_same_value(self):
        await self.test_select_face_up_cards()
        response = await self.client.get(f"/rooms/{self.room_id}/state")
        state = response.json()
        p1 = state["players"][0]["id"]
        card = state["player1_hand"][0]
        # Attempt to build with build_value equal to hand card (logic rejects)
        response = await self.client.post("/game/play-card", json={
            "room_id": self.room_id,
            "player_id": p1,
            "card_id": card["id"],
            "action": "build",
            "target_cards": [],
            "build_value": 14 if card["rank"] == "A" else (13 if card["rank"] == "K" else (12 if card["rank"] == "Q" else (11 if card["rank"] == "J" else int(card["rank"])) ) )
        })
        assert response.status_code == 400

    async def test_websocket_broadcast(self):
        # Create room → join second player to open ws on a room id
        await self.test_join_room()
        async with self.client.websocket_connect(f"/ws/{self.room_id}") as websocket:
            test_msg = "state_update_test"
            await websocket.send_text(test_msg)
            received = await websocket.receive_text()
            assert received == test_msg
