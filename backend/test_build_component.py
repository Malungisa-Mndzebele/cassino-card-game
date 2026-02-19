"""
Test BuildComponent and Build data structures with serialization.
"""

from game_logic import GameCard, BuildComponent, Build


def test_build_component_serialization():
    """Test BuildComponent to_dict and from_dict methods"""
    # Create test cards
    card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    
    # Create component
    component = BuildComponent(
        cards=[card1, card2],
        sum_value=13,
        ace_values_used={}
    )
    
    # Serialize
    component_dict = component.to_dict()
    
    # Verify structure
    assert 'cards' in component_dict
    assert 'sum_value' in component_dict
    assert 'ace_values_used' in component_dict
    assert component_dict['sum_value'] == 13
    assert len(component_dict['cards']) == 2
    
    # Deserialize
    restored_component = BuildComponent.from_dict(component_dict)
    
    # Verify restoration
    assert len(restored_component.cards) == 2
    assert restored_component.sum_value == 13
    assert restored_component.cards[0].id == "5_hearts"
    assert restored_component.cards[1].id == "8_diamonds"
    
    print("✓ BuildComponent serialization test passed")


def test_build_component_with_aces():
    """Test BuildComponent with Ace values tracked"""
    # Create cards including an Ace
    ace = GameCard(id="A_spades", suit="spades", rank="A", value=14)
    card2 = GameCard(id="K_hearts", suit="hearts", rank="K", value=13)
    
    # Create component with Ace used as 14
    component = BuildComponent(
        cards=[ace, card2],
        sum_value=27,
        ace_values_used={"A_spades": 14}
    )
    
    # Serialize and deserialize
    component_dict = component.to_dict()
    restored = BuildComponent.from_dict(component_dict)
    
    # Verify Ace value tracking
    assert restored.ace_values_used["A_spades"] == 14
    assert restored.sum_value == 27
    
    print("✓ BuildComponent with Aces test passed")


def test_single_component_build_backward_compatibility():
    """Test that single-component builds work (backward compatibility)"""
    # Create test cards
    card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    
    # Create legacy-style build (no components)
    build = Build(
        id="build_1",
        cards=[card1, card2],
        value=13,
        owner=1
    )
    
    # Serialize
    build_dict = build.to_dict()
    
    # Verify structure includes new fields with defaults
    assert build_dict['id'] == "build_1"
    assert build_dict['value'] == 13
    assert build_dict['owner'] == 1
    assert len(build_dict['cards']) == 2
    assert build_dict['components'] == []
    assert build_dict['is_multi_component'] == False
    
    # Deserialize
    restored_build = Build.from_dict(build_dict)
    
    # Verify restoration
    assert restored_build.id == "build_1"
    assert restored_build.value == 13
    assert restored_build.owner == 1
    assert len(restored_build.cards) == 2
    assert len(restored_build.components) == 0
    assert restored_build.is_multi_component == False
    
    print("✓ Single-component build backward compatibility test passed")


def test_multi_component_build_serialization():
    """Test multi-component build serialization"""
    # Create cards for first component
    card1 = GameCard(id="5_hearts", suit="hearts", rank="5", value=5)
    card2 = GameCard(id="8_diamonds", suit="diamonds", rank="8", value=8)
    component1 = BuildComponent(cards=[card1, card2], sum_value=13, ace_values_used={})
    
    # Create cards for second component
    card3 = GameCard(id="K_clubs", suit="clubs", rank="K", value=13)
    component2 = BuildComponent(cards=[card3], sum_value=13, ace_values_used={})
    
    # Create multi-component build
    all_cards = [card1, card2, card3]
    build = Build(
        id="build_multi_1",
        cards=all_cards,
        value=13,
        owner=1,
        components=[component1, component2],
        is_multi_component=True
    )
    
    # Serialize
    build_dict = build.to_dict()
    
    # Verify structure
    assert build_dict['id'] == "build_multi_1"
    assert build_dict['value'] == 13
    assert build_dict['owner'] == 1
    assert len(build_dict['cards']) == 3
    assert len(build_dict['components']) == 2
    assert build_dict['is_multi_component'] == True
    
    # Verify component data
    assert build_dict['components'][0]['sum_value'] == 13
    assert len(build_dict['components'][0]['cards']) == 2
    assert build_dict['components'][1]['sum_value'] == 13
    assert len(build_dict['components'][1]['cards']) == 1
    
    # Deserialize
    restored_build = Build.from_dict(build_dict)
    
    # Verify restoration
    assert restored_build.id == "build_multi_1"
    assert restored_build.value == 13
    assert restored_build.owner == 1
    assert len(restored_build.cards) == 3
    assert len(restored_build.components) == 2
    assert restored_build.is_multi_component == True
    assert restored_build.components[0].sum_value == 13
    assert restored_build.components[1].sum_value == 13
    
    print("✓ Multi-component build serialization test passed")


def test_legacy_build_deserialization():
    """Test that old build dictionaries without components field can be deserialized"""
    # Simulate old build dictionary (no components or is_multi_component fields)
    old_build_dict = {
        'id': 'build_old',
        'cards': [
            {'id': '5_hearts', 'suit': 'hearts', 'rank': '5', 'value': 5},
            {'id': '8_diamonds', 'suit': 'diamonds', 'rank': '8', 'value': 8}
        ],
        'value': 13,
        'owner': 1
    }
    
    # Deserialize
    build = Build.from_dict(old_build_dict)
    
    # Verify defaults are applied
    assert build.id == 'build_old'
    assert build.value == 13
    assert build.owner == 1
    assert len(build.cards) == 2
    assert len(build.components) == 0
    assert build.is_multi_component == False
    
    print("✓ Legacy build deserialization test passed")


if __name__ == "__main__":
    test_build_component_serialization()
    test_build_component_with_aces()
    test_single_component_build_backward_compatibility()
    test_multi_component_build_serialization()
    test_legacy_build_deserialization()
    print("\n✅ All BuildComponent and Build data structure tests passed!")
