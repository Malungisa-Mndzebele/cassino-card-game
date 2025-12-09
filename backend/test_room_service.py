"""
Unit tests for RoomService

Tests the room management service layer including:
- Room creation with valid inputs
- Room joining with valid inputs
- Room state retrieval with caching
- Error cases (invalid names, full rooms, room not found)
"""

import pytest
from sqlalchemy.orm import Session
from unittest.mock import Mock, MagicMock, patch

from services.room_service import RoomService
from models import Room, Player
from schemas import CreateRoomRequest, JoinRoomRequest


class TestRoomServiceInit:
    """Test RoomService initialization"""
    
    def test_initialization(self):
        """Test RoomService initializes with dependencies"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        
        service = RoomService(db, cache_manager, game_logic)
        
        assert service.db == db
        assert service.cache_manager == cache_manager
        assert service.game_logic == game_logic


class TestCreateRoom:
    """Test room creation functionality"""
    
    def test_create_room_success(self):
        """Test successful room creation"""
        # Setup
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = CreateRoomRequest(player_name="Alice")
        
        # Mock database operations
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        
        # Execute
        result = service.create_room(request)
        
        # Verify
        assert result["room_id"] is not None
        assert len(result["room_id"]) == 6
        assert result["player_id"] == 1
        assert result["player_name"] == "Alice"
        assert result["status"] == "waiting"
        
        # Verify database operations
        db.add.assert_called()
        db.commit.assert_called()
        db.refresh.assert_called()
    
    def test_create_room_with_empty_name(self):
        """Test room creation with empty player name"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = CreateRoomRequest(player_name="")
        
        with pytest.raises(ValueError, match="Player name cannot be empty"):
            service.create_room(request)
    
    def test_create_room_with_whitespace_name(self):
        """Test room creation with whitespace-only player name"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = CreateRoomRequest(player_name="   ")
        
        with pytest.raises(ValueError, match="Player name cannot be empty"):
            service.create_room(request)
    
    def test_create_room_generates_unique_id(self):
        """Test that room IDs are unique"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        
        request1 = CreateRoomRequest(player_name="Alice")
        request2 = CreateRoomRequest(player_name="Bob")
        
        result1 = service.create_room(request1)
        result2 = service.create_room(request2)
        
        assert result1["room_id"] != result2["room_id"]


class TestJoinRoom:
    """Test room joining functionality"""
    
    def test_join_room_success(self):
        """Test successful room joining"""
        # Setup
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_id="ABC123", player_name="Bob")
        
        # Mock existing room
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "waiting"
        mock_room.players = [Mock(spec=Player)]  # One player already
        
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=mock_room)
            ))
        ))
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        
        # Execute
        result = service.join_room(request)
        
        # Verify
        assert result["room_id"] == "ABC123"
        assert result["player_id"] == 2
        assert result["player_name"] == "Bob"
        assert result["status"] == "waiting"
        
        db.add.assert_called()
        db.commit.assert_called()
    
    def test_join_room_not_found(self):
        """Test joining non-existent room"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_id="NOTFOUND", player_name="Bob")
        
        # Mock room not found
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=None)
            ))
        ))
        
        with pytest.raises(ValueError, match="Room NOTFOUND not found"):
            service.join_room(request)
    
    def test_join_room_already_full(self):
        """Test joining a full room"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_id="ABC123", player_name="Charlie")
        
        # Mock full room (2 players)
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "waiting"
        mock_room.players = [Mock(spec=Player), Mock(spec=Player)]
        
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=mock_room)
            ))
        ))
        
        with pytest.raises(ValueError, match="Room ABC123 is full"):
            service.join_room(request)
    
    def test_join_room_already_playing(self):
        """Test joining a room that's already playing"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_id="ABC123", player_name="Bob")
        
        # Mock room already playing
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "playing"
        mock_room.players = [Mock(spec=Player)]
        
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=mock_room)
            ))
        ))
        
        with pytest.raises(ValueError, match="Room ABC123 is already playing"):
            service.join_room(request)
    
    def test_join_room_with_empty_name(self):
        """Test joining room with empty player name"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_id="ABC123", player_name="")
        
        with pytest.raises(ValueError, match="Player name cannot be empty"):
            service.join_room(request)


class TestGetRoomState:
    """Test room state retrieval functionality"""
    
    def test_get_room_state_from_cache(self):
        """Test retrieving room state from cache"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        # Mock cached state
        cached_state = {
            "room_id": "ABC123",
            "status": "playing",
            "game_phase": "round1"
        }
        cache_manager.get_game_state = Mock(return_value=cached_state)
        
        # Execute
        result = service.get_room_state("ABC123")
        
        # Verify
        assert result == cached_state
        cache_manager.get_game_state.assert_called_once_with("ABC123")
        db.query.assert_not_called()  # Should not hit database
    
    def test_get_room_state_from_database(self):
        """Test retrieving room state from database when cache misses"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        # Mock cache miss
        cache_manager.get_game_state = Mock(return_value=None)
        
        # Mock database room
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "playing"
        mock_room.game_phase = "round1"
        mock_room.current_turn = 1
        mock_room.round_number = 1
        mock_room.deck = []
        mock_room.player1_hand = []
        mock_room.player2_hand = []
        mock_room.table_cards = []
        mock_room.builds = []
        mock_room.player1_captured = []
        mock_room.player2_captured = []
        mock_room.player1_score = 0
        mock_room.player2_score = 0
        mock_room.last_capture_player = None
        mock_room.version = 1
        
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=mock_room)
            ))
        ))
        
        cache_manager.cache_game_state = Mock()
        
        # Execute
        result = service.get_room_state("ABC123")
        
        # Verify
        assert result["room_id"] == "ABC123"
        assert result["status"] == "playing"
        assert result["game_phase"] == "round1"
        
        # Verify cache was updated
        cache_manager.cache_game_state.assert_called_once()
    
    def test_get_room_state_not_found(self):
        """Test retrieving state for non-existent room"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        # Mock cache miss
        cache_manager.get_game_state = Mock(return_value=None)
        
        # Mock room not found
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=None)
            ))
        ))
        
        with pytest.raises(ValueError, match="Room NOTFOUND not found"):
            service.get_room_state("NOTFOUND")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
