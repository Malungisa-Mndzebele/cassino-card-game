"""
Unit tests for PlayerService

Tests player ready status, player retrieval, and player lifecycle.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from services.player_service import PlayerService
from services.game_service import VersionConflictError


class TestPlayerServiceGetSortedPlayers:
    """Tests for get_sorted_players method."""
    
    def test_get_sorted_players_returns_sorted_by_join_time(self):
        """Test players are sorted by join time."""
        mock_db = AsyncMock()
        service = PlayerService(db=mock_db)
        
        player1 = MagicMock()
        player1.id = 1
        player1.joined_at = datetime(2024, 1, 1, 10, 0, 0)
        
        player2 = MagicMock()
        player2.id = 2
        player2.joined_at = datetime(2024, 1, 1, 10, 1, 0)
        
        room = MagicMock()
        room.players = [player2, player1]  # Out of order
        
        result = service.get_sorted_players(room)
        
        assert result[0].id == 1  # Player 1 joined first
        assert result[1].id == 2
    
    def test_get_sorted_players_empty_room(self):
        """Test empty room returns empty list."""
        mock_db = AsyncMock()
        service = PlayerService(db=mock_db)
        
        room = MagicMock()
        room.players = []
        
        result = service.get_sorted_players(room)
        
        assert result == []
    
    def test_get_sorted_players_none_players(self):
        """Test None players returns empty list."""
        mock_db = AsyncMock()
        service = PlayerService(db=mock_db)
        
        room = MagicMock()
        room.players = None
        
        result = service.get_sorted_players(room)
        
        assert result == []


class TestPlayerServiceGetPlayer:
    """Tests for get_player method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        return db
    
    @pytest.mark.asyncio
    async def test_get_player_found(self, mock_db):
        """Test get_player returns player when found."""
        mock_player = MagicMock()
        mock_player.id = 1
        mock_player.room_id = "ABC123"
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_player
        mock_db.execute.return_value = mock_result
        
        service = PlayerService(db=mock_db)
        result = await service.get_player("ABC123", 1)
        
        assert result == mock_player
    
    @pytest.mark.asyncio
    async def test_get_player_not_found(self, mock_db):
        """Test get_player returns None when not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        service = PlayerService(db=mock_db)
        result = await service.get_player("ABC123", 999)
        
        assert result is None


class TestPlayerServiceSetPlayerReady:
    """Tests for set_player_ready method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        db.commit = AsyncMock()
        return db
    
    @pytest.fixture
    def mock_room_with_players(self):
        """Create mock room with two players."""
        room = MagicMock()
        room.id = "ABC123"
        room.game_phase = "waiting"
        room.player1_ready = False
        room.player2_ready = False
        room.version = 0
        
        player1 = MagicMock()
        player1.id = 1
        player1.ready = False
        player1.joined_at = datetime(2024, 1, 1, 10, 0, 0)
        
        player2 = MagicMock()
        player2.id = 2
        player2.ready = False
        player2.joined_at = datetime(2024, 1, 1, 10, 1, 0)
        
        room.players = [player1, player2]
        return room, player1, player2
    
    @pytest.mark.asyncio
    async def test_set_player1_ready(self, mock_db, mock_room_with_players):
        """Test setting player 1 ready status."""
        room, player1, player2 = mock_room_with_players
        service = PlayerService(db=mock_db)
        
        result_room, phase_changed = await service.set_player_ready(
            room=room,
            player=player1,
            is_ready=True
        )
        
        assert player1.ready is True
        assert result_room.player1_ready is True
        assert result_room.player2_ready is False
        assert phase_changed is False  # Only one player ready
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_set_player2_ready(self, mock_db, mock_room_with_players):
        """Test setting player 2 ready status."""
        room, player1, player2 = mock_room_with_players
        service = PlayerService(db=mock_db)
        
        result_room, phase_changed = await service.set_player_ready(
            room=room,
            player=player2,
            is_ready=True
        )
        
        assert player2.ready is True
        assert result_room.player2_ready is True
        assert phase_changed is False
    
    @pytest.mark.asyncio
    async def test_both_players_ready_transitions_phase(self, mock_db, mock_room_with_players):
        """Test phase transitions to dealer when both players ready."""
        room, player1, player2 = mock_room_with_players
        room.player1_ready = True  # Player 1 already ready
        service = PlayerService(db=mock_db)
        
        result_room, phase_changed = await service.set_player_ready(
            room=room,
            player=player2,
            is_ready=True
        )
        
        assert result_room.game_phase == "dealer"
        assert phase_changed is True
    
    @pytest.mark.asyncio
    async def test_version_conflict_raises_error(self, mock_db, mock_room_with_players):
        """Test version conflict raises VersionConflictError."""
        room, player1, player2 = mock_room_with_players
        room.version = 5
        service = PlayerService(db=mock_db)
        
        with pytest.raises(VersionConflictError) as exc_info:
            await service.set_player_ready(
                room=room,
                player=player1,
                is_ready=True,
                client_version=3  # Outdated version
            )
        
        assert exc_info.value.client_version == 3
        assert exc_info.value.server_version == 5
    
    @pytest.mark.asyncio
    async def test_version_incremented(self, mock_db, mock_room_with_players):
        """Test version is incremented after update."""
        room, player1, player2 = mock_room_with_players
        initial_version = room.version
        service = PlayerService(db=mock_db)
        
        result_room, _ = await service.set_player_ready(
            room=room,
            player=player1,
            is_ready=True
        )
        
        assert result_room.version > initial_version


class TestPlayerServiceRemovePlayer:
    """Tests for remove_player_from_room method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        db.commit = AsyncMock()
        db.delete = AsyncMock()
        return db
    
    @pytest.fixture
    def mock_room_with_game(self):
        """Create mock room with active game."""
        room = MagicMock()
        room.id = "ABC123"
        room.game_phase = "round1"
        room.game_started = True
        room.game_completed = False
        room.player1_ready = True
        room.player2_ready = True
        room.version = 5
        
        player1 = MagicMock()
        player1.id = 1
        player1.joined_at = datetime(2024, 1, 1, 10, 0, 0)
        
        player2 = MagicMock()
        player2.id = 2
        player2.joined_at = datetime(2024, 1, 1, 10, 1, 0)
        
        room.players = [player1, player2]
        return room, player1, player2
    
    @pytest.mark.asyncio
    async def test_remove_player_deletes_player(self, mock_db, mock_room_with_game):
        """Test player is deleted from database."""
        room, player1, player2 = mock_room_with_game
        service = PlayerService(db=mock_db)
        
        await service.remove_player_from_room(room, player1)
        
        mock_db.delete.assert_called_once_with(player1)
    
    @pytest.mark.asyncio
    async def test_remove_player1_resets_ready_status(self, mock_db, mock_room_with_game):
        """Test removing player 1 resets player1_ready."""
        room, player1, player2 = mock_room_with_game
        service = PlayerService(db=mock_db)
        
        result = await service.remove_player_from_room(room, player1)
        
        assert result.player1_ready is False
    
    @pytest.mark.asyncio
    async def test_remove_player_resets_game_if_started(self, mock_db, mock_room_with_game):
        """Test removing player resets game if in progress."""
        room, player1, player2 = mock_room_with_game
        service = PlayerService(db=mock_db)
        
        result = await service.remove_player_from_room(room, player1)
        
        assert result.game_phase == "waiting"
        assert result.game_started is False
        assert result.game_completed is False


class TestPlayerServiceGetPlayerCount:
    """Tests for get_player_count method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        return db
    
    @pytest.mark.asyncio
    async def test_get_player_count_returns_count(self, mock_db):
        """Test get_player_count returns correct count."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 2
        mock_db.execute.return_value = mock_result
        
        service = PlayerService(db=mock_db)
        result = await service.get_player_count("ABC123")
        
        assert result == 2
    
    @pytest.mark.asyncio
    async def test_get_player_count_empty_room(self, mock_db):
        """Test get_player_count returns 0 for empty room."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = None
        mock_db.execute.return_value = mock_result
        
        service = PlayerService(db=mock_db)
        result = await service.get_player_count("ABC123")
        
        assert result == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
