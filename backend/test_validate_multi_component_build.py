"""
Test suite for validate_multi_component_build() method.

This test file validates the multi-component build validation logic
according to the requirements in .kiro/specs/multi-component-builds/
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from game_logic import CasinoGameLogic, GameCard, Build


def test_basic_two_component_build():
    """Test a basic 2-component build with value 5"""
    logic = CasinoGameLogic()
    
    # Setup: Player has 5♥ and 5♣ in hand
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    # Table has 3♠ and 2♦
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("2_diamonds", "diamonds", "2", 2)
    ]
    
    # Component 1: 3♠ + 2♦ = 5
    # Component 2: 5♥ = 5
    components = [
        [table_cards[0], table_cards[1]],  # 3 + 2
        [hand_card]  # 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert is_valid, f"Expected valid build, got error: {error}"
    print("✓ Basic two-component build test passed")


def test_no_capturing_card():
    """Test that build fails when player has no capturing card"""
    logic = CasinoGameLogic()
    
    # Setup: Player has 5♥ and 7♣ in hand (no capturing card for value 5)
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    other_card = GameCard("7_clubs", "clubs", "7", 7)
    player_hand = [hand_card, other_card]
    
    # Table has 3♠ and 2♦
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("2_diamonds", "diamonds", "2", 2)
    ]
    
    components = [
        [table_cards[0], table_cards[1]],  # 3 + 2 = 5
        [hand_card]  # 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert not is_valid, "Expected invalid build due to no capturing card"
    assert "No card in hand can capture" in error
    print("✓ No capturing card test passed")


def test_invalid_component_sum():
    """Test that build fails when component doesn't sum to target value"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    # Table has 3♠ and 4♦
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("4_diamonds", "diamonds", "4", 4)
    ]
    
    # Component 1: 3♠ + 4♦ = 7 (not 5!)
    # Component 2: 5♥ = 5
    components = [
        [table_cards[0], table_cards[1]],  # 3 + 4 = 7, not 5
        [hand_card]  # 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert not is_valid, "Expected invalid build due to wrong component sum"
    assert "Component 1" in error
    print("✓ Invalid component sum test passed")


def test_hand_card_not_in_any_component():
    """Test that build fails when hand card is not in any component"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("2_diamonds", "diamonds", "2", 2)
    ]
    
    # Neither component includes the hand card!
    components = [
        [table_cards[0], table_cards[1]],  # 3 + 2 = 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert not is_valid, "Expected invalid build due to hand card not in component"
    assert "Hand card must be included in exactly one component" in error
    print("✓ Hand card not in component test passed")


def test_hand_card_in_multiple_components():
    """Test that build fails when hand card appears in multiple components"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("2_diamonds", "diamonds", "2", 2)
    ]
    
    # Hand card appears in both components!
    components = [
        [hand_card],  # 5
        [hand_card]   # 5 (duplicate!)
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert not is_valid, "Expected invalid build due to hand card in multiple components"
    assert "must be in exactly one" in error
    print("✓ Hand card in multiple components test passed")


def test_unavailable_table_card():
    """Test that build fails when component uses card not on table"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    # Only 3♠ is on table
    table_cards = [
        GameCard("3_spades", "spades", "3", 3)
    ]
    
    # Component tries to use 2♦ which is NOT on table
    unavailable_card = GameCard("2_diamonds", "diamonds", "2", 2)
    components = [
        [table_cards[0], unavailable_card],  # 3 + 2 = 5, but 2♦ not on table
        [hand_card]  # 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert not is_valid, "Expected invalid build due to unavailable card"
    assert "not available on table" in error
    print("✓ Unavailable table card test passed")


def test_three_component_build():
    """Test a 3-component build with value 6"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("6_hearts", "hearts", "6", 6)
    capturing_card = GameCard("6_clubs", "clubs", "6", 6)
    player_hand = [hand_card, capturing_card]
    
    table_cards = [
        GameCard("2_spades", "spades", "2", 2),
        GameCard("4_diamonds", "diamonds", "4", 4),
        GameCard("3_hearts", "hearts", "3", 3),
        GameCard("3_clubs", "clubs", "3", 3)
    ]
    
    # Component 1: 2♠ + 4♦ = 6
    # Component 2: 3♥ + 3♣ = 6
    # Component 3: 6♥ = 6
    components = [
        [table_cards[0], table_cards[1]],  # 2 + 4 = 6
        [table_cards[2], table_cards[3]],  # 3 + 3 = 6
        [hand_card]  # 6
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=6,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert is_valid, f"Expected valid 3-component build, got error: {error}"
    print("✓ Three-component build test passed")


def test_augmentation_with_matching_build_value():
    """Test augmenting an existing build with matching value"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("2_diamonds", "diamonds", "2", 2)
    ]
    
    # Existing build with value 5
    existing_build = Build(
        id="build_1",
        cards=[GameCard("4_hearts", "hearts", "4", 4), GameCard("A_spades", "spades", "A", 1)],
        value=5,
        owner=1,
        components=[],
        is_multi_component=False
    )
    
    components = [
        [table_cards[0], table_cards[1]],  # 3 + 2 = 5
        [hand_card]  # 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards,
        target_builds=[existing_build]
    )
    
    assert is_valid, f"Expected valid augmentation, got error: {error}"
    print("✓ Augmentation with matching build value test passed")


def test_augmentation_with_mismatched_build_value():
    """Test that augmentation fails when target build has different value"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    
    table_cards = [
        GameCard("3_spades", "spades", "3", 3),
        GameCard("2_diamonds", "diamonds", "2", 2)
    ]
    
    # Existing build with value 7 (different from our build value of 5)
    existing_build = Build(
        id="build_1",
        cards=[GameCard("4_hearts", "hearts", "4", 4), GameCard("3_clubs", "clubs", "3", 3)],
        value=7,
        owner=1,
        components=[],
        is_multi_component=False
    )
    
    components = [
        [table_cards[0], table_cards[1]],  # 3 + 2 = 5
        [hand_card]  # 5
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards,
        target_builds=[existing_build]
    )
    
    assert not is_valid, "Expected invalid augmentation due to mismatched build value"
    assert "Target build has value 7, expected 5" in error
    print("✓ Augmentation with mismatched build value test passed")


def test_ace_handling_in_component():
    """Test that Aces work correctly with dual values (1 or 14)"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("4_hearts", "hearts", "4", 4)
    capturing_card = GameCard("4_clubs", "clubs", "4", 4)
    player_hand = [hand_card, capturing_card]
    
    # Ace can be 1 or 14
    ace = GameCard("A_spades", "spades", "A", 1)
    three = GameCard("3_diamonds", "diamonds", "3", 3)
    table_cards = [ace, three]
    
    # Component 1: A♠ (as 1) + 3♦ = 4
    # Component 2: 4♥ = 4
    components = [
        [ace, three],  # A (as 1) + 3 = 4
        [hand_card]  # 4
    ]
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=components,
        build_value=4,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert is_valid, f"Expected valid build with Ace as 1, got error: {error}"
    print("✓ Ace handling in component test passed")


def test_empty_components_list():
    """Test that validation fails with empty components list"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard("5_hearts", "hearts", "5", 5)
    capturing_card = GameCard("5_clubs", "clubs", "5", 5)
    player_hand = [hand_card, capturing_card]
    table_cards = []
    
    is_valid, error = logic.validate_multi_component_build(
        hand_card=hand_card,
        components=[],  # Empty!
        build_value=5,
        player_hand=player_hand,
        table_cards=table_cards
    )
    
    assert not is_valid, "Expected invalid build due to empty components"
    assert "No components provided" in error
    print("✓ Empty components list test passed")


if __name__ == "__main__":
    print("\nRunning validate_multi_component_build() tests...\n")
    
    test_basic_two_component_build()
    test_no_capturing_card()
    test_invalid_component_sum()
    test_hand_card_not_in_any_component()
    test_hand_card_in_multiple_components()
    test_unavailable_table_card()
    test_three_component_build()
    test_augmentation_with_matching_build_value()
    test_augmentation_with_mismatched_build_value()
    test_ace_handling_in_component()
    test_empty_components_list()
    
    print("\n✅ All tests passed!\n")
