"""
Tests for State Checksum Module

Tests checksum computation, validation, and integration with game state.
"""

import pytest
from models import Room
from state_checksum import compute_checksum, validate_checksum, compute_checksum_from_dict


def test_compute_checksum_basic():
    """Test basic checksum computation"""
    room = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    checksum = compute_checksum(room)
    
    # Checksum should be 64-character hex string
    assert len(checksum) == 64
    assert all(c in '0123456789abcdef' for c in checksum.lower())


def test_compute_checksum_deterministic():
    """Test that same state produces same checksum"""
    room1 = Room(
        id="TEST01",
        version=5,
        game_phase="round2",
        current_turn=2,
        round_number=2,
        player1_score=3,
        player2_score=2,
        deck=[],
        player1_hand=[{"id": "A_hearts", "suit": "hearts", "rank": "A", "value": 14}],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=True,
        card_selection_complete=True,
        dealing_complete=True,
        game_started=True,
        game_completed=False
    )
    
    room2 = Room(
        id="TEST02",  # Different ID shouldn't affect checksum
        version=5,
        game_phase="round2",
        current_turn=2,
        round_number=2,
        player1_score=3,
        player2_score=2,
        deck=[],
        player1_hand=[{"id": "A_hearts", "suit": "hearts", "rank": "A", "value": 14}],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=True,
        card_selection_complete=True,
        dealing_complete=True,
        game_started=True,
        game_completed=False
    )
    
    checksum1 = compute_checksum(room1)
    checksum2 = compute_checksum(room2)
    
    # Same state should produce same checksum
    assert checksum1 == checksum2


def test_compute_checksum_different_states():
    """Test that different states produce different checksums"""
    room1 = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    room2 = Room(
        id="TEST01",
        version=2,  # Different version
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    checksum1 = compute_checksum(room1)
    checksum2 = compute_checksum(room2)
    
    # Different states should produce different checksums
    assert checksum1 != checksum2


def test_compute_checksum_card_count_changes():
    """Test that card count changes affect checksum"""
    room1 = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[{"id": "A_hearts", "suit": "hearts", "rank": "A", "value": 14}],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    room2 = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[
            {"id": "A_hearts", "suit": "hearts", "rank": "A", "value": 14},
            {"id": "2_hearts", "suit": "hearts", "rank": "2", "value": 2}
        ],  # Different card count
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    checksum1 = compute_checksum(room1)
    checksum2 = compute_checksum(room2)
    
    # Different card counts should produce different checksums
    assert checksum1 != checksum2


def test_validate_checksum_valid():
    """Test checksum validation with valid checksum"""
    room = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    checksum = compute_checksum(room)
    
    # Validation should succeed with correct checksum
    assert validate_checksum(room, checksum) is True


def test_validate_checksum_invalid():
    """Test checksum validation with invalid checksum"""
    room = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    invalid_checksum = "0" * 64
    
    # Validation should fail with incorrect checksum
    assert validate_checksum(room, invalid_checksum) is False


def test_validate_checksum_empty():
    """Test checksum validation with empty checksum"""
    room = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    # Validation should fail with empty checksum
    assert validate_checksum(room, "") is False
    assert validate_checksum(room, None) is False


def test_compute_checksum_from_dict():
    """Test checksum computation from dictionary"""
    state_dict = {
        "version": 5,
        "phase": "round1",
        "current_turn": 1,
        "round": 1,
        "player1_score": 3,
        "player2_score": 2,
        "deck": [],
        "player1_hand": [{"id": "A_hearts"}],
        "player2_hand": [],
        "table_cards": [],
        "builds": [],
        "player1_captured": [],
        "player2_captured": [],
        "shuffle_complete": True,
        "card_selection_complete": True,
        "dealing_complete": True,
        "game_started": True,
        "game_completed": False
    }
    
    checksum = compute_checksum_from_dict(state_dict)
    
    # Checksum should be 64-character hex string
    assert len(checksum) == 64
    assert all(c in '0123456789abcdef' for c in checksum.lower())


def test_compute_checksum_from_dict_matches_room():
    """Test that dict checksum matches room checksum for same state"""
    room = Room(
        id="TEST01",
        version=5,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=3,
        player2_score=2,
        deck=[],
        player1_hand=[{"id": "A_hearts"}],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=True,
        card_selection_complete=True,
        dealing_complete=True,
        game_started=True,
        game_completed=False
    )
    
    state_dict = {
        "version": 5,
        "phase": "round1",
        "current_turn": 1,
        "round": 1,
        "player1_score": 3,
        "player2_score": 2,
        "deck": [],
        "player1_hand": [{"id": "A_hearts"}],
        "player2_hand": [],
        "table_cards": [],
        "builds": [],
        "player1_captured": [],
        "player2_captured": [],
        "shuffle_complete": True,
        "card_selection_complete": True,
        "dealing_complete": True,
        "game_started": True,
        "game_completed": False
    }
    
    room_checksum = compute_checksum(room)
    dict_checksum = compute_checksum_from_dict(state_dict)
    
    # Both methods should produce same checksum for same state
    assert room_checksum == dict_checksum


def test_checksum_case_insensitive():
    """Test that checksum validation is case-insensitive"""
    room = Room(
        id="TEST01",
        version=1,
        game_phase="round1",
        current_turn=1,
        round_number=1,
        player1_score=0,
        player2_score=0,
        deck=[],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        shuffle_complete=False,
        card_selection_complete=False,
        dealing_complete=False,
        game_started=True,
        game_completed=False
    )
    
    checksum = compute_checksum(room)
    checksum_upper = checksum.upper()
    
    # Validation should work with uppercase checksum
    assert validate_checksum(room, checksum_upper) is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
