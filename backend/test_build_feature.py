"""
Test the build feature: drag a card from hand onto a table card to create a build.

Example scenario:
- Table has: 3
- Hand has: 2 and 5
- Action: Play the 2 onto the 3 to create a "build of 5"
- Result: Build is created, can be captured later with the 5
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from game_logic import CasinoGameLogic, GameCard, Build

def test_build_with_hand_card_and_table_card():
    """Test building by combining a hand card with a table card."""
    logic = CasinoGameLogic()
    
    # Setup: Table has a 3, hand has 2 and 5
    table_card_3 = GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    hand_card_2 = GameCard(id="2_spades", suit="spades", rank="2", value=2)
    hand_card_5 = GameCard(id="5_diamonds", suit="diamonds", rank="5", value=5)
    
    table_cards = [table_card_3]
    player_hand = [hand_card_2, hand_card_5]
    
    # Test: Can we build a 5 by playing the 2 onto the 3?
    # hand_card=2, target_cards=[3], build_value=5, player_hand=[2, 5]
    is_valid = logic.validate_build(
        hand_card=hand_card_2,
        target_cards=[table_card_3],
        build_value=5,
        player_hand=player_hand
    )
    
    print(f"Test 1: Build 2 + 3 = 5 (with 5 in hand to capture)")
    print(f"  Hand card: 2")
    print(f"  Table card: 3")
    print(f"  Build value: 5")
    print(f"  Capturing card in hand: 5")
    print(f"  Result: {'PASS ✓' if is_valid else 'FAIL ✗'}")
    print()
    
    assert is_valid, "Build should be valid: 2 + 3 = 5, and we have 5 in hand"
    
    # Execute the build
    remaining_table, new_build = logic.execute_build(
        hand_card=hand_card_2,
        target_cards=[table_card_3],
        build_value=5,
        player_id=1
    )
    
    print(f"Test 2: Execute build")
    print(f"  Build created: {new_build.id}")
    print(f"  Build value: {new_build.value}")
    print(f"  Build cards: {[c.id for c in new_build.cards]}")
    print(f"  Build owner: {new_build.owner}")
    print(f"  Result: {'PASS ✓' if new_build.value == 5 else 'FAIL ✗'}")
    print()
    
    assert new_build.value == 5, "Build value should be 5"
    assert len(new_build.cards) == 2, "Build should contain 2 cards"
    assert new_build.owner == 1, "Build owner should be player 1"
    
    return True


def test_build_without_capturing_card():
    """Test that build fails if player doesn't have a capturing card."""
    logic = CasinoGameLogic()
    
    # Setup: Table has a 3, hand has 2 and 7 (no 5 to capture!)
    table_card_3 = GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    hand_card_2 = GameCard(id="2_spades", suit="spades", rank="2", value=2)
    hand_card_7 = GameCard(id="7_diamonds", suit="diamonds", rank="7", value=7)
    
    table_cards = [table_card_3]
    player_hand = [hand_card_2, hand_card_7]
    
    # Test: Can we build a 5 by playing the 2 onto the 3? (NO - we don't have a 5!)
    is_valid = logic.validate_build(
        hand_card=hand_card_2,
        target_cards=[table_card_3],
        build_value=5,
        player_hand=player_hand
    )
    
    print(f"Test 3: Build 2 + 3 = 5 (WITHOUT 5 in hand)")
    print(f"  Hand card: 2")
    print(f"  Table card: 3")
    print(f"  Build value: 5")
    print(f"  Hand contains: 2, 7 (no 5!)")
    print(f"  Expected: Invalid (no capturing card)")
    print(f"  Result: {'PASS ✓' if not is_valid else 'FAIL ✗'}")
    print()
    
    assert not is_valid, "Build should be invalid: no 5 in hand to capture"
    
    return True


def test_build_with_ace_flexibility():
    """Test building with Ace (can be 1 or 14)."""
    logic = CasinoGameLogic()
    
    # Setup: Table has a 3, hand has Ace and 4
    # Ace can be 1, so A + 3 = 4, and we have 4 to capture
    table_card_3 = GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    hand_card_ace = GameCard(id="A_spades", suit="spades", rank="A", value=1)
    hand_card_4 = GameCard(id="4_diamonds", suit="diamonds", rank="4", value=4)
    
    table_cards = [table_card_3]
    player_hand = [hand_card_ace, hand_card_4]
    
    # Test: Can we build a 4 by playing the Ace onto the 3?
    is_valid = logic.validate_build(
        hand_card=hand_card_ace,
        target_cards=[table_card_3],
        build_value=4,
        player_hand=player_hand
    )
    
    print(f"Test 4: Build A(1) + 3 = 4 (with 4 in hand)")
    print(f"  Hand card: Ace (value 1 or 14)")
    print(f"  Table card: 3")
    print(f"  Build value: 4")
    print(f"  Capturing card in hand: 4")
    print(f"  Result: {'PASS ✓' if is_valid else 'FAIL ✗'}")
    print()
    
    assert is_valid, "Build should be valid: A(1) + 3 = 4, and we have 4 in hand"
    
    return True


def test_build_same_value_as_hand_card():
    """Test that you can't build the same value as your hand card when combining."""
    logic = CasinoGameLogic()
    
    # Setup: Table has a 3, hand has 3 and 6
    # Can't build 3 + 0 = 3 (same as hand card value)
    table_card_3 = GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    hand_card_3 = GameCard(id="3_spades", suit="spades", rank="3", value=3)
    hand_card_6 = GameCard(id="6_diamonds", suit="diamonds", rank="6", value=6)
    
    table_cards = [table_card_3]
    player_hand = [hand_card_3, hand_card_6]
    
    # Test: Can we build a 3 by playing the 3 onto nothing? (combining build)
    # This should fail because build_value == hand_card value
    is_valid = logic.validate_build(
        hand_card=hand_card_3,
        target_cards=[table_card_3],
        build_value=3,
        player_hand=player_hand
    )
    
    print(f"Test 5: Build 3 + 3 = 6 (valid) vs Build value = 3 (invalid)")
    print(f"  Hand card: 3")
    print(f"  Table card: 3")
    print(f"  Build value: 3 (same as hand card!)")
    print(f"  Expected: Invalid (can't build same value as hand card when combining)")
    print(f"  Result: {'PASS ✓' if not is_valid else 'FAIL ✗'}")
    print()
    
    # Now test valid build: 3 + 3 = 6
    is_valid_6 = logic.validate_build(
        hand_card=hand_card_3,
        target_cards=[table_card_3],
        build_value=6,
        player_hand=player_hand
    )
    
    print(f"Test 6: Build 3 + 3 = 6 (with 6 in hand)")
    print(f"  Hand card: 3")
    print(f"  Table card: 3")
    print(f"  Build value: 6")
    print(f"  Capturing card in hand: 6")
    print(f"  Result: {'PASS ✓' if is_valid_6 else 'FAIL ✗'}")
    print()
    
    assert not is_valid, "Build should be invalid: can't build same value as hand card"
    assert is_valid_6, "Build should be valid: 3 + 3 = 6, and we have 6 in hand"
    
    return True


def test_capture_build():
    """Test capturing a build with the capturing card."""
    logic = CasinoGameLogic()
    
    # Setup: Build of 5 exists, hand has 5
    build_cards = [
        GameCard(id="2_spades", suit="spades", rank="2", value=2),
        GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    ]
    build = Build(id="build_1_2_5", cards=build_cards, value=5, owner=1)
    
    hand_card_5 = GameCard(id="5_diamonds", suit="diamonds", rank="5", value=5)
    
    # Test: Can we capture the build with our 5?
    is_valid = logic.validate_capture(
        hand_card=hand_card_5,
        target_cards=[],
        builds=[build]
    )
    
    print(f"Test 7: Capture build of 5 with 5 in hand")
    print(f"  Hand card: 5")
    print(f"  Build value: 5")
    print(f"  Result: {'PASS ✓' if is_valid else 'FAIL ✗'}")
    print()
    
    assert is_valid, "Capture should be valid: 5 captures build of 5"
    
    # Execute capture
    captured, remaining_builds, remaining_table = logic.execute_capture(
        hand_card=hand_card_5,
        target_cards=[],
        target_builds=[build],
        all_builds=[build],
        player_id=1
    )
    
    print(f"Test 8: Execute capture")
    print(f"  Captured cards: {[c.id for c in captured]}")
    print(f"  Remaining builds: {len(remaining_builds)}")
    print(f"  Result: {'PASS ✓' if len(captured) == 3 else 'FAIL ✗'}")
    print()
    
    # Should capture: hand card (5) + build cards (2, 3) = 3 cards
    assert len(captured) == 3, "Should capture 3 cards (hand card + 2 build cards)"
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("TESTING BUILD FEATURE")
    print("=" * 60)
    print()
    
    all_passed = True
    
    try:
        test_build_with_hand_card_and_table_card()
    except AssertionError as e:
        print(f"FAILED: {e}")
        all_passed = False
    
    try:
        test_build_without_capturing_card()
    except AssertionError as e:
        print(f"FAILED: {e}")
        all_passed = False
    
    try:
        test_build_with_ace_flexibility()
    except AssertionError as e:
        print(f"FAILED: {e}")
        all_passed = False
    
    try:
        test_build_same_value_as_hand_card()
    except AssertionError as e:
        print(f"FAILED: {e}")
        all_passed = False
    
    try:
        test_capture_build()
    except AssertionError as e:
        print(f"FAILED: {e}")
        all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("ALL TESTS PASSED ✓")
    else:
        print("SOME TESTS FAILED ✗")
    print("=" * 60)
