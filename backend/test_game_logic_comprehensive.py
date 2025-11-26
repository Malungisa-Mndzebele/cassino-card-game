"""
Comprehensive tests for game_logic.py to achieve high coverage
"""
import pytest
from game_logic import CasinoGameLogic, GamePhase
from models import GameState, Player, Card


class TestCasinoGameLogic:
    """Test suite for CasinoGameLogic class"""
    
    @pytest.fixture
    def game_logic(self):
        """Create a game logic instance"""
        return CasinoGameLogic()
    
    @pytest.fixture
    def sample_game_state(self):
        """Create a sample game state"""
        return GameState(
            room_id="TEST01",
            phase=GamePhase.WAITING,
            player1_id="player1",
            player2_id="player2",
            player1_hand=[],
            player2_hand=[],
            table_cards=[],
            deck=[],
            player1_captured=[],
            player2_captured=[],
            player1_score=0,
            player2_score=0,
            current_turn="player1",
            last_capture_player=None,
            round_number=1
        )
    
    # Initialization Tests
    def test_init_creates_deck(self, game_logic):
        """Test that initialization creates a full deck"""
        assert len(game_logic.deck) == 52
        
    def test_init_deck_has_all_suits(self, game_logic):
        """Test that deck contains all four suits"""
        suits = set(card['suit'] for card in game_logic.deck)
        assert suits == {'hearts', 'diamonds', 'clubs', 'spades'}
    
    def test_init_deck_has_all_ranks(self, game_logic):
        """Test that deck contains all ranks"""
        ranks = set(card['rank'] for card in game_logic.deck)
        expected_ranks = {'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'}
        assert ranks == expected_ranks
    
    # Shuffle Tests
    def test_shuffle_maintains_deck_size(self, game_logic):
        """Test that shuffling maintains deck size"""
        original_size = len(game_logic.deck)
        game_logic.shuffle()
        assert len(game_logic.deck) == original_size
    
    def test_shuffle_changes_order(self, game_logic):
        """Test that shuffling changes card order"""
        original_deck = game_logic.deck.copy()
        game_logic.shuffle()
        # Very unlikely to be the same after shuffle
        assert game_logic.deck != original_deck
    
    # Deal Tests
    def test_deal_initial_cards(self, game_logic, sample_game_state):
        """Test dealing initial cards"""
        game_logic.deck = [
            {'suit': 'hearts', 'rank': 'A', 'value': 1},
            {'suit': 'hearts', 'rank': '2', 'value': 2},
            {'suit': 'hearts', 'rank': '3', 'value': 3},
            {'suit': 'hearts', 'rank': '4', 'value': 4},
            {'suit': 'hearts', 'rank': '5', 'value': 5},
            {'suit': 'hearts', 'rank': '6', 