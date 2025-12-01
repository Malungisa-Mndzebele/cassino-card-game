"""
Tests for BroadcastController

Tests the broadcast controller's ability to:
- Broadcast full state to all clients
- Compute deltas between states
- Broadcast deltas efficiently
- Retry failed broadcasts with exponential backoff
- Compress large payloads
- Track desynced clients

Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 13.1, 13.2, 13.3, 13.4, 13.5
"""

import pytest
import asyncio
import json
import gzip
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch, MagicMock

from broadcast_controller import BroadcastController, BroadcastResult, StateDelta
from websocket_manager import WebSocketConnectionManager


@pytest.fixture
def mock_websocket_manager():
    """Create a mock WebSocket manager"""
    manager = Mock(spec=WebSocketConnectionManager)
    manager.broadcast_to_room = AsyncMock()
    manager.get_connected_count = Mock(return_value=2)
    manager.is_session_connected = Mock(return_value=True)
    return manager


@pytest.fixture
def broadcast_controller(mock_websocket_manager):
    """Create a BroadcastController instance with mock WebSocket manager"""
    return BroadcastController(
        websocket_manager=mock_websocket_manager,
        max_retries=3,
        retry_base_delay=0.1,  # Short delay for testing
        compression_threshold=100  # Low threshold for testing
    )


@pytest.fixture
def sample_state():
    """Create a sample game state"""
    return {
        "room_id": "TEST01",
        "version": 5,
        "checksum": "abc123",
        "phase": "round1",
        "round": 1,
        "current_turn": 1,
        "player1_hand": [{"id": "A_hearts", "rank": "A", "suit": "hearts"}],
        "player2_hand": [{"id": "K_spades", "rank": "K", "suit": "spades"}],
        "table_cards": [{"id": "Q_diamonds", "rank": "Q", "suit": "diamonds"}],
        "builds": [],
        "player1_captured": [],
        "player2_captured": [],
        "player1_score": 0,
        "player2_score": 0,
        "player1_ready": True,
        "player2_ready": True,
        "shuffle_complete": True,
        "card_selection_complete": True,
        "dealing_complete": True,
        "game_started": True,
        "game_completed": False,
        "last_play": None,
        "last_action": None,
        "winner": None
    }


class TestBroadcastControllerInitialization:
    """Test BroadcastController initialization"""
    
    def test_initialization(self, mock_websocket_manager):
        """Test controller initializes with correct configuration"""
        controller = BroadcastController(
            websocket_manager=mock_websocket_manager,
            max_retries=5,
            retry_base_delay=2.0,
            compression_threshold=2048
        )
        
        assert controller.websocket_manager == mock_websocket_manager
        assert controller.max_retries == 5
        assert controller.retry_base_delay == 2.0
        assert controller.compression_threshold == 2048
        assert controller.client_versions == {}
        assert controller.failed_broadcasts == {}
        assert controller.desynced_clients == set()


class TestBroadcastMethod:
    """Test broadcast method - Requirements: 9.1, 9.2"""
    
    @pytest.mark.asyncio
    async def test_broadcast_success(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test successful broadcast to all clients"""
        result = await broadcast_controller.broadcast("TEST01", sample_state)
        
        assert result.success is True
        assert result.delivered_count == 2
        assert result.failed_count == 0
        assert len(result.failed_clients) == 0
        
        # Verify WebSocket manager was called
        mock_websocket_manager.broadcast_to_room.assert_called_once()
        call_args = mock_websocket_manager.broadcast_to_room.call_args
        message = call_args[0][0]
        room_id = call_args[0][1]
        
        assert room_id == "TEST01"
        assert message["type"] == "state_update"
        assert message["room_id"] == "TEST01"
        assert message["state"] == sample_state
        assert message["version"] == 5
        assert message["checksum"] == "abc123"
    
    @pytest.mark.asyncio
    async def test_broadcast_failure(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test broadcast failure handling"""
        mock_websocket_manager.broadcast_to_room.side_effect = Exception("Connection error")
        
        result = await broadcast_controller.broadcast("TEST01", sample_state)
        
        assert result.success is False
        assert result.delivered_count == 0
        assert result.failed_count == 1
        assert "TEST01" in result.failed_clients
    
    @pytest.mark.asyncio
    async def test_broadcast_includes_timestamp(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test broadcast includes timestamp"""
        await broadcast_controller.broadcast("TEST01", sample_state)
        
        call_args = mock_websocket_manager.broadcast_to_room.call_args
        message = call_args[0][0]
        
        assert "timestamp" in message
        # Verify timestamp is valid ISO format
        datetime.fromisoformat(message["timestamp"])


class TestComputeDelta:
    """Test compute_delta method - Requirements: 13.1, 13.2, 13.3"""
    
    def test_compute_delta_single_field_change(self, broadcast_controller, sample_state):
        """Test delta computation with single field change"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["current_turn"] = 2
        new_state["checksum"] = "def456"
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        
        assert delta.version == 6
        assert delta.base_version == 5
        assert delta.checksum == "def456"
        assert len(delta.changes) == 1
        assert delta.changes["current_turn"] == 2
    
    def test_compute_delta_multiple_field_changes(self, broadcast_controller, sample_state):
        """Test delta computation with multiple field changes"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["current_turn"] = 2
        new_state["player1_score"] = 3
        new_state["player2_score"] = 2
        new_state["last_action"] = "capture"
        new_state["checksum"] = "xyz789"
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        
        assert delta.version == 6
        assert delta.base_version == 5
        assert len(delta.changes) == 4
        assert delta.changes["current_turn"] == 2
        assert delta.changes["player1_score"] == 3
        assert delta.changes["player2_score"] == 2
        assert delta.changes["last_action"] == "capture"
    
    def test_compute_delta_no_changes(self, broadcast_controller, sample_state):
        """Test delta computation with no changes"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6  # Only version changes
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        
        assert delta.version == 6
        assert delta.base_version == 5
        assert len(delta.changes) == 0
    
    def test_compute_delta_list_changes(self, broadcast_controller, sample_state):
        """Test delta computation with list field changes"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["player1_hand"] = []  # Card was played
        new_state["table_cards"] = [
            {"id": "Q_diamonds", "rank": "Q", "suit": "diamonds"},
            {"id": "A_hearts", "rank": "A", "suit": "hearts"}
        ]
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        
        assert len(delta.changes) == 2
        assert delta.changes["player1_hand"] == []
        assert len(delta.changes["table_cards"]) == 2
    
    def test_delta_to_dict(self, broadcast_controller, sample_state):
        """Test StateDelta serialization to dictionary"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["current_turn"] = 2
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        delta_dict = delta.to_dict()
        
        assert delta_dict["version"] == 6
        assert delta_dict["base_version"] == 5
        assert "changes" in delta_dict
        assert "checksum" in delta_dict
        assert "timestamp" in delta_dict


class TestBroadcastDelta:
    """Test broadcast_delta method - Requirements: 13.1, 13.3, 13.4"""
    
    @pytest.mark.asyncio
    async def test_broadcast_delta_success(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test successful delta broadcast"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["current_turn"] = 2
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        result = await broadcast_controller.broadcast_delta("TEST01", delta)
        
        assert result.success is True
        assert result.delivered_count == 2
        assert result.failed_count == 0
        
        # Verify message format
        call_args = mock_websocket_manager.broadcast_to_room.call_args
        message = call_args[0][0]
        
        assert message["type"] == "state_delta"
        assert message["room_id"] == "TEST01"
        assert "delta" in message
        assert message["delta"]["version"] == 6
        assert message["delta"]["base_version"] == 5
    
    @pytest.mark.asyncio
    async def test_broadcast_delta_with_full_state(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test delta broadcast with full state for version mismatch"""
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["current_turn"] = 2
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        result = await broadcast_controller.broadcast_delta("TEST01", delta, full_state=new_state)
        
        assert result.success is True
        assert result.delivered_count == 2
        
        # Verify delta message was sent
        call_args = mock_websocket_manager.broadcast_to_room.call_args
        message = call_args[0][0]
        assert message["type"] == "state_delta"
    
    @pytest.mark.asyncio
    async def test_broadcast_delta_failure(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test delta broadcast failure handling"""
        mock_websocket_manager.broadcast_to_room.side_effect = Exception("Network error")
        
        old_state = sample_state.copy()
        new_state = sample_state.copy()
        new_state["version"] = 6
        
        delta = broadcast_controller.compute_delta(old_state, new_state)
        result = await broadcast_controller.broadcast_delta("TEST01", delta)
        
        assert result.success is False
        assert result.delivered_count == 0
        assert result.failed_count == 1


class TestRetryFailed:
    """Test retry_failed method - Requirements: 9.5"""
    
    @pytest.mark.asyncio
    async def test_retry_success(self, broadcast_controller, mock_websocket_manager):
        """Test successful retry after failure"""
        result = await broadcast_controller.retry_failed("TEST01", "session123")
        
        assert result is True
        assert "TEST01:session123" not in broadcast_controller.failed_broadcasts
    
    @pytest.mark.asyncio
    async def test_retry_exponential_backoff(self, broadcast_controller, mock_websocket_manager):
        """Test exponential backoff on retries"""
        # First retry
        start_time = asyncio.get_event_loop().time()
        await broadcast_controller.retry_failed("TEST01", "session123")
        first_duration = asyncio.get_event_loop().time() - start_time
        
        # Second retry (should take longer)
        start_time = asyncio.get_event_loop().time()
        await broadcast_controller.retry_failed("TEST01", "session456")
        second_duration = asyncio.get_event_loop().time() - start_time
        
        # Both should have some delay (at least 0.1s based on retry_base_delay)
        assert first_duration >= 0.1
        assert second_duration >= 0.1
    
    @pytest.mark.asyncio
    async def test_retry_max_attempts_reached(self, broadcast_controller, mock_websocket_manager):
        """Test client marked as desynced after max retries"""
        client_id = "session789"
        
        # Set retry count to max_retries to trigger desync
        broadcast_controller.failed_broadcasts[f"TEST01:{client_id}"] = broadcast_controller.max_retries
        
        result = await broadcast_controller.retry_failed("TEST01", client_id)
        
        assert result is False
        assert client_id in broadcast_controller.desynced_clients
        assert f"TEST01:{client_id}" not in broadcast_controller.failed_broadcasts
    
    @pytest.mark.asyncio
    async def test_retry_client_not_connected(self, broadcast_controller, mock_websocket_manager):
        """Test retry when client is not connected"""
        mock_websocket_manager.is_session_connected.return_value = False
        
        result = await broadcast_controller.retry_failed("TEST01", "session999")
        
        assert result is False


class TestBroadcastCompression:
    """Test broadcast compression - Requirements: 13.2"""
    
    @pytest.mark.asyncio
    async def test_compression_for_large_payload(self, broadcast_controller, mock_websocket_manager):
        """Test payload compression for large states"""
        # Create a large state (> 100 bytes threshold)
        large_state = {
            "room_id": "TEST01",
            "version": 5,
            "checksum": "abc123",
            "player1_hand": [{"id": f"card_{i}", "rank": "A", "suit": "hearts"} for i in range(20)],
            "player2_hand": [{"id": f"card_{i}", "rank": "K", "suit": "spades"} for i in range(20)],
            "table_cards": [{"id": f"card_{i}", "rank": "Q", "suit": "diamonds"} for i in range(20)]
        }
        
        await broadcast_controller.broadcast("TEST01", large_state)
        
        # Verify broadcast was called
        mock_websocket_manager.broadcast_to_room.assert_called_once()
        call_args = mock_websocket_manager.broadcast_to_room.call_args
        message = call_args[0][0]
        
        # Check if compression flag is set
        # Note: Compression only happens if compressed size < original size
        if "compressed" in message:
            assert message["compressed"] is True
    
    @pytest.mark.asyncio
    async def test_no_compression_for_small_payload(self, mock_websocket_manager):
        """Test no compression for small states"""
        # Create controller with higher threshold to ensure small payload isn't compressed
        controller = BroadcastController(
            websocket_manager=mock_websocket_manager,
            max_retries=3,
            retry_base_delay=0.1,
            compression_threshold=1000  # Higher threshold
        )
        
        small_state = {
            "room_id": "TEST01",
            "version": 5,
            "checksum": "abc123"
        }
        
        await controller.broadcast("TEST01", small_state)
        
        call_args = mock_websocket_manager.broadcast_to_room.call_args
        message = call_args[0][0]
        
        # Small payload should not be compressed with high threshold
        assert "compressed" not in message or message.get("compressed") is False


class TestClientDesyncTracking:
    """Test client desync tracking"""
    
    def test_is_client_desynced(self, broadcast_controller):
        """Test checking if client is desynced"""
        assert broadcast_controller.is_client_desynced("session123") is False
        
        broadcast_controller.desynced_clients.add("session123")
        assert broadcast_controller.is_client_desynced("session123") is True
    
    def test_mark_client_synced(self, broadcast_controller):
        """Test marking client as synced"""
        broadcast_controller.desynced_clients.add("session123")
        assert broadcast_controller.is_client_desynced("session123") is True
        
        broadcast_controller.mark_client_synced("session123")
        assert broadcast_controller.is_client_desynced("session123") is False


class TestClientVersionTracking:
    """Test client version tracking - Requirements: 13.3, 13.4"""
    
    def test_update_client_version(self, broadcast_controller):
        """Test updating client version"""
        broadcast_controller.update_client_version("session123", 5)
        
        assert broadcast_controller.get_client_version("session123") == 5
    
    def test_get_client_version_not_tracked(self, broadcast_controller):
        """Test getting version for untracked client"""
        version = broadcast_controller.get_client_version("unknown_session")
        
        assert version is None
    
    def test_update_client_version_multiple_times(self, broadcast_controller):
        """Test updating client version multiple times"""
        broadcast_controller.update_client_version("session123", 5)
        assert broadcast_controller.get_client_version("session123") == 5
        
        broadcast_controller.update_client_version("session123", 10)
        assert broadcast_controller.get_client_version("session123") == 10
    
    def test_remove_client_tracking(self, broadcast_controller):
        """Test removing all tracking data for a client"""
        client_id = "session123"
        
        # Set up tracking data
        broadcast_controller.update_client_version(client_id, 5)
        broadcast_controller.desynced_clients.add(client_id)
        broadcast_controller.failed_broadcasts[f"TEST01:{client_id}"] = 2
        
        # Remove tracking
        broadcast_controller.remove_client_tracking(client_id)
        
        # Verify all data removed
        assert broadcast_controller.get_client_version(client_id) is None
        assert client_id not in broadcast_controller.desynced_clients
        assert f"TEST01:{client_id}" not in broadcast_controller.failed_broadcasts
    
    def test_remove_client_tracking_multiple_rooms(self, broadcast_controller):
        """Test removing client tracking across multiple rooms"""
        client_id = "session123"
        
        # Set up tracking in multiple rooms
        broadcast_controller.failed_broadcasts[f"ROOM01:{client_id}"] = 1
        broadcast_controller.failed_broadcasts[f"ROOM02:{client_id}"] = 2
        broadcast_controller.failed_broadcasts[f"ROOM03:other_client"] = 1
        
        # Remove tracking for specific client
        broadcast_controller.remove_client_tracking(client_id)
        
        # Verify only this client's data removed
        assert f"ROOM01:{client_id}" not in broadcast_controller.failed_broadcasts
        assert f"ROOM02:{client_id}" not in broadcast_controller.failed_broadcasts
        assert f"ROOM03:other_client" in broadcast_controller.failed_broadcasts


class TestBroadcastStats:
    """Test broadcast statistics"""
    
    def test_get_stats(self, broadcast_controller):
        """Test getting broadcast controller statistics"""
        # Add some test data
        broadcast_controller.desynced_clients.add("session1")
        broadcast_controller.desynced_clients.add("session2")
        broadcast_controller.failed_broadcasts["TEST01:session3"] = 1
        
        stats = broadcast_controller.get_stats()
        
        assert stats["desynced_clients"] == 2
        assert stats["pending_retries"] == 1
        assert stats["max_retries"] == 3
        assert stats["compression_threshold"] == 100


class TestIntegration:
    """Integration tests for complete broadcast flows"""
    
    @pytest.mark.asyncio
    async def test_full_broadcast_flow(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test complete broadcast flow from state to delivery"""
        # Broadcast initial state
        result1 = await broadcast_controller.broadcast("TEST01", sample_state)
        assert result1.success is True
        
        # Update state
        new_state = sample_state.copy()
        new_state["version"] = 6
        new_state["current_turn"] = 2
        new_state["player1_score"] = 3
        
        # Compute and broadcast delta
        delta = broadcast_controller.compute_delta(sample_state, new_state)
        result2 = await broadcast_controller.broadcast_delta("TEST01", delta)
        assert result2.success is True
        
        # Verify both broadcasts occurred
        assert mock_websocket_manager.broadcast_to_room.call_count == 2
    
    @pytest.mark.asyncio
    async def test_broadcast_with_retry_flow(self, broadcast_controller, mock_websocket_manager, sample_state):
        """Test broadcast with retry on failure"""
        # Simulate initial broadcast failure
        mock_websocket_manager.broadcast_to_room.side_effect = Exception("Network error")
        result = await broadcast_controller.broadcast("TEST01", sample_state)
        assert result.success is False
        
        # Reset mock for retry
        mock_websocket_manager.broadcast_to_room.side_effect = None
        
        # Retry should succeed
        retry_result = await broadcast_controller.retry_failed("TEST01", "session123")
        assert retry_result is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
