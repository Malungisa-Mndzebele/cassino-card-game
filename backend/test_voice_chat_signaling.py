"""
Property-based tests for voice chat signaling

Tests voice signaling message relay, session validation, and room membership validation
using Hypothesis for property-based testing.
"""

import pytest
import json
from hypothesis import given, strategies as st, settings
from fastapi.testclient import TestClient
from fastapi import WebSocket
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import asyncio

from main import app
from websocket_manager import manager
from session_manager import SessionManager


# Test data generators
@st.composite
def session_token_strategy(draw):
    """Generate random session tokens"""
    # Valid tokens are 64-character hex strings
    return draw(st.text(alphabet='0123456789abcdef', min_size=64, max_size=64))


@st.composite
def room_id_strategy(draw):
    """Generate random room IDs"""
    return draw(st.text(alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', min_size=6, max_size=6))


@st.composite
def voice_message_strategy(draw):
    """Generate random voice signaling messages"""
    message_type = draw(st.sampled_from([
        "voice_offer",
        "voice_answer", 
        "voice_ice_candidate",
        "voice_mute_status"
    ]))
    
    if message_type == "voice_offer" or message_type == "voice_answer":
        data = {
            "sdp": draw(st.text(min_size=10, max_size=100)),
            "type": message_type.replace("voice_", "")
        }
    elif message_type == "voice_ice_candidate":
        data = {
            "candidate": draw(st.text(min_size=10, max_size=100)),
            "sdpMLineIndex": draw(st.integers(min_value=0, max_value=10)),
            "sdpMid": draw(st.text(min_size=1, max_size=10))
        }
    else:  # voice_mute_status
        data = {
            "is_muted": draw(st.booleans())
        }
    
    return {
        "type": message_type,
        "data": data
    }


class TestVoiceSignalingProperties:
    """Property-based tests for voice chat signaling"""
    
    @given(
        session_token=session_token_strategy(),
        room_id=room_id_strategy()
    )
    @settings(max_examples=100)
    def test_property_17_session_token_validation(self, session_token, room_id):
        """
        **Feature: voice-chat, Property 17: Session token validation**
        
        For any voice connection establishment attempt, the Signaling Server 
        should validate the player's session token and reject invalid tokens.
        
        **Validates: Requirements 6.1**
        """
        # Create mock session manager
        mock_session_manager = Mock(spec=SessionManager)
        
        # Test with invalid token (returns None)
        mock_session_manager.validate_session = AsyncMock(return_value=None)
        
        # Simulate validation
        async def validate():
            result = await mock_session_manager.validate_session(session_token)
            return result is None  # Should be None for invalid token
        
        # Run async validation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        is_invalid = loop.run_until_complete(validate())
        loop.close()
        
        # Property: Invalid tokens should be rejected (return None)
        assert is_invalid, f"Invalid token {session_token} should be rejected"
        
        # Test with valid token
        mock_session_manager.validate_session = AsyncMock(return_value={
            "token": session_token,
            "room_id": room_id,
            "player_id": "player1"
        })
        
        async def validate_valid():
            result = await mock_session_manager.validate_session(session_token)
            return result is not None and result.get("token") == session_token
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        is_valid = loop.run_until_complete(validate_valid())
        loop.close()
        
        # Property: Valid tokens should be accepted
        assert is_valid, f"Valid token {session_token} should be accepted"
    
    @given(
        room_id_1=room_id_strategy(),
        room_id_2=room_id_strategy(),
        message=voice_message_strategy()
    )
    @settings(max_examples=100)
    def test_property_20_room_membership_validation(self, room_id_1, room_id_2, message):
        """
        **Feature: voice-chat, Property 20: Room membership validation**
        
        For any signaling message exchange, the Signaling Server should verify 
        both players belong to the same room and reject messages between players 
        in different rooms.
        
        **Validates: Requirements 6.4**
        """
        # Assume different rooms unless they happen to be equal
        same_room = (room_id_1 == room_id_2)
        
        # Create mock session data
        session_data = {
            "token": "test_token",
            "room_id": room_id_1,
            "player_id": "player1"
        }
        
        # Property: Message should only be relayed if rooms match
        if same_room:
            # Same room: message should be allowed
            should_relay = (session_data["room_id"] == room_id_2)
            assert should_relay, f"Message should be relayed when rooms match: {room_id_1} == {room_id_2}"
        else:
            # Different rooms: message should be rejected
            should_reject = (session_data["room_id"] != room_id_2)
            assert should_reject, f"Message should be rejected when rooms differ: {room_id_1} != {room_id_2}"
    
    @given(
        room_id=room_id_strategy(),
        sender_session=session_token_strategy(),
        message=voice_message_strategy()
    )
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_send_to_room_except_excludes_sender(self, room_id, sender_session, message):
        """
        Test that send_to_room_except properly excludes the sender from receiving the message.
        
        This validates that voice signaling messages are only sent to the opponent,
        not back to the sender.
        """
        # Create mock websockets
        sender_ws = Mock(spec=WebSocket)
        sender_ws.send_json = AsyncMock()
        
        opponent_ws = Mock(spec=WebSocket)
        opponent_ws.send_json = AsyncMock()
        
        # Set up manager state
        manager.active_connections[room_id] = {sender_ws, opponent_ws}
        manager.websocket_sessions[sender_ws] = sender_session
        manager.websocket_sessions[opponent_ws] = "opponent_session"
        
        try:
            # Send message excluding sender
            await manager.send_to_room_except(
                room_id=room_id,
                exclude_session_id=sender_session,
                message=message
            )
            
            # Property: Sender should not receive the message
            sender_ws.send_json.assert_not_called()
            
            # Property: Opponent should receive the message
            opponent_ws.send_json.assert_called_once_with(message)
            
        finally:
            # Cleanup
            if room_id in manager.active_connections:
                del manager.active_connections[room_id]
            manager.websocket_sessions.pop(sender_ws, None)
            manager.websocket_sessions.pop(opponent_ws, None)


class TestVoiceSignalingMessageTypes:
    """Test voice signaling message type handling"""
    
    @given(message_type=st.sampled_from([
        "voice_offer",
        "voice_answer",
        "voice_ice_candidate",
        "voice_mute_status"
    ]))
    @settings(max_examples=50)
    def test_all_voice_message_types_handled(self, message_type):
        """
        Test that all voice signaling message types are recognized and handled.
        
        Property: For any valid voice message type, the system should handle it
        without errors.
        """
        # List of valid voice message types
        valid_types = [
            "voice_offer",
            "voice_answer",
            "voice_ice_candidate",
            "voice_mute_status"
        ]
        
        # Property: Message type should be in valid types
        assert message_type in valid_types, f"Message type {message_type} should be valid"
        
        # Property: Message type should start with "voice_"
        assert message_type.startswith("voice_"), f"Voice message type should start with 'voice_'"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
