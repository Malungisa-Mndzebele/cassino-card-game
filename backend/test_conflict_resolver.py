"""
Tests for ConflictResolver

This module tests the conflict detection, resolution, and notification
functionality of the ConflictResolver class.

Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5
"""

import pytest
from datetime import datetime
from conflict_resolver import (
    ConflictResolver,
    GameAction,
    ResolutionResult,
    Conflict
)


class TestConflictDetection:
    """Test conflict detection logic"""
    
    def test_detect_conflict_same_card_within_window(self):
        """Test that actions affecting same card within 100ms are detected as conflicts"""
        resolver = ConflictResolver(conflict_window_ms=100)
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades", "5_diamonds"],
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],  # Same target card
            server_timestamp=1050  # Within 100ms
        )
        
        assert resolver.detect_conflict(action1, action2) is True
    
    def test_no_conflict_different_cards(self):
        """Test that actions affecting different cards don't conflict"""
        resolver = ConflictResolver(conflict_window_ms=100)
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades"],
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["5_diamonds"],  # Different target
            server_timestamp=1050
        )
        
        assert resolver.detect_conflict(action1, action2) is False
    
    def test_no_conflict_outside_window(self):
        """Test that actions outside time window don't conflict"""
        resolver = ConflictResolver(conflict_window_ms=100)
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades"],
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],  # Same target
            server_timestamp=1200  # 200ms later, outside window
        )
        
        assert resolver.detect_conflict(action1, action2) is False
    
    def test_no_conflict_same_player(self):
        """Test that actions from same player don't conflict"""
        resolver = ConflictResolver(conflict_window_ms=100)
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades"],
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=1,  # Same player
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],
            server_timestamp=1050
        )
        
        assert resolver.detect_conflict(action1, action2) is False


class TestConflictResolution:
    """Test conflict resolution logic"""
    
    def test_resolve_accepts_first_action(self):
        """Test that first action by timestamp is accepted"""
        resolver = ConflictResolver()
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades"],
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],
            server_timestamp=1050
        )
        
        # Mock validator that accepts all actions
        class MockValidator:
            pass
        
        result = resolver.resolve(
            current_state=None,
            conflicting_actions=[action2, action1],  # Out of order
            validator=MockValidator()
        )
        
        # First action by timestamp should be accepted
        assert len(result.accepted_actions) >= 1
        assert result.accepted_actions[0].id == "a1"
    
    def test_resolve_sorts_by_timestamp(self):
        """Test that actions are sorted by server timestamp"""
        resolver = ConflictResolver()
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            server_timestamp=3000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            server_timestamp=1000
        )
        
        action3 = GameAction(
            id="a3",
            player_id=1,
            action_type="capture",
            server_timestamp=2000
        )
        
        class MockValidator:
            pass
        
        result = resolver.resolve(
            current_state=None,
            conflicting_actions=[action1, action2, action3],
            validator=MockValidator()
        )
        
        # Should be sorted: a2 (1000), a3 (2000), a1 (3000)
        assert result.accepted_actions[0].id == "a2"
        assert result.accepted_actions[1].id == "a3"
        assert result.accepted_actions[2].id == "a1"


class TestConflictLogging:
    """Test conflict logging functionality"""
    
    def test_log_conflict_stores_in_memory(self):
        """Test that conflicts are stored in memory log"""
        resolver = ConflictResolver()
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            server_timestamp=1050
        )
        
        conflict = Conflict(
            room_id="ABC123",
            action1=action1,
            action2=action2,
            reason="Both players tried to capture same card",
            timestamp=datetime.now()
        )
        
        resolver.log_conflict("ABC123", conflict)
        
        assert len(resolver.conflicts_log) == 1
        assert resolver.conflicts_log[0].room_id == "ABC123"
    
    def test_log_conflict_limits_memory(self):
        """Test that conflict log doesn't grow unbounded"""
        resolver = ConflictResolver()
        
        # Add 1100 conflicts
        for i in range(1100):
            action1 = GameAction(
                id=f"a{i}_1",
                player_id=1,
                action_type="capture",
                server_timestamp=1000
            )
            
            action2 = GameAction(
                id=f"a{i}_2",
                player_id=2,
                action_type="capture",
                server_timestamp=1050
            )
            
            conflict = Conflict(
                room_id="ABC123",
                action1=action1,
                action2=action2,
                reason="Test conflict",
                timestamp=datetime.now()
            )
            
            resolver.log_conflict("ABC123", conflict)
        
        # Should be limited to 1000
        assert len(resolver.conflicts_log) == 1000
    
    def test_get_conflict_stats(self):
        """Test conflict statistics retrieval"""
        resolver = ConflictResolver()
        
        action1 = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            server_timestamp=1000
        )
        
        action2 = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            server_timestamp=1050
        )
        
        conflict = Conflict(
            room_id="ABC123",
            action1=action1,
            action2=action2,
            reason="Test conflict",
            timestamp=datetime.now()
        )
        
        resolver.log_conflict("ABC123", conflict)
        
        stats = resolver.get_conflict_stats()
        
        assert stats["total_conflicts"] == 1
        assert "ABC123" in stats["conflicts_by_room"]
        assert stats["conflicts_by_room"]["ABC123"] == 1


class TestConflictNotification:
    """Test conflict notification functionality"""
    
    def test_create_conflict_notification(self):
        """Test creating a conflict notification message"""
        resolver = ConflictResolver()
        
        rejected_action = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],
            server_timestamp=1050
        )
        
        accepted_action = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades"],
            server_timestamp=1000
        )
        
        notification = resolver.create_conflict_notification(
            rejected_action=rejected_action,
            accepted_action=accepted_action,
            reason="Opponent captured the card first"
        )
        
        assert notification["type"] == "action_rejected"
        assert notification["subtype"] == "conflict"
        assert notification["message"] == "Opponent captured the card first"
        assert notification["rejected_action"]["id"] == "a2"
        assert notification["conflicting_action"]["id"] == "a1"
        assert notification["time_difference_ms"] == 50
    
    def test_notification_includes_action_details(self):
        """Test that notification includes all relevant action details"""
        resolver = ConflictResolver()
        
        rejected_action = GameAction(
            id="a2",
            player_id=2,
            action_type="build",
            card_id="5_hearts",
            target_cards=["2_spades", "3_diamonds"],
            build_value=5,
            server_timestamp=2000
        )
        
        accepted_action = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["2_spades", "3_diamonds"],
            server_timestamp=1900
        )
        
        notification = resolver.create_conflict_notification(
            rejected_action=rejected_action,
            accepted_action=accepted_action,
            reason="Cards were already captured"
        )
        
        # Check rejected action details
        assert notification["rejected_action"]["action_type"] == "build"
        assert notification["rejected_action"]["card_id"] == "5_hearts"
        assert notification["rejected_action"]["target_cards"] == ["2_spades", "3_diamonds"]
        
        # Check conflicting action details
        assert notification["conflicting_action"]["action_type"] == "capture"
        assert notification["conflicting_action"]["player_id"] == 1
        assert notification["conflicting_action"]["card_id"] == "8_clubs"
    
    @pytest.mark.asyncio
    async def test_send_conflict_notification(self):
        """Test sending conflict notification via WebSocket"""
        resolver = ConflictResolver()
        
        rejected_action = GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],
            server_timestamp=1050
        )
        
        accepted_action = GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades"],
            server_timestamp=1000
        )
        
        # Mock WebSocket manager
        class MockWebSocketManager:
            def __init__(self):
                self.sent_messages = []
            
            async def broadcast_to_room(self, data, room_id):
                self.sent_messages.append((data, room_id))
        
        ws_manager = MockWebSocketManager()
        
        success = await resolver.send_conflict_notification(
            websocket_manager=ws_manager,
            player_id=2,
            room_id="ABC123",
            rejected_action=rejected_action,
            accepted_action=accepted_action,
            reason="Opponent played first"
        )
        
        assert success is True
        assert len(ws_manager.sent_messages) == 1
        
        sent_data, sent_room = ws_manager.sent_messages[0]
        assert sent_room == "ABC123"
        assert sent_data["type"] == "action_rejected"
        assert sent_data["subtype"] == "conflict"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
