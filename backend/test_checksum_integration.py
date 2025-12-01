"""
Integration tests for checksum in API responses

Tests that checksums are properly computed and included in game state responses.
"""

import pytest
from models import Room
from main import game_state_to_response
from state_checksum import compute_checksum


def test_game_state_response_includes_checksum():
    """Test that game_state_to_response includes checksum"""
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
        game_completed=False,
        player1_ready=False,
        player2_ready=False
    )
    
    response = game_state_to_response(room)
    
    # Response should include checksum
    assert response.checksum is not None
    assert len(response.checksum) == 64
    assert all(c in '0123456789abcdef' for c in response.checksum.lower())


def test_game_state_response_checksum_matches_computed():
    """Test that response checksum matches independently computed checksum"""
    room = Room(
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
        game_completed=False,
        player1_ready=True,
        player2_ready=True
    )
    
    # Compute checksum independently
    expected_checksum = compute_checksum(room)
    
    # Get response
    response = game_state_to_response(room)
    
    # Checksums should match
    assert response.checksum == expected_checksum


def test_game_state_response_includes_version():
    """Test that game_state_to_response includes version"""
    room = Room(
        id="TEST01",
        version=42,
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
        game_completed=False,
        player1_ready=False,
        player2_ready=False
    )
    
    response = game_state_to_response(room)
    
    # Response should include version
    assert response.version == 42


def test_game_state_response_checksum_changes_with_state():
    """Test that checksum changes when state changes"""
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
        game_completed=False,
        player1_ready=False,
        player2_ready=False
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
        game_completed=False,
        player1_ready=False,
        player2_ready=False
    )
    
    response1 = game_state_to_response(room1)
    response2 = game_state_to_response(room2)
    
    # Checksums should be different
    assert response1.checksum != response2.checksum


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
