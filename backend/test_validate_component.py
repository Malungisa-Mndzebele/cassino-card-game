"""
Test validate_component() method in CasinoGameLogic.
Tests Requirements 2.1 and 2.2 from multi-component-builds spec.
"""

from game_logic import CasinoGameLogic, GameCard


def test_validate_component_empty_component():
    """Test that empty components are rejected"""
    logic = CasinoGameLogic()
    
    # Empty component should fail
    is_valid, error, ace_vals = logic.validate_component([], 13)
    
    assert is_valid == False
    assert error == "Component contains no cards"
    assert ace_vals == {}
    
    print("✓ Empty component rejection test passed")


def test_validate_component_simple_sum():
    """Test component validation with simple card sum (no Aces)"""
    logic = CasinoGameLogic()
    
    # Create cards that sum to 13
    card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    
    # Should be valid
    is_valid, error, ace_vals = logic.validate_component([card1, card2], 13)
    
    assert is_valid == True
    assert error is None
    assert ace_vals == {}
    
    print("✓ Simple sum validation test passed")


def test_validate_component_invalid_sum():
    """Test component validation with invalid sum"""
    logic = CasinoGameLogic()
    
    # Create cards that sum to 11, not 13
    card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="6_diamonds", suit="diamonds", rank="6", value=6)
    
    # Should be invalid
    is_valid, error, ace_vals = logic.validate_component([card1, card2], 13)
    
    assert is_valid == False
    assert "11" in error  # Should mention actual sum
    assert "13" in error  # Should mention target value
    assert ace_vals == {}
    
    print("✓ Invalid sum rejection test passed")


def test_validate_component_with_ace_as_1():
    """Test component validation with Ace counted as 1"""
    logic = CasinoGameLogic()
    
    # Ace + 3 = 4 (Ace as 1)
    ace = GameCard(id="A_spades", suit="spades", rank="A", value=1)
    card2 = GameCard(id="3_diamonds", suit="diamonds", rank="3", value=3)
    
    # Should be valid with Ace as 1
    is_valid, error, ace_vals = logic.validate_component([ace, card2], 4)
    
    assert is_valid == True
    assert error is None
    assert ace_vals["A_spades"] == 1
    
    print("✓ Ace as 1 validation test passed")


def test_validate_component_with_ace_as_14():
    """Test component validation with Ace counted as 14"""
    logic = CasinoGameLogic()
    
    # Ace + 3 = 17 (Ace as 14)
    ace = GameCard(id="A_spades", suit="spades", rank="A", value=1)
    card2 = GameCard(id="3_diamonds", suit="diamonds", rank="3", value=3)
    
    # Should be valid with Ace as 14
    is_valid, error, ace_vals = logic.validate_component([ace, card2], 17)
    
    assert is_valid == True
    assert error is None
    assert ace_vals["A_spades"] == 14
    
    print("✓ Ace as 14 validation test passed")


def test_validate_component_with_multiple_aces():
    """Test component validation with multiple Aces using different values"""
    logic = CasinoGameLogic()
    
    # Two Aces + 3 = 18 (both Aces as 14 would be 31, both as 1 would be 5)
    # We need: 1 + 14 + 3 = 18
    ace1 = GameCard(id="A_spades", suit="spades", rank="A", value=1)
    ace2 = GameCard(id="A_hearts", suit="hearts", rank="A", value=1)
    card3 = GameCard(id="3_diamonds", suit="diamonds", rank="3", value=3)
    
    # Should be valid with one Ace as 1 and one as 14
    is_valid, error, ace_vals = logic.validate_component([ace1, ace2, card3], 18)
    
    assert is_valid == True
    assert error is None
    # One Ace should be 1, the other 14
    assert len(ace_vals) == 2
    assert set(ace_vals.values()) == {1, 14}
    
    print("✓ Multiple Aces validation test passed")


def test_validate_component_with_hand_card_included():
    """Test component validation when hand card is specified and included"""
    logic = CasinoGameLogic()
    
    # Create cards including the hand card
    hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    
    # Should be valid when hand card is in component
    is_valid, error, ace_vals = logic.validate_component(
        [hand_card, card2], 13, hand_card=hand_card
    )
    
    assert is_valid == True
    assert error is None
    
    print("✓ Hand card included validation test passed")


def test_validate_component_with_hand_card_missing():
    """Test component validation when hand card is specified but not included"""
    logic = CasinoGameLogic()
    
    # Create cards NOT including the hand card
    hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card1 = GameCard(id="6_diamonds", suit="diamonds", rank="6", value=6)
    card2 = GameCard(id="7_clubs", suit="clubs", rank="7", value=7)
    
    # Should be invalid when hand card is not in component
    is_valid, error, ace_vals = logic.validate_component(
        [card1, card2], 13, hand_card=hand_card
    )
    
    assert is_valid == False
    assert "5_hearts" in error
    assert "not found" in error.lower()
    
    print("✓ Hand card missing rejection test passed")


def test_validate_component_single_card():
    """Test component validation with single card"""
    logic = CasinoGameLogic()
    
    # Single King = 13
    king = GameCard(id="K_hearts", suit="hearts", rank="K", value=13)
    
    # Should be valid
    is_valid, error, ace_vals = logic.validate_component([king], 13)
    
    assert is_valid == True
    assert error is None
    assert ace_vals == {}
    
    print("✓ Single card component validation test passed")


def test_validate_component_ace_cannot_make_value():
    """Test component with Ace that cannot make target value"""
    logic = CasinoGameLogic()
    
    # Ace + 3 can only make 4 (1+3) or 17 (14+3), not 10
    ace = GameCard(id="A_spades", suit="spades", rank="A", value=1)
    card2 = GameCard(id="3_diamonds", suit="diamonds", rank="3", value=3)
    
    # Should be invalid
    is_valid, error, ace_vals = logic.validate_component([ace, card2], 10)
    
    assert is_valid == False
    assert "cannot sum" in error.lower()
    assert "10" in error
    
    print("✓ Ace cannot make value rejection test passed")


if __name__ == "__main__":
    test_validate_component_empty_component()
    test_validate_component_simple_sum()
    test_validate_component_invalid_sum()
    test_validate_component_with_ace_as_1()
    test_validate_component_with_ace_as_14()
    test_validate_component_with_multiple_aces()
    test_validate_component_with_hand_card_included()
    test_validate_component_with_hand_card_missing()
    test_validate_component_single_card()
    test_validate_component_ace_cannot_make_value()
    print("\n✅ All validate_component() tests passed!")
