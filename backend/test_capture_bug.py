"""
Test for the capture bug where capturing one build incorrectly captures other builds.

Bug scenario:
- Player 1 builds 13 using 8 + 5
- Player 2 builds 14 using 10 + 4
- Player 1 plays Ace (value 1 or 14) to capture the 14-build
- Bug: Both builds were captured instead of just the 14-build
"""

from game_logic import CasinoGameLogic, GameCard, Build


def test_capture_specific_build_with_ace():
    """Test that capturing one build with an Ace doesn't capture other builds"""
    logic = CasinoGameLogic()
    
    # Create cards
    ace = GameCard("ace_hearts", "hearts", "A", 1)
    card_8 = GameCard("8_spades", "spades", "8", 8)
    card_5 = GameCard("5_diamonds", "diamonds", "5", 5)
    card_10 = GameCard("10_clubs", "clubs", "10", 10)
    card_4 = GameCard("4_hearts", "hearts", "4", 4)
    
    # Create builds
    build_13 = Build(
        id="build_13",
        cards=[card_8, card_5],
        value=13,
        owner=1
    )
    
    build_14 = Build(
        id="build_14",
        cards=[card_10, card_4],
        value=14,
        owner=2
    )
    
    all_builds = [build_13, build_14]
    
    # Player 1 captures only the 14-build with an Ace
    target_builds = [build_14]  # Only targeting build_14
    
    print("Before capture:")
    print(f"  All builds: {[b.id for b in all_builds]}")
    print(f"  Target builds: {[b.id for b in target_builds]}")
    print(f"  Hand card: {ace.id} (Ace, values: 1 or 14)")
    
    # Execute capture
    captured_cards, remaining_builds, _ = logic.execute_capture(
        hand_card=ace,
        target_cards=[],
        target_builds=target_builds,
        all_builds=all_builds,
        player_id=1
    )
    
    print("\nAfter capture:")
    print(f"  Captured cards: {[c.id for c in captured_cards]}")
    print(f"  Remaining builds: {[b.id for b in remaining_builds]}")
    
    # Verify results
    assert len(remaining_builds) == 1, f"Expected 1 remaining build, got {len(remaining_builds)}"
    assert remaining_builds[0].id == "build_13", f"Expected build_13 to remain, got {remaining_builds[0].id}"
    
    # Verify captured cards include the Ace and cards from build_14
    captured_ids = [c.id for c in captured_cards]
    assert "ace_hearts" in captured_ids, "Ace should be in captured cards"
    assert "10_clubs" in captured_ids, "10 from build_14 should be captured"
    assert "4_hearts" in captured_ids, "4 from build_14 should be captured"
    assert "8_spades" not in captured_ids, "8 from build_13 should NOT be captured"
    assert "5_diamonds" not in captured_ids, "5 from build_13 should NOT be captured"
    
    print("\n✓ Test PASSED: Only the targeted build was captured")


def test_capture_multiple_builds():
    """Test that we can capture multiple builds when explicitly targeting them"""
    logic = CasinoGameLogic()
    
    # Create cards
    card_7 = GameCard("7_hearts", "hearts", "7", 7)
    card_3a = GameCard("3_spades", "spades", "3", 3)
    card_4a = GameCard("4_diamonds", "diamonds", "4", 4)
    card_2 = GameCard("2_clubs", "clubs", "2", 2)
    card_5 = GameCard("5_hearts", "hearts", "5", 5)
    
    # Create two builds with value 7
    build_7a = Build(
        id="build_7a",
        cards=[card_3a, card_4a],
        value=7,
        owner=1
    )
    
    build_7b = Build(
        id="build_7b",
        cards=[card_2, card_5],
        value=7,
        owner=1
    )
    
    all_builds = [build_7a, build_7b]
    
    # Player captures BOTH builds with a 7
    target_builds = [build_7a, build_7b]  # Targeting both
    
    print("\nTest: Capture multiple builds")
    print(f"  All builds: {[b.id for b in all_builds]}")
    print(f"  Target builds: {[b.id for b in target_builds]}")
    
    # Execute capture
    captured_cards, remaining_builds, _ = logic.execute_capture(
        hand_card=card_7,
        target_cards=[],
        target_builds=target_builds,
        all_builds=all_builds,
        player_id=1
    )
    
    print(f"  Captured cards: {[c.id for c in captured_cards]}")
    print(f"  Remaining builds: {[b.id for b in remaining_builds]}")
    
    # Verify results
    assert len(remaining_builds) == 0, f"Expected 0 remaining builds, got {len(remaining_builds)}"
    assert len(captured_cards) == 5, f"Expected 5 captured cards (7 + 4 from builds), got {len(captured_cards)}"
    
    print("✓ Test PASSED: Both targeted builds were captured")


if __name__ == "__main__":
    test_capture_specific_build_with_ace()
    test_capture_multiple_builds()
    print("\n✅ All tests passed!")
