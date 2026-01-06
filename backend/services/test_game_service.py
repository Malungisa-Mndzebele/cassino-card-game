"""
Unit tests for GameService

Tests game actions (capture, build, trail), game flow, and state management.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from services.game_service import GameService, VersionConflictError
from game_logic import GameCard, Build


class TestGameServiceCardConversion:
    """Tests for card conversion utilities."""
    
    def test_convert_game_cards_to_dict(self):
        """Test converting GameCard objects to dictionaries."""
        cards = [
            GameCard(id="5_hearts", suit="hearts", rank="5", value=5),
            GameCard(id="A_spades", suit="spades", rank="A", value=14)
        ]
        
        result = GameService.convert_game_cards_to_dict(cards)
        
        assert len(result) == 2
        assert result[0] == {"id": "5_hearts", "suit": "hearts", "rank": "5", "value": 5}
        assert result[1] == {"id": "A_spades", "suit": "spades", "rank": "A", "value": 14}
    
    def test_convert_dict_to_game_cards(self):
        """Test converting dictionaries to GameCard objects."""
        cards_dict = [
            {"id": "5_hearts", "suit": "hearts", "rank": "5", "value": 5},
            {"id": "A_spades", "suit": "spades", "rank": "A", "value": 14}
        ]
        
        result = GameService.convert_dict_to_game_cards(cards_dict)
        
        assert len(result) == 2
        assert result[0].id == "5_hearts"
        assert result[0].suit == "hearts"
        assert result[1].rank == "A"
        assert result[1].value == 14
    
    def test_convert_builds_to_dict(self):
        """Test converting Build objects to dictionaries."""
        cards = [GameCard(id="3_hearts", suit="hearts", rank="3", value=3)]
        builds = [Build(id="build_1", cards=cards, value=8, owner=1)]
        
        result = GameService.convert_builds_to_dict(builds)
        
        assert len(result) == 1
        assert result[0]["id"] == "build_1"
        assert result[0]["value"] == 8
        assert result[0]["owner"] == 1
        assert len(result[0]["cards"]) == 1
    
    def test_convert_dict_to_builds(self):
        """Test converting dictionaries to Build objects."""
        builds_dict = [{
            "id": "build_1",
            "cards": [{"id": "3_hearts", "suit": "hearts", "rank": "3", "value": 3}],
            "value": 8,
            "owner": 1
        }]
        
        result = GameService.convert_dict_to_builds(builds_dict)
        
        assert len(result) == 1
        assert result[0].id == "build_1"
        assert result[0].value == 8
        assert len(result[0].cards) == 1


class TestGameServiceStartShuffle:
    """Tests for start_shuffle method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        db.commit = AsyncMock()
        return db
    
    @pytest.fixture
    def mock_room(self):
        """Create mock room object."""
        room = MagicMock()
        room.id = "ABC123"
        room.game_phase = "waiting"
        room.shuffle_complete = False
        room.version = 0
        room.players = []
        return room
    
    @pytest.mark.asyncio
    async def test_start_shuffle_updates_room_state(self, mock_db, mock_room):
        """Test that start_shuffle updates room state correctly."""
        service = GameService(db=mock_db)
        
        result = await service.start_shuffle(mock_room, player_id=1)
        
        assert result.shuffle_complete is True
        assert result.game_phase == "dealer"
        assert result.version == 1
        assert result.modified_by == 1
        mock_db.commit.assert_called_once()


class TestGameServiceSelectFaceUpCards:
    """Tests for select_face_up_cards method."""
    
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
        room.game_phase = "dealer"
        room.version = 0
        
        player1 = MagicMock()
        player1.id = 1
        player1.joined_at = datetime(2024, 1, 1, 10, 0, 0)
        
        player2 = MagicMock()
        player2.id = 2
        player2.joined_at = datetime(2024, 1, 1, 10, 1, 0)
        
        room.players = [player1, player2]
        return room
    
    @pytest.mark.asyncio
    async def test_select_face_up_cards_deals_cards(self, mock_db, mock_room_with_players):
        """Test that select_face_up_cards deals cards correctly."""
        service = GameService(db=mock_db)
        
        result = await service.select_face_up_cards(mock_room_with_players, player_id=1)
        
        assert result.card_selection_complete is True
        assert result.game_phase == "round1"
        assert result.game_started is True
        assert result.round_number == 1
        assert result.dealing_complete is True
        assert result.deck is not None
        assert result.table_cards is not None
        assert result.player1_hand is not None
        assert result.player2_hand is not None
    
    @pytest.mark.asyncio
    async def test_select_face_up_cards_rejects_player2(self, mock_db, mock_room_with_players):
        """Test that only player 1 can select face-up cards."""
        service = GameService(db=mock_db)
        
        with pytest.raises(ValueError, match="Only Player 1 can select face-up cards"):
            await service.select_face_up_cards(mock_room_with_players, player_id=2)


class TestGameServiceStartGame:
    """Tests for start_game method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        db.commit = AsyncMock()
        return db
    
    @pytest.fixture
    def mock_room_dealer_phase(self):
        """Create mock room in dealer phase."""
        room = MagicMock()
        room.id = "ABC123"
        room.game_phase = "dealer"
        room.version = 0
        
        player1 = MagicMock()
        player1.id = 1
        player1.joined_at = datetime(2024, 1, 1, 10, 0, 0)
        
        player2 = MagicMock()
        player2.id = 2
        player2.joined_at = datetime(2024, 1, 1, 10, 1, 0)
        
        room.players = [player1, player2]
        return room
    
    @pytest.mark.asyncio
    async def test_start_game_transitions_to_round1(self, mock_db, mock_room_dealer_phase):
        """Test that start_game transitions game to round1."""
        service = GameService(db=mock_db)
        
        result = await service.start_game(mock_room_dealer_phase, player_id=1)
        
        assert result.game_phase == "round1"
        assert result.game_started is True
        assert result.shuffle_complete is True
        assert result.card_selection_complete is True
    
    @pytest.mark.asyncio
    async def test_start_game_rejects_wrong_phase(self, mock_db, mock_room_dealer_phase):
        """Test that start_game rejects if not in dealer phase."""
        mock_room_dealer_phase.game_phase = "waiting"
        service = GameService(db=mock_db)
        
        with pytest.raises(ValueError, match="Game must be in dealer phase"):
            await service.start_game(mock_room_dealer_phase, player_id=1)
    
    @pytest.mark.asyncio
    async def test_start_game_rejects_unknown_player(self, mock_db, mock_room_dealer_phase):
        """Test that start_game rejects player not in room."""
        service = GameService(db=mock_db)
        
        with pytest.raises(ValueError, match="Player not in room"):
            await service.start_game(mock_room_dealer_phase, player_id=999)


class TestGameServicePlayCard:
    """Tests for play_card method."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock async database session."""
        db = AsyncMock()
        db.commit = AsyncMock()
        return db
    
    @pytest.fixture
    def mock_action_logger(self):
        """Create mock action logger."""
        logger = AsyncMock()
        logger.log_game_action = AsyncMock(return_value="action_123")
        return logger
    
    @pytest.fixture
    def mock_room_in_game(self):
        """Create mock room with active game."""
        room = MagicMock()
        room.id = "ABC123"
        room.game_phase = "round1"
        room.current_turn = 1
        room.round_number = 1
        room.version = 5
        
        player1 = MagicMock()
        player1.id = 1
        player1.joined_at = datetime(2024, 1, 1, 10, 0, 0)
        
        player2 = MagicMock()
        player2.id = 2
        player2.joined_at = datetime(2024, 1, 1, 10, 1, 0)
        
        room.players = [player1, player2]
        
        # Set up hands and table
        room.player1_hand = [
            {"id": "5_hearts", "suit": "hearts", "rank": "5", "value": 5},
            {"id": "3_clubs", "suit": "clubs", "rank": "3", "value": 3}
        ]
        room.player2_hand = [
            {"id": "7_diamonds", "suit": "diamonds", "rank": "7", "value": 7}
        ]
        room.table_cards = [
            {"id": "2_spades", "suit": "spades", "rank": "2", "value": 2}
        ]
        room.builds = []
        room.player1_captured = []
        room.player2_captured = []
        room.deck = []
        
        return room
    
    @pytest.mark.asyncio
    async def test_play_card_trail_action(self, mock_db, mock_action_logger, mock_room_in_game):
        """Test trail action places card on table."""
        service = GameService(db=mock_db, action_logger=mock_action_logger)
        
        result, action_id = await service.play_card(
            room=mock_room_in_game,
            player_id=1,
            card_id="5_hearts",
            action="trail"
        )
        
        assert action_id == "action_123"
        assert result.current_turn == 2  # Turn switched
        mock_action_logger.log_game_action.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_play_card_rejects_wrong_turn(self, mock_db, mock_action_logger, mock_room_in_game):
        """Test that play_card rejects if not player's turn."""
        service = GameService(db=mock_db, action_logger=mock_action_logger)
        
        with pytest.raises(ValueError, match="Not your turn"):
            await service.play_card(
                room=mock_room_in_game,
                player_id=2,  # Player 2 but it's player 1's turn
                card_id="7_diamonds",
                action="trail"
            )
    
    @pytest.mark.asyncio
    async def test_play_card_rejects_card_not_in_hand(self, mock_db, mock_action_logger, mock_room_in_game):
        """Test that play_card rejects card not in player's hand."""
        service = GameService(db=mock_db, action_logger=mock_action_logger)
        
        with pytest.raises(ValueError, match="Card not found in player's hand"):
            await service.play_card(
                room=mock_room_in_game,
                player_id=1,
                card_id="nonexistent_card",
                action="trail"
            )
    
    @pytest.mark.asyncio
    async def test_play_card_rejects_game_not_in_progress(self, mock_db, mock_action_logger, mock_room_in_game):
        """Test that play_card rejects if game not in progress."""
        mock_room_in_game.game_phase = "waiting"
        service = GameService(db=mock_db, action_logger=mock_action_logger)
        
        with pytest.raises(ValueError, match="Game is not in progress"):
            await service.play_card(
                room=mock_room_in_game,
                player_id=1,
                card_id="5_hearts",
                action="trail"
            )
    
    @pytest.mark.asyncio
    async def test_play_card_rejects_invalid_action(self, mock_db, mock_action_logger, mock_room_in_game):
        """Test that play_card rejects invalid action type."""
        service = GameService(db=mock_db, action_logger=mock_action_logger)
        
        with pytest.raises(ValueError, match="Invalid action"):
            await service.play_card(
                room=mock_room_in_game,
                player_id=1,
                card_id="5_hearts",
                action="invalid_action"
            )
    
    @pytest.mark.asyncio
    async def test_play_card_version_conflict(self, mock_db, mock_action_logger, mock_room_in_game):
        """Test that play_card raises VersionConflictError on version mismatch."""
        service = GameService(db=mock_db, action_logger=mock_action_logger)
        
        with pytest.raises(VersionConflictError) as exc_info:
            await service.play_card(
                room=mock_room_in_game,
                player_id=1,
                card_id="5_hearts",
                action="trail",
                client_version=3  # Server is at version 5
            )
        
        assert exc_info.value.client_version == 3
        assert exc_info.value.server_version == 5


class TestVersionConflictError:
    """Tests for VersionConflictError exception."""
    
    def test_version_conflict_error_attributes(self):
        """Test VersionConflictError stores all attributes."""
        error = VersionConflictError(
            message="Version mismatch",
            client_version=3,
            server_version=5,
            requires_sync=True,
            has_gap=True,
            gap_size=2
        )
        
        assert str(error) == "Version mismatch"
        assert error.client_version == 3
        assert error.server_version == 5
        assert error.requires_sync is True
        assert error.has_gap is True
        assert error.gap_size == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
