"""
Simple unit tests for Casino Card Game Logic (no pytest required)
Tests all game mechanics: dealing, capture, build, trail, scoring, and win conditions
"""

import sys
import os

# Add the backend directory to the path so we can import game_logic
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from game_logic import CasinoGameLogic, GameCard, Build

class TestCasinoGameLogic:
    """Test suite for Casino game logic"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        self.game = CasinoGameLogic()
        self.deck = self.game.create_deck()
    
    def test_create_deck(self):
        """Test deck creation and properties"""
        deck = self.game.create_deck()
        
        # Should have 52 cards
        assert len(deck) == 52
        
        # Should have all suits
        suits = set(card.suit for card in deck)
        assert suits == {'hearts', 'diamonds', 'clubs', 'spades'}
        
        # Should have all ranks
        ranks = set(card.rank for card in deck)
        expected_ranks = {'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'}
        assert ranks == expected_ranks
        
        # Should have unique IDs
        ids = [card.id for card in deck]
        assert len(ids) == len(set(ids))
    
    def test_card_values(self):
        """Test card value assignments"""
        assert self.game.get_card_value('A') == 14
        assert self.game.get_card_value('K') == 13
        assert self.game.get_card_value('Q') == 12
        assert self.game.get_card_value('J') == 11
        assert self.game.get_card_value('10') == 10
        assert self.game.get_card_value('5') == 5
        assert self.game.get_card_value('2') == 2
    
    def test_deal_initial_cards(self):
        """Test initial card dealing"""
        table_cards, player1_hand, player2_hand, remaining_deck = self.game.deal_initial_cards(self.deck)
        
        # Should deal 4 cards to each location
        assert len(table_cards) == 4
        assert len(player1_hand) == 4
        assert len(player2_hand) == 4
        assert len(remaining_deck) == 40  # 52 - 12 = 40
        
        # All cards should be unique
        all_cards = table_cards + player1_hand + player2_hand + remaining_deck
        all_ids = [card.id for card in all_cards]
        assert len(all_ids) == len(set(all_ids))
        assert len(all_cards) == 52
    
    def test_deal_round_cards(self):
        """Test dealing cards for round 2"""
        # Start with a smaller deck for testing
        test_deck = self.deck[:20]  # 20 cards
        player1_hand = []
        player2_hand = []
        
        new_p1_hand, new_p2_hand, remaining_deck = self.game.deal_round_cards(
            test_deck, player1_hand, player2_hand
        )
        
        # Should deal 4 cards to each player
        assert len(new_p1_hand) == 4
        assert len(new_p2_hand) == 4
        assert len(remaining_deck) == 12  # 20 - 8 = 12
    
    def test_validate_capture_direct_match(self):
        """Test capture validation with direct card match"""
        hand_card = GameCard(id="K_hearts", suit="hearts", rank="K", value=13)
        table_cards = [
            GameCard(id="K_spades", suit="spades", rank="K", value=13),
            GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        ]
        builds = []
        
        # Should be valid - direct match
        assert self.game.validate_capture(hand_card, table_cards, builds) == True
    
    def test_validate_capture_sum_match(self):
        """Test capture validation with sum of cards"""
        hand_card = GameCard(id="8_hearts", suit="hearts", rank="8", value=8)
        table_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        ]
        builds = []
        
        # Should be valid - 3 + 5 = 8
        assert self.game.validate_capture(hand_card, table_cards, builds) == True
    
    def test_validate_capture_invalid(self):
        """Test capture validation with invalid capture"""
        hand_card = GameCard(id="8_hearts", suit="hearts", rank="8", value=8)
        table_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="2_hearts", suit="hearts", rank="2", value=2)
        ]
        builds = []
        
        # Should be invalid - 3 + 2 = 5, not 8
        assert self.game.validate_capture(hand_card, table_cards, builds) == False
    
    def test_validate_build(self):
        """Test build validation"""
        hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        table_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="2_hearts", suit="hearts", rank="2", value=2)
        ]
        player_hand = [
            GameCard(id="8_clubs", suit="clubs", rank="8", value=8),  # Can capture build value 8
            hand_card
        ]
        
        # Should be valid - can build 8 (5 + 3), and has 8 to capture it
        assert self.game.validate_build(hand_card, table_cards, 8, player_hand) == True
    
    def test_validate_build_invalid_no_capturing_card(self):
        """Test build validation when player can't capture the build"""
        hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        table_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="2_hearts", suit="hearts", rank="2", value=2)
        ]
        player_hand = [
            GameCard(id="7_clubs", suit="clubs", rank="7", value=7),  # Can't capture build value 8
            hand_card
        ]
        
        # Should be invalid - can build 8 but can't capture it
        assert self.game.validate_build(hand_card, table_cards, 8, player_hand) == False
    
    def test_can_make_value(self):
        """Test value combination logic"""
        cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="5_hearts", suit="hearts", rank="5", value=5),
            GameCard(id="2_clubs", suit="clubs", rank="2", value=2)
        ]
        
        # Should be able to make 8 (3+5), 5 (5), 3 (3), 2 (2), 7 (5+2), 10 (3+5+2)
        assert self.game.can_make_value(cards, 8) == True
        assert self.game.can_make_value(cards, 5) == True
        assert self.game.can_make_value(cards, 3) == True
        assert self.game.can_make_value(cards, 2) == True
        assert self.game.can_make_value(cards, 7) == True
        assert self.game.can_make_value(cards, 10) == True
        
        # Should not be able to make 1, 4, 6, 9, 11
        assert self.game.can_make_value(cards, 1) == False
        assert self.game.can_make_value(cards, 4) == False
        assert self.game.can_make_value(cards, 6) == False
        assert self.game.can_make_value(cards, 9) == False
        assert self.game.can_make_value(cards, 11) == False
    
    def test_execute_capture(self):
        """Test capture execution"""
        hand_card = GameCard(id="8_hearts", suit="hearts", rank="8", value=8)
        target_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        ]
        builds = []
        player_id = 1
        
        captured_cards, remaining_builds, remaining_table_cards = self.game.execute_capture(
            hand_card, target_cards, builds, player_id
        )
        
        # Should capture hand card + target cards
        assert len(captured_cards) == 3
        assert hand_card in captured_cards
        assert target_cards[0] in captured_cards
        assert target_cards[1] in captured_cards
        
        # No builds should remain
        assert len(remaining_builds) == 0
        assert len(remaining_table_cards) == 0
    
    def test_execute_build(self):
        """Test build execution"""
        hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        target_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3)
        ]
        build_value = 8
        player_id = 1
        
        remaining_table_cards, new_build = self.game.execute_build(
            hand_card, target_cards, build_value, player_id
        )
        
        # Should create a build with hand card + target cards
        assert new_build.value == 8
        assert new_build.owner == 1
        assert len(new_build.cards) == 2
        assert hand_card in new_build.cards
        assert target_cards[0] in new_build.cards
        
        # No table cards should remain
        assert len(remaining_table_cards) == 0
    
    def test_execute_trail(self):
        """Test trail execution"""
        hand_card = GameCard(id="7_hearts", suit="hearts", rank="7", value=7)
        
        new_table_cards = self.game.execute_trail(hand_card)
        
        # Should add the card to table
        assert len(new_table_cards) == 1
        assert new_table_cards[0] == hand_card
    
    def test_calculate_score(self):
        """Test score calculation"""
        captured_cards = [
            GameCard(id="A_hearts", suit="hearts", rank="A", value=14),  # 1 point
            GameCard(id="2_spades", suit="spades", rank="2", value=2),   # 1 point
            GameCard(id="10_diamonds", suit="diamonds", rank="10", value=10),  # 2 points
            GameCard(id="5_clubs", suit="clubs", rank="5", value=5),     # 0 points
            GameCard(id="K_hearts", suit="hearts", rank="K", value=13)   # 0 points
        ]
        
        score = self.game.calculate_score(captured_cards)
        assert score == 4  # 1 (A) + 1 (2♠) + 2 (10♦) = 4 points
    
    def test_calculate_bonus_scores(self):
        """Test bonus score calculation"""
        # Player 1 has more cards and more spades
        player1_captured = [
            GameCard(id="A_spades", suit="spades", rank="A", value=14),
            GameCard(id="2_spades", suit="spades", rank="2", value=2),
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="5_hearts", suit="hearts", rank="5", value=5),
            GameCard(id="6_clubs", suit="clubs", rank="6", value=6)
        ]
        
        player2_captured = [
            GameCard(id="7_hearts", suit="hearts", rank="7", value=7),
            GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
        ]
        
        p1_bonus, p2_bonus = self.game.calculate_bonus_scores(player1_captured, player2_captured)
        
        # Player 1 should get both bonuses (most cards + most spades)
        assert p1_bonus == 4  # 2 (most cards) + 2 (most spades)
        assert p2_bonus == 0
    
    def test_determine_winner(self):
        """Test winner determination"""
        # Player 1 wins on score
        winner = self.game.determine_winner(5, 3, 10, 8)
        assert winner == 1
        
        # Player 2 wins on score
        winner = self.game.determine_winner(3, 5, 10, 8)
        assert winner == 2
        
        # Tie on score, player 1 wins on cards
        winner = self.game.determine_winner(5, 5, 12, 10)
        assert winner == 1
        
        # Complete tie
        winner = self.game.determine_winner(5, 5, 10, 10)
        assert winner is None
    
    def test_is_round_complete(self):
        """Test round completion detection"""
        # Round not complete
        player1_hand = [GameCard(id="A_hearts", suit="hearts", rank="A", value=14)]
        player2_hand = [GameCard(id="K_spades", suit="spades", rank="K", value=13)]
        assert self.game.is_round_complete(player1_hand, player2_hand) == False
        
        # Round complete
        player1_hand = []
        player2_hand = []
        assert self.game.is_round_complete(player1_hand, player2_hand) == True
    
    def test_is_game_complete(self):
        """Test game completion detection"""
        # Game not complete - round 1
        assert self.game.is_game_complete(1, [GameCard(id="A_hearts", suit="hearts", rank="A", value=14)], [], []) == False
        
        # Game complete - round 2 finished
        assert self.game.is_game_complete(2, [], [], []) == True
        
        # Game complete - no more cards
        assert self.game.is_game_complete(1, [], [], []) == True
    
    def test_get_possible_captures(self):
        """Test getting possible captures"""
        hand_card = GameCard(id="8_hearts", suit="hearts", rank="8", value=8)
        table_cards = [
            GameCard(id="8_spades", suit="spades", rank="8", value=8),  # Direct match
            GameCard(id="3_hearts", suit="hearts", rank="3", value=3),
            GameCard(id="5_clubs", suit="clubs", rank="5", value=5)     # Sum match (3+5=8)
        ]
        builds = []
        
        capturable = self.game.get_possible_captures(hand_card, table_cards, builds)
        
        # Should be able to capture 8_spades directly, or 3_hearts + 5_clubs
        assert len(capturable) >= 1  # At least the direct match
        assert any(card.id == "8_spades" for card in capturable)
    
    def test_get_possible_builds(self):
        """Test getting possible builds"""
        hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
        table_cards = [
            GameCard(id="3_spades", suit="spades", rank="3", value=3),
            GameCard(id="2_clubs", suit="clubs", rank="2", value=2)
        ]
        player_hand = [
            GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8),  # Can capture build value 8
            hand_card
        ]
        
        possible_builds = self.game.get_possible_builds(hand_card, table_cards, player_hand)
        
        # Should be able to build 8 (5 + 3)
        assert len(possible_builds) >= 1
        build_8 = next((build for build in possible_builds if build[1] == 8), None)
        assert build_8 is not None
        assert len(build_8[0]) == 1  # Should use just the 3
        assert build_8[0][0].id == "3_spades"
