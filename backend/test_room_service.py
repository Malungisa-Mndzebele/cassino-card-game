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
        db.flush = Mock()
        db.refresh = Mock()
        
        # Execute
        room, player = service.create_room(request, player_ip="127.0.0.1", user_agent="test-agent")
        
        # Verify
        assert room.id is not None
        assert len(room.id) == 6
        assert room.status == "waiting"
        assert player.player_number == 1
        assert player.name == "Alice"
        assert player.ip_address == "127.0.0.1"
        assert player.user_agent == "test-agent"
        
        # Verify database operations
        db.add.assert_called()
        db.commit.assert_called()
        db.refresh.assert_called()
    
    def test_create_room_with_empty_name(self):
        """Test room creation with empty player name - caught by Pydantic"""
        from pydantic import ValidationError
        
        # Pydantic validation catches this before service layer
        with pytest.raises(ValidationError):
            request = CreateRoomRequest(player_name="")
    
    def test_create_room_with_whitespace_name(self):
        """Test room creation with whitespace-only player name - caught by Pydantic"""
        from pydantic import ValidationError
        
        # Pydantic validation catches this before service layer
        with pytest.raises(ValidationError):
            request = CreateRoomRequest(player_name="   ")
    
    def test_create_room_generates_unique_id(self):
        """Test that room IDs are unique"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        db.add = Mock()
        db.commit = Mock()
        db.flush = Mock()
        db.refresh = Mock()
        
        request1 = CreateRoomRequest(player_name="Alice")
        request2 = CreateRoomRequest(player_name="Bob")
        
        room1, player1 = service.create_room(request1, player_ip="127.0.0.1", user_agent="test-agent")
        room2, player2 = service.create_room(request2, player_ip="127.0.0.1", user_agent="test-agent")
        
        assert room1.id != room2.id


class TestJoinRoom:
    """Test room joining functionality"""
    
    def test_join_room_success(self):
        """Test successful room joining"""
        # Setup
        db = Mock(spec=Session)
        cache_manager = Mock()
        cache_manager.invalidate_game_state = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_code="ABC123", player_name="Bob")
        
        # Mock existing room
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "waiting"
        mock_room.game_started = False
        
        # Mock query chain for room lookup
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first = Mock(return_value=mock_room)
        mock_query.filter = Mock(return_value=mock_filter)
        
        # Mock query chain for player count (returns 1 player)
        mock_count_query = Mock()
        mock_count_filter = Mock()
        mock_count_filter.count = Mock(return_value=1)
        mock_count_query.filter = Mock(return_value=mock_count_filter)
        
        # db.query returns different mocks based on model
        def query_side_effect(model):
            if model == Room:
                return mock_query
            elif model == Player:
                return mock_count_query
        
        db.query = Mock(side_effect=query_side_effect)
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        
        # Execute
        room, player = service.join_room(request, player_ip="127.0.0.1", user_agent="test-agent")
        
        # Verify
        assert room.id == "ABC123"
        assert player.player_number == 2
        assert player.name == "Bob"
        assert player.ip_address == "127.0.0.1"
        
        db.add.assert_called()
        db.commit.assert_called()
        cache_manager.invalidate_game_state.assert_called_once_with("ABC123")
    
    def test_join_room_not_found(self):
        """Test joining non-existent room"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_code="NOTFND", player_name="Bob")
        
        # Mock room not found
        db.query = Mock(return_value=Mock(
            filter=Mock(return_value=Mock(
                first=Mock(return_value=None)
            ))
        ))
        
        with pytest.raises(ValueError, match="Room NOTFND not found"):
            service.join_room(request, player_ip="127.0.0.1", user_agent="test-agent")
    
    def test_join_room_already_full(self):
        """Test joining a full room"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_code="ABC123", player_name="Charlie")
        
        # Mock full room (2 players)
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "waiting"
        mock_room.game_started = False
        
        # Mock query chain for room lookup
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first = Mock(return_value=mock_room)
        mock_query.filter = Mock(return_value=mock_filter)
        
        # Mock query chain for player count (returns 2 players - full)
        mock_count_query = Mock()
        mock_count_filter = Mock()
        mock_count_filter.count = Mock(return_value=2)
        mock_count_query.filter = Mock(return_value=mock_count_filter)
        
        # db.query returns different mocks based on model
        def query_side_effect(model):
            if model == Room:
                return mock_query
            elif model == Player:
                return mock_count_query
        
        db.query = Mock(side_effect=query_side_effect)
        
        with pytest.raises(ValueError, match="Room is full"):
            service.join_room(request, player_ip="127.0.0.1", user_agent="test-agent")
    
    def test_join_room_already_playing(self):
        """Test joining a room that's already playing"""
        db = Mock(spec=Session)
        cache_manager = Mock()
        game_logic = Mock()
        service = RoomService(db, cache_manager, game_logic)
        
        request = JoinRoomRequest(room_code="ABC123", player_name="Bob")
        
        # Mock room already playing
        mock_room = Mock(spec=Room)
        mock_room.id = "ABC123"
        mock_room.status = "playing"
        mock_room.game_started = True
        
        # Mock query chain for room lookup
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first = Mock(return_value=mock_room)
        mock_query.filter = Mock(return_value=mock_filter)
        
        # Mock query chain for player count (returns 1 player)
        mock_count_query = Mock()
        mock_count_filter = Mock()
        mock_count_filter.count = Mock(return_value=1)
        mock_count_query.filter = Mock(return_value=mock_count_filter)
        
        # db.query returns different mocks based on model
        def query_side_effect(model):
            if model == Room:
                return mock_query
            elif model == Player:
                return mock_count_query
        
        db.query = Mock(side_effect=query_side_effect)
        
        with pytest.raises(ValueError, match="Game already in progress"):
            service.join_room(request, player_ip="127.0.0.1", user_agent="test-agent")
    
    def test_join_room_with_empty_name(self):
        """Test joining room with empty player name - caught by Pydantic"""
        from pydantic import ValidationError
        
        # Pydantic validation catches this before service layer
        with pytest.raises(ValidationError):
            request = JoinRoomRequest(room_code="ABC123", player_name="")


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
        
        # Verify - result is the Room object itself
        assert result.id == "ABC123"
        assert result.status == "playing"
        assert result.game_phase == "round1"
        
        # Verify cache was updated
        cache_manager.cache_game_state.assert_called_once_with("ABC123", mock_room)
    
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
        
        # Execute - get_room_state returns None when room not found
        result = service.get_room_state("NOTFOUND")
        
        # Verify
        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
