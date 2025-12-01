"""
Tests for Turn Validation

Tests the turn order validation, violation tracking, and turn switching logic.
"""

import pytest
from validators import (
    validate_turn_order,
    validate_turn_complete,
    get_next_turn,
    reset_turn_violations,
    get_turn_violation_count,
    TurnViolationTracker
)


class TestTurnOrderValidation:
    """Test turn order validation (Requirement 11.3)"""
    
    def test_valid_turn_player1(self):
        """Player 1 can act when it's their turn"""
        is_valid, error = validate_turn_order("ROOM01", 1, 1, "capture")
        assert is_valid is True
        assert error is None
    
    def test_valid_turn_player2(self):
        """Player 2 can act when it's their turn"""
        is_valid, error = validate_turn_order("ROOM02", 2, 2, "build")
        assert is_valid is True
        assert error is None
    
    def test_invalid_turn_player1(self):
        """Player 1 cannot act when it's player 2's turn"""
        is_valid, error = validate_turn_order("ROOM03", 1, 2, "capture")
        assert is_valid is False
        assert error == "Not your turn"
    
    def test_invalid_turn_player2(self):
        """Player 2 cannot act when it's player 1's turn"""
        is_valid, error = validate_turn_order("ROOM04", 2, 1, "trail")
        assert is_valid is False
        assert error == "Not your turn"
    
    def test_violation_tracking(self):
        """Violations are tracked for security monitoring"""
        room_id = "ROOM05"
        player_id = 2
        
        # Reset violations first
        reset_turn_violations(room_id, player_id)
        
        # First violation
        validate_turn_order(room_id, player_id, 1, "capture")
        assert get_turn_violation_count(room_id, player_id) == 1
        
        # Second violation
        validate_turn_order(room_id, player_id, 1, "build")
        assert get_turn_violation_count(room_id, player_id) == 2
        
        # Third violation
        validate_turn_order(room_id, player_id, 1, "trail")
        assert get_turn_violation_count(room_id, player_id) == 3
    
    def test_violation_tracking_separate_rooms(self):
        """Violations are tracked separately per room"""
        room1 = "ROOM06"
        room2 = "ROOM07"
        player_id = 1
        
        # Reset violations
        reset_turn_violations(room1, player_id)
        reset_turn_violations(room2, player_id)
        
        # Violate in room1
        validate_turn_order(room1, player_id, 2, "capture")
        assert get_turn_violation_count(room1, player_id) == 1
        assert get_turn_violation_count(room2, player_id) == 0
        
        # Violate in room2
        validate_turn_order(room2, player_id, 2, "build")
        assert get_turn_violation_count(room1, player_id) == 1
        assert get_turn_violation_count(room2, player_id) == 1
    
    def test_violation_tracking_separate_players(self):
        """Violations are tracked separately per player"""
        room_id = "ROOM08"
        
        # Reset violations
        reset_turn_violations(room_id)
        
        # Player 1 violates
        validate_turn_order(room_id, 1, 2, "capture")
        assert get_turn_violation_count(room_id, 1) == 1
        assert get_turn_violation_count(room_id, 2) == 0
        
        # Player 2 violates
        validate_turn_order(room_id, 2, 1, "build")
        assert get_turn_violation_count(room_id, 1) == 1
        assert get_turn_violation_count(room_id, 2) == 1


class TestTurnCompletion:
    """Test turn completion validation (Requirement 11.1)"""
    
    def test_capture_completes_turn(self):
        """Capture action completes a turn"""
        is_complete, error = validate_turn_complete("ROOM09", 1, "capture", "round1")
        assert is_complete is True
        assert error is None
    
    def test_build_completes_turn(self):
        """Build action completes a turn"""
        is_complete, error = validate_turn_complete("ROOM10", 2, "build", "round2")
        assert is_complete is True
        assert error is None
    
    def test_trail_completes_turn(self):
        """Trail action completes a turn"""
        is_complete, error = validate_turn_complete("ROOM11", 1, "trail", "round1")
        assert is_complete is True
        assert error is None
    
    def test_ready_does_not_complete_turn(self):
        """Ready action does not complete a turn"""
        is_complete, error = validate_turn_complete("ROOM12", 1, "ready", "waiting")
        assert is_complete is False
        assert "does not complete a turn" in error
    
    def test_shuffle_does_not_complete_turn(self):
        """Shuffle action does not complete a turn"""
        is_complete, error = validate_turn_complete("ROOM13", 2, "shuffle", "dealer")
        assert is_complete is False
        assert "does not complete a turn" in error


class TestTurnSwitching:
    """Test turn switching logic (Requirement 11.2)"""
    
    def test_switch_from_player1_to_player2(self):
        """Turn switches from player 1 to player 2"""
        next_turn = get_next_turn(1)
        assert next_turn == 2
    
    def test_switch_from_player2_to_player1(self):
        """Turn switches from player 2 to player 1"""
        next_turn = get_next_turn(2)
        assert next_turn == 1
    
    def test_turn_alternates(self):
        """Turns alternate between players"""
        turn = 1
        turn = get_next_turn(turn)
        assert turn == 2
        turn = get_next_turn(turn)
        assert turn == 1
        turn = get_next_turn(turn)
        assert turn == 2


class TestViolationReset:
    """Test violation tracking reset functionality"""
    
    def test_reset_specific_player(self):
        """Reset violations for specific player"""
        room_id = "ROOM14"
        
        # Create violations for both players
        validate_turn_order(room_id, 1, 2, "capture")
        validate_turn_order(room_id, 2, 1, "build")
        
        assert get_turn_violation_count(room_id, 1) == 1
        assert get_turn_violation_count(room_id, 2) == 1
        
        # Reset player 1 only
        reset_turn_violations(room_id, 1)
        
        assert get_turn_violation_count(room_id, 1) == 0
        assert get_turn_violation_count(room_id, 2) == 1
    
    def test_reset_all_players_in_room(self):
        """Reset violations for all players in room"""
        room_id = "ROOM15"
        
        # Create violations for both players
        validate_turn_order(room_id, 1, 2, "capture")
        validate_turn_order(room_id, 2, 1, "build")
        
        assert get_turn_violation_count(room_id, 1) == 1
        assert get_turn_violation_count(room_id, 2) == 1
        
        # Reset all players
        reset_turn_violations(room_id)
        
        assert get_turn_violation_count(room_id, 1) == 0
        assert get_turn_violation_count(room_id, 2) == 0
    
    def test_reset_does_not_affect_other_rooms(self):
        """Resetting one room doesn't affect others"""
        room1 = "ROOM16"
        room2 = "ROOM17"
        
        # Create violations in both rooms
        validate_turn_order(room1, 1, 2, "capture")
        validate_turn_order(room2, 1, 2, "build")
        
        assert get_turn_violation_count(room1, 1) == 1
        assert get_turn_violation_count(room2, 1) == 1
        
        # Reset room1 only
        reset_turn_violations(room1)
        
        assert get_turn_violation_count(room1, 1) == 0
        assert get_turn_violation_count(room2, 1) == 1


class TestViolationTracker:
    """Test the TurnViolationTracker class directly"""
    
    def test_tracker_initialization(self):
        """Tracker initializes with empty state"""
        tracker = TurnViolationTracker()
        assert tracker.get_violation_count("ANY_ROOM", 1) == 0
    
    def test_tracker_records_violations(self):
        """Tracker records violations correctly"""
        tracker = TurnViolationTracker()
        
        count1 = tracker.record_violation("ROOM18", 1)
        assert count1 == 1
        
        count2 = tracker.record_violation("ROOM18", 1)
        assert count2 == 2
        
        count3 = tracker.record_violation("ROOM18", 1)
        assert count3 == 3
    
    def test_tracker_separate_tracking(self):
        """Tracker maintains separate counts per room and player"""
        tracker = TurnViolationTracker()
        
        tracker.record_violation("ROOM19", 1)
        tracker.record_violation("ROOM19", 2)
        tracker.record_violation("ROOM20", 1)
        
        assert tracker.get_violation_count("ROOM19", 1) == 1
        assert tracker.get_violation_count("ROOM19", 2) == 1
        assert tracker.get_violation_count("ROOM20", 1) == 1
        assert tracker.get_violation_count("ROOM20", 2) == 0


class TestIntegration:
    """Integration tests for complete turn validation flow"""
    
    def test_complete_turn_flow(self):
        """Test complete turn validation and switching flow"""
        room_id = "ROOM21"
        reset_turn_violations(room_id)
        
        current_turn = 1
        
        # Player 1's turn - valid action
        is_valid, error = validate_turn_order(room_id, 1, current_turn, "capture")
        assert is_valid is True
        
        # Verify turn completes
        is_complete, error = validate_turn_complete(room_id, 1, "capture", "round1")
        assert is_complete is True
        
        # Switch turn
        current_turn = get_next_turn(current_turn)
        assert current_turn == 2
        
        # Player 2's turn - valid action
        is_valid, error = validate_turn_order(room_id, 2, current_turn, "build")
        assert is_valid is True
        
        # Verify turn completes
        is_complete, error = validate_turn_complete(room_id, 2, "build", "round1")
        assert is_complete is True
        
        # Switch turn back
        current_turn = get_next_turn(current_turn)
        assert current_turn == 1
    
    def test_out_of_turn_rejection(self):
        """Test that out-of-turn actions are properly rejected"""
        room_id = "ROOM22"
        reset_turn_violations(room_id)
        
        current_turn = 1
        
        # Player 2 tries to act on player 1's turn
        is_valid, error = validate_turn_order(room_id, 2, current_turn, "capture")
        assert is_valid is False
        assert error == "Not your turn"
        
        # Violation is recorded
        assert get_turn_violation_count(room_id, 2) == 1
        
        # Player 1 can still act
        is_valid, error = validate_turn_order(room_id, 1, current_turn, "capture")
        assert is_valid is True
    
    def test_multiple_violations_logged(self):
        """Test that multiple violations are properly logged"""
        room_id = "ROOM23"
        reset_turn_violations(room_id)
        
        current_turn = 1
        
        # Player 2 tries multiple times
        for i in range(5):
            is_valid, error = validate_turn_order(room_id, 2, current_turn, "capture")
            assert is_valid is False
            assert get_turn_violation_count(room_id, 2) == i + 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
