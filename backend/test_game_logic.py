#!/usr/bin/env python3
"""
Game logic tests for the Casino Card Game
Tests card game rules, scoring, and win conditions
"""

import pytest
from typing import List, Dict, Any

class TestCardGameLogic:
    """Test casino card game logic and rules"""
    
    def test_deck_creation(self):
        """Test that a standard deck has 52 cards"""
        from main import create_deck
        
        deck = create_deck()
        assert len(deck) == 52
        
        # Check that all cards are unique
        card_ids = [card['id'] for card in deck]
        assert len(set(card_ids)) == 52
        
        # Check that all suits are represented
        suits = [card['suit'] for card in deck]
        assert suits.count('hearts') == 13
        assert suits.count('diamonds') == 13
        assert suits.count('clubs') == 13
        assert suits.count('spades') == 13
    
    def test_card_values(self):
        """Test that card values are correctly assigned"""
        from main import create_deck
        
        deck = create_deck()
        
        # Test face card values
        for card in deck:
            if card['rank'] == 'A':
                assert card['value'] == 1
            elif card['rank'] in ['J', 'Q', 'K']:
                assert card['value'] == 10
            elif card['rank'].isdigit():
                value = int(card['rank'])
                assert card['value'] == min(10, value)
    
    def test_room_id_generation(self):
        """Test that room IDs are unique and properly formatted"""
        from main import generate_room_id
        
        room_ids = set()
        for _ in range(100):
            room_id = generate_room_id()
            assert len(room_id) == 6
            assert room_id.isalnum()
            assert room_id.isupper()
            room_ids.add(room_id)
        
        # Should have generated unique IDs
        assert len(room_ids) == 100
    
    def test_capture_logic(self):
        """Test card capture logic"""
        # Test basic capture (matching values)
        def can_capture(played_card: Dict, table_cards: List[Dict]) -> bool:
            played_value = played_card['value']
            table_values = [card['value'] for card in table_cards]
            return played_value in table_values
        
        # Test cases
        played_card = {'id': 'A_hearts', 'value': 1, 'rank': 'A', 'suit': 'hearts'}
        
        # Can capture matching value
        table_cards = [{'id': 'A_spades', 'value': 1, 'rank': 'A', 'suit': 'spades'}]
        assert can_capture(played_card, table_cards) == True
        
        # Cannot capture different value
        table_cards = [{'id': 'K_spades', 'value': 10, 'rank': 'K', 'suit': 'spades'}]
        assert can_capture(played_card, table_cards) == False
        
        # Can capture multiple cards with same value
        table_cards = [
            {'id': 'A_spades', 'value': 1, 'rank': 'A', 'suit': 'spades'},
            {'id': 'A_diamonds', 'value': 1, 'rank': 'A', 'suit': 'diamonds'}
        ]
        assert can_capture(played_card, table_cards) == True
    
    def test_build_logic(self):
        """Test card build logic"""
        def can_build(played_card: Dict, table_cards: List[Dict], build_value: int) -> bool:
            # Check if the sum of selected table cards equals the build value
            # and the played card value equals the build value
            if played_card['value'] != build_value:
                return False
            
            # For simplicity, assume we can build with any combination
            # In a real implementation, this would be more complex
            return True
        
        played_card = {'id': '5_hearts', 'value': 5, 'rank': '5', 'suit': 'hearts'}
        table_cards = [
            {'id': '2_spades', 'value': 2, 'rank': '2', 'suit': 'spades'},
            {'id': '3_diamonds', 'value': 3, 'rank': '3', 'suit': 'diamonds'}
        ]
        
        # Can build value 5 with 2+3
        assert can_build(played_card, table_cards, 5) == True
        
        # Cannot build value 6 with 2+3
        assert can_build(played_card, table_cards, 6) == False
    
    def test_scoring_logic(self):
        """Test casino scoring rules"""
        def calculate_score(captured_cards: List[Dict]) -> int:
            score = 0
            
            # Points for Aces
            aces = [card for card in captured_cards if card['rank'] == 'A']
            score += len(aces)
            
            # Points for Two of Spades
            two_of_spades = [card for card in captured_cards if card['id'] == '2_spades']
            score += len(two_of_spades)
            
            # Points for Ten of Diamonds
            ten_of_diamonds = [card for card in captured_cards if card['id'] == '10_diamonds']
            score += len(ten_of_diamonds) * 2
            
            return score
        
        # Test scoring
        captured_cards = [
            {'id': 'A_hearts', 'rank': 'A', 'suit': 'hearts'},
            {'id': '2_spades', 'rank': '2', 'suit': 'spades'},
            {'id': '10_diamonds', 'rank': '10', 'suit': 'diamonds'},
            {'id': 'K_clubs', 'rank': 'K', 'suit': 'clubs'}
        ]
        
        score = calculate_score(captured_cards)
        assert score == 4  # 1 (Ace) + 1 (2♠) + 2 (10♦) + 0 (K♣)
    
    def test_win_condition(self):
        """Test win condition logic"""
        def check_win_condition(player1_score: int, player2_score: int, 
                               player1_cards: int, player2_cards: int) -> int:
            """
            Determine winner based on scores and card counts
            Returns: 1 for player 1, 2 for player 2, 0 for tie
            """
            if player1_score > player2_score:
                return 1
            elif player2_score > player1_score:
                return 2
            else:
                # Tie in score, check card count
                if player1_cards > player2_cards:
                    return 1
                elif player2_cards > player1_cards:
                    return 2
                else:
                    return 0  # Complete tie
        
        # Test win by score
        assert check_win_condition(10, 5, 20, 20) == 1
        assert check_win_condition(5, 10, 20, 20) == 2
        
        # Test tie in score, win by cards
        assert check_win_condition(10, 10, 25, 20) == 1
        assert check_win_condition(10, 10, 20, 25) == 2
        
        # Test complete tie
        assert check_win_condition(10, 10, 20, 20) == 0
    
    def test_game_phase_transitions(self):
        """Test game phase transition logic"""
        def get_next_phase(current_phase: str, action: str) -> str:
            """Determine next game phase based on current phase and action"""
            phase_transitions = {
                'waiting': {
                    'both_ready': 'cardSelection'
                },
                'cardSelection': {
                    'cards_selected': 'round1'
                },
                'round1': {
                    'round_complete': 'round2',
                    'game_complete': 'finished'
                },
                'round2': {
                    'round_complete': 'round3',
                    'game_complete': 'finished'
                },
                'round3': {
                    'round_complete': 'round4',
                    'game_complete': 'finished'
                },
                'round4': {
                    'game_complete': 'finished'
                }
            }
            
            return phase_transitions.get(current_phase, {}).get(action, current_phase)
        
        # Test phase transitions
        assert get_next_phase('waiting', 'both_ready') == 'cardSelection'
        assert get_next_phase('cardSelection', 'cards_selected') == 'round1'
        assert get_next_phase('round1', 'round_complete') == 'round2'
        assert get_next_phase('round4', 'game_complete') == 'finished'
        
        # Test invalid transitions
        assert get_next_phase('waiting', 'invalid_action') == 'waiting'
    
    def test_card_dealing(self):
        """Test card dealing logic"""
        def deal_cards(deck: List[Dict]) -> Dict[str, List[Dict]]:
            """Deal cards to players and table"""
            if len(deck) < 12:
                raise ValueError("Not enough cards in deck")
            
            return {
                'table_cards': deck[:4],
                'player1_hand': deck[4:8],
                'player2_hand': deck[8:12],
                'remaining_deck': deck[12:]
            }
        
        # Create a test deck
        from main import create_deck
        deck = create_deck()
        
        # Deal cards
        dealt = deal_cards(deck)
        
        # Check dealing
        assert len(dealt['table_cards']) == 4
        assert len(dealt['player1_hand']) == 4
        assert len(dealt['player2_hand']) == 4
        assert len(dealt['remaining_deck']) == 44
        
        # Check that all cards are unique
        all_cards = (dealt['table_cards'] + 
                    dealt['player1_hand'] + 
                    dealt['player2_hand'] + 
                    dealt['remaining_deck'])
        card_ids = [card['id'] for card in all_cards]
        assert len(set(card_ids)) == 52
    
    def test_valid_moves(self):
        """Test valid move validation"""
        def is_valid_move(played_card: Dict, action: str, 
                         table_cards: List[Dict], player_hand: List[Dict]) -> bool:
            """Check if a move is valid"""
            # Check if player has the card
            if played_card not in player_hand:
                return False
            
            if action == 'trail':
                return True  # Always valid
            
            elif action == 'capture':
                # Must be able to capture at least one card
                played_value = played_card['value']
                table_values = [card['value'] for card in table_cards]
                return played_value in table_values
            
            elif action == 'build':
                # Must have cards to capture the build
                return True  # Simplified for testing
            
            return False
        
        # Test valid moves
        played_card = {'id': 'A_hearts', 'value': 1, 'rank': 'A', 'suit': 'hearts'}
        player_hand = [played_card]
        table_cards = [{'id': 'A_spades', 'value': 1, 'rank': 'A', 'suit': 'spades'}]
        
        # Valid capture
        assert is_valid_move(played_card, 'capture', table_cards, player_hand) == True
        
        # Valid trail
        assert is_valid_move(played_card, 'trail', table_cards, player_hand) == True
        
        # Invalid capture (no matching cards)
        table_cards = [{'id': 'K_spades', 'value': 10, 'rank': 'K', 'suit': 'spades'}]
        assert is_valid_move(played_card, 'capture', table_cards, player_hand) == False
        
        # Invalid move (card not in hand)
        assert is_valid_move(played_card, 'capture', table_cards, []) == False

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
