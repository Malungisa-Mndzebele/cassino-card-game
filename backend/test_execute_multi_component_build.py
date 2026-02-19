"""
Test execute_multi_component_build() method in CasinoGameLogic.

This test validates:
- Creating BuildComponent objects for each component with ace_values_used
- Flattening all component cards into build.cards list
- Generating unique build ID
- Handling augmentation: merge with existing build components
- Returning tuple of (remaining_table_cards, new_build)
"""

from game_logic import CasinoGameLogic, GameCard, Build, BuildComponent


def test_execute_basic_two_component_build():
    """Test creating a basic 2-component build"""
    logic = CasinoGameLogic()
    
    # Create cards for first component (5 + 8 = 13)
    card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    component1 = [card1, card2]
    
    # Create cards for second component (K = 13)
    card3 = GameCard(id="K_clubs", suit="clubs", rank="K", value=13)
    component2 = [card3]
    
    # Execute build
    remaining_cards, new_build = logic.execute_multi_component_build(
        hand_card=card3,
        components=[component1, component2],
        build_value=13,
        player_id=1
    )
    
    # Verify build structure
    assert new_build.value == 13
    assert new_build.owner == 1
    assert new_build.is_multi_component == True
    assert len(new_build.components) == 2
    
    # Verify flattened cards list
    assert len(new_build.cards) == 3
    card_ids = {card.id for card in new_build.cards}
    assert "5_hearts" in card_ids
    assert "8_diamonds" in card_ids
    assert "K_clubs" in card_ids
    
    # Verify components
    assert new_build.components[0].sum_value == 13
    assert len(new_build.components[0].cards) == 2
    assert new_build.components[1].sum_value == 13
    assert len(new_build.components[1].cards) == 1
    
    # Verify build ID is unique
    assert "build_1" in new_build.id
    assert "13" in new_build.id
    
    print("✓ Basic two-component build test passed")


def test_execute_three_component_build():
    """Test creating a 3-component build"""
    logic = CasinoGameLogic()
    
    # Component 1: 2 + 4 = 6
    comp1 = [
        GameCard(id="2_hearts", suit="hearts", rank="2", value=2),
        GameCard(id="4_diamonds", suit="diamonds", rank="4", value=4)
    ]
    
    # Component 2: 3 + 3 = 6
    comp2 = [
        GameCard(id="3_spades", suit="spades", rank="3", value=3),
        GameCard(id="3_clubs", suit="clubs", rank="3", value=3)
    ]
    
    # Component 3: 6
    hand_card = GameCard(id="6_hearts", suit="hearts", rank="6", value=6)
    comp3 = [hand_card]
    
    # Execute build
    remaining_cards, new_build = logic.execute_multi_component_build(
        hand_card=hand_card,
        components=[comp1, comp2, comp3],
        build_value=6,
        player_id=2
    )
    
    # Verify build structure
    assert new_build.value == 6
    assert new_build.owner == 2
    assert new_build.is_multi_component == True
    assert len(new_build.components) == 3
    
    # Verify all cards are included
    assert len(new_build.cards) == 5
    
    # Verify each component
    for component in new_build.components:
        assert component.sum_value == 6
    
    print("✓ Three-component build test passed")


def test_execute_build_with_aces():
    """Test creating a build with Aces that have tracked values"""
    logic = CasinoGameLogic()
    
    # Component 1: A (as 1) + 3 = 4
    ace1 = GameCard(id="A_spades", suit="spades", rank="A", value=1)
    card1 = GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    comp1 = [ace1, card1]
    
    # Component 2: 4
    hand_card = GameCard(id="4_diamonds", suit="diamonds", rank="4", value=4)
    comp2 = [hand_card]
    
    # Execute build
    remaining_cards, new_build = logic.execute_multi_component_build(
        hand_card=hand_card,
        components=[comp1, comp2],
        build_value=4,
        player_id=1
    )
    
    # Verify build created
    assert new_build.value == 4
    assert len(new_build.components) == 2
    
    # Verify Ace value is tracked in first component
    assert "A_spades" in new_build.components[0].ace_values_used
    assert new_build.components[0].ace_values_used["A_spades"] in [1, 14]
    
    print("✓ Build with Aces test passed")


def test_execute_build_augmentation():
    """Test augmenting an existing build with new components"""
    logic = CasinoGameLogic()
    
    # Create existing build with one component
    existing_card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    existing_card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    existing_component = BuildComponent(
        cards=[existing_card1, existing_card2],
        sum_value=13,
        ace_values_used={}
    )
    existing_build = Build(
        id="build_1_2_13",
        cards=[existing_card1, existing_card2],
        value=13,
        owner=1,
        components=[existing_component],
        is_multi_component=False
    )
    
    # Create new component to add (K = 13)
    hand_card = GameCard(id="K_clubs", suit="clubs", rank="K", value=13)
    new_comp = [hand_card]
    
    # Execute augmentation
    remaining_cards, augmented_build = logic.execute_multi_component_build(
        hand_card=hand_card,
        components=[new_comp],
        build_value=13,
        player_id=2,
        target_builds=[existing_build]
    )
    
    # Verify augmented build
    assert augmented_build.value == 13
    assert augmented_build.owner == 2  # Owner changes to augmenting player
    assert augmented_build.is_multi_component == True
    
    # Verify components merged (1 existing + 1 new = 2 total)
    assert len(augmented_build.components) == 2
    
    # Verify all cards included
    assert len(augmented_build.cards) == 3
    card_ids = {card.id for card in augmented_build.cards}
    assert "5_hearts" in card_ids
    assert "8_diamonds" in card_ids
    assert "K_clubs" in card_ids
    
    # Verify build ID indicates augmentation
    assert "_aug" in augmented_build.id
    
    print("✓ Build augmentation test passed")


def test_execute_augmentation_with_multiple_new_components():
    """Test augmenting a build by adding multiple new components at once"""
    logic = CasinoGameLogic()
    
    # Create existing build
    existing_card = GameCard(id="6_hearts", suit="hearts", rank="6", value=6)
    existing_component = BuildComponent(
        cards=[existing_card],
        sum_value=6,
        ace_values_used={}
    )
    existing_build = Build(
        id="build_1_1_6",
        cards=[existing_card],
        value=6,
        owner=1,
        components=[existing_component],
        is_multi_component=False
    )
    
    # Create two new components to add
    hand_card = GameCard(id="2_spades", suit="spades", rank="2", value=2)
    comp1 = [
        hand_card,
        GameCard(id="4_diamonds", suit="diamonds", rank="4", value=4)
    ]
    comp2 = [
        GameCard(id="3_clubs", suit="clubs", rank="3", value=3),
        GameCard(id="3_hearts", suit="hearts", rank="3", value=3)
    ]
    
    # Execute augmentation with multiple new components
    remaining_cards, augmented_build = logic.execute_multi_component_build(
        hand_card=hand_card,
        components=[comp1, comp2],
        build_value=6,
        player_id=2,
        target_builds=[existing_build]
    )
    
    # Verify augmented build has all components (1 existing + 2 new = 3 total)
    assert len(augmented_build.components) == 3
    assert augmented_build.value == 6
    assert augmented_build.owner == 2
    
    # Verify all cards included (1 + 2 + 2 = 5 cards)
    assert len(augmented_build.cards) == 5
    
    print("✓ Augmentation with multiple new components test passed")


def test_execute_augmentation_with_legacy_build():
    """Test augmenting a legacy build (no components field)"""
    logic = CasinoGameLogic()
    
    # Create legacy build (no components)
    legacy_card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    legacy_card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    legacy_build = Build(
        id="build_legacy",
        cards=[legacy_card1, legacy_card2],
        value=13,
        owner=1,
        components=[],  # Empty components (legacy)
        is_multi_component=False
    )
    
    # Create new component to add
    hand_card = GameCard(id="K_clubs", suit="clubs", rank="K", value=13)
    new_comp = [hand_card]
    
    # Execute augmentation
    remaining_cards, augmented_build = logic.execute_multi_component_build(
        hand_card=hand_card,
        components=[new_comp],
        build_value=13,
        player_id=2,
        target_builds=[legacy_build]
    )
    
    # Verify legacy build cards are converted to a component
    assert len(augmented_build.components) == 2
    
    # First component should be the legacy build's cards
    assert len(augmented_build.components[0].cards) == 1  # New component
    assert len(augmented_build.components[1].cards) == 2  # Legacy build converted
    
    # Verify all cards included
    assert len(augmented_build.cards) == 3
    
    print("✓ Augmentation with legacy build test passed")


def test_execute_build_unique_ids():
    """Test that build IDs follow expected format"""
    logic = CasinoGameLogic()
    
    # Create first build with 1 card
    hand_card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    comp1 = [hand_card1]
    _, build1 = logic.execute_multi_component_build(
        hand_card=hand_card1,
        components=[comp1],
        build_value=5,
        player_id=1
    )
    
    # Create second build with 2 cards (different card count)
    hand_card2 = GameCard(id="3_diamonds", suit="diamonds", rank="3", value=3)
    card2 = GameCard(id="2_clubs", suit="clubs", rank="2", value=2)
    comp2 = [hand_card2, card2]
    _, build2 = logic.execute_multi_component_build(
        hand_card=hand_card2,
        components=[comp2],
        build_value=5,
        player_id=1
    )
    
    # IDs should be different because card count differs
    assert build1.id != build2.id
    
    # Verify ID format includes player, card count, and value
    assert "build_1" in build1.id
    assert "5" in build1.id
    assert "build_1" in build2.id
    assert "5" in build2.id
    
    print("✓ Build ID format test passed")


def test_execute_returns_empty_remaining_cards():
    """Test that execute returns empty list for remaining_table_cards"""
    logic = CasinoGameLogic()
    
    hand_card = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    comp = [hand_card]
    
    remaining_cards, new_build = logic.execute_multi_component_build(
        hand_card=hand_card,
        components=[comp],
        build_value=5,
        player_id=1
    )
    
    # Remaining cards should be empty (caller handles card removal)
    assert remaining_cards == []
    
    print("✓ Empty remaining cards test passed")


if __name__ == "__main__":
    test_execute_basic_two_component_build()
    test_execute_three_component_build()
    test_execute_build_with_aces()
    test_execute_build_augmentation()
    test_execute_augmentation_with_multiple_new_components()
    test_execute_augmentation_with_legacy_build()
    test_execute_build_unique_ids()
    test_execute_returns_empty_remaining_cards()
    print("\n✅ All execute_multi_component_build() tests passed!")
