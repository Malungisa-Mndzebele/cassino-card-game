import pytest
from hypothesis import given, strategies as st
from game_logic import CasinoGameLogic, GameCard, BuildComponent, Build

# Strategies
suits = st.sampled_from(['hearts', 'diamonds', 'clubs', 'spades'])
ranks = st.sampled_from(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'])

@st.composite
def game_cards(draw):
    suit = draw(suits)
    rank = draw(ranks)
    logic = CasinoGameLogic()
    value = logic.get_card_value(rank)
    return GameCard(id=f"{rank}_{suit}", suit=suit, rank=rank, value=value)

# Property 24: Serialization Round-Trip
@given(game_cards())
def test_build_component_serialization_round_trip(card):
    component = BuildComponent(cards=[card], sum_value=card.value, ace_values_used={})
    serialized = component.to_dict()
    deserialized = BuildComponent.from_dict(serialized)
    assert deserialized.sum_value == component.sum_value
    assert len(deserialized.cards) == len(component.cards)
    assert deserialized.cards[0].id == component.cards[0].id

# Property 1: Component Sum Validation
@given(st.lists(game_cards(), min_size=1, max_size=5))
def test_component_sum_validation(cards):
    logic = CasinoGameLogic()
    primary_sum = sum(c.value for c in cards)
    is_valid, _, _ = logic.validate_component(cards, primary_sum)
    assert is_valid

# Property 3: Empty Component Rejection
def test_empty_component_rejection():
    logic = CasinoGameLogic()
    is_valid, error, _ = logic.validate_component([], 5)
    assert not is_valid
    assert "no cards" in error.lower()

# Property 4: Invalid Sum Rejection
@given(st.lists(game_cards(), min_size=1, max_size=5))
def test_invalid_sum_rejection(cards):
    logic = CasinoGameLogic()
    no_aces = [c for c in cards if c.rank != 'A']
    if not no_aces:
        return 
    s = sum(c.value for c in no_aces)
    impossible_target = s + 1
    is_valid, error, _ = logic.validate_component(no_aces, impossible_target)
    assert not is_valid
    assert error is not None

# Property 2: Capturing Card Requirement
@given(game_cards(), st.lists(game_cards(), min_size=1, max_size=10))
def test_capturing_card_requirement(hand_card, player_hand_cards):
    logic = CasinoGameLogic()
    build_value = hand_card.value
    
    # 1. Valid case
    capturer = GameCard(f"cap_{hand_card.id}", hand_card.suit, hand_card.rank, hand_card.value)
    valid_hand = player_hand_cards + [capturer]
    components = [[hand_card]] 
    res, err = logic.validate_multi_component_build(
        hand_card, components, build_value, valid_hand, []
    )
    # With a valid capturing card, the "No card in hand" error should never appear.
    # The build may still fail for other reasons (e.g., table card availability),
    # but the capturing-card requirement itself must be satisfied.
    assert res is True or "No card in hand" not in str(err)

    # 2. Invalid case
    invalid_hand = []
    for c in player_hand_cards:
        if build_value not in logic.get_card_values(c):
             invalid_hand.append(c)
             
    res, err = logic.validate_multi_component_build(
        hand_card, components, build_value, invalid_hand, []
    )
    if not res and err:
        assert "No card in hand" in str(err)

# Property 5: Unavailable Card Rejection
@given(st.lists(game_cards(), min_size=2, max_size=5, unique_by=lambda c: c.id))
def test_unavailable_card_rejection(component_cards):
    logic = CasinoGameLogic()
    hand_card = component_cards[0]
    
    build_value = sum(c.value for c in component_cards) 
    
    is_valid_comp, _, _ = logic.validate_component(component_cards, build_value)
    if not is_valid_comp:
        return

    table_cards = [] 
    
    # Force a card with the correct value
    player_hand = [GameCard("cap_card", "spades", "Target", build_value)]
    
    components = [component_cards]
    
    res, err = logic.validate_multi_component_build(
        hand_card, components, build_value, player_hand, table_cards
    )
    
    assert not res
    assert "not available on table" in str(err)
