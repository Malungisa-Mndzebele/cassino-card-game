"""Quick test for simple build validation (drag-and-drop feature)"""
import sys
sys.path.insert(0, '.')

from game_logic import CasinoGameLogic, GameCard

def test_simple_build():
    logic = CasinoGameLogic()
    
    # Test 1: Simple build with matching card in hand
    hand_card = GameCard('5_hearts', 'hearts', '5', 5)
    capturing_card = GameCard('5_clubs', 'clubs', '5', 5)
    player_hand = [hand_card, capturing_card]
    
    # Should be valid: building 5 with a 5, and have another 5 to capture
    result = logic.validate_build(hand_card, [], 5, player_hand)
    print(f"Test 1 - Simple build (5 with 5 in hand): {result}")
    assert result == True, "Simple build should be valid"
    
    # Test 2: Simple build without matching card
    hand_card2 = GameCard('5_hearts', 'hearts', '5', 5)
    other_card = GameCard('7_clubs', 'clubs', '7', 7)
    player_hand2 = [hand_card2, other_card]
    
    # Should be invalid: building 5 but no 5 to capture (only 7)
    result2 = logic.validate_build(hand_card2, [], 5, player_hand2)
    print(f"Test 2 - Simple build (5 without 5 in hand): {result2}")
    assert result2 == False, "Simple build without capturing card should be invalid"
    
    # Test 3: Simple build with Ace (can be 1 or 14)
    ace_card = GameCard('A_hearts', 'hearts', 'A', 1)
    fourteen_card = GameCard('A_clubs', 'clubs', 'A', 1)  # Another ace
    player_hand3 = [ace_card, fourteen_card]
    
    # Should be valid: building 14 with Ace, and have another Ace to capture
    result3 = logic.validate_build(ace_card, [], 14, player_hand3)
    print(f"Test 3 - Simple build (Ace as 14): {result3}")
    assert result3 == True, "Ace simple build as 14 should be valid"
    
    # Test 4: Simple build with Ace as 1
    result4 = logic.validate_build(ace_card, [], 1, player_hand3)
    print(f"Test 4 - Simple build (Ace as 1): {result4}")
    assert result4 == True, "Ace simple build as 1 should be valid"
    
    print("\n✅ All simple build tests passed!")

if __name__ == "__main__":
    test_simple_build()
