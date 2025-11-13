"""
Tests for session management functionality
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import GameSession, Player, Room
from session_token import (
    SessionToken, create_session_token, validate_token,
    validate_token_signature, generate_signature, generate_nonce
)
from session_manager import SessionManager


# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture
def db():
    """Create test database"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_room(db):
    """Create test room"""
    room = Room(id="TEST01")
    db.add(room)
    db.commit()
    return room


@pytest.fixture
def test_player(db, test_room):
    """Create test player"""
    player = Player(room_id=test_room.id, name="TestPlayer")
    db.add(player)
    db.commit()
    return player


class TestSessionToken:
    """Test session token functionality"""
    
    def test_create_session_token(self):
        """Test creating a session token"""
        token = create_session_token("ROOM01", 1, "Player1")
        
        assert token.room_id == "ROOM01"
        assert token.player_id == 1
        assert token.player_name == "Player1"
        assert token.version == 1
        assert len(token.signature) == 64  # SHA-256 hex is 64 chars
        assert len(token.nonce) > 0
        assert token.created_at > 0
        assert token.expires_at > token.created_at
    
    def test_token_serialization(self):
        """Test token to/from string conversion"""
        token = create_session_token("ROOM01", 1, "Player1")
        
        # Serialize
        token_str = token.to_string()
        assert isinstance(token_str, str)
        assert len(token_str) > 0
        
        # Deserialize
        restored_token = SessionToken.from_string(token_str)
        assert restored_token is not None
        assert restored_token.room_id == token.room_id
        assert restored_token.player_id == token.player_id
        assert restored_token.signature == token.signature
    
    def test_token_expiration(self):
        """Test token expiration checking"""
        token = create_session_token("ROOM01", 1, "Player1")
        
        # Fresh token should not be expired
        assert not token.is_expired()
        
        # Create expired token
        expired_token = SessionToken(
            room_id="ROOM01",
            player_id=1,
            player_name="Player1",
            signature="test",
            nonce="test",
            created_at=int((datetime.now() - timedelta(hours=25)).timestamp() * 1000),
            expires_at=int((datetime.now() - timedelta(hours=1)).timestamp() * 1000),
            version=1
        )
        assert expired_token.is_expired()
    
    def test_signature_validation(self):
        """Test signature validation"""
        token = create_session_token("ROOM01", 1, "Player1")
        
        # Valid signature
        assert validate_token_signature(token)
        
        # Invalid signature
        token.signature = "invalid_signature"
        assert not validate_token_signature(token)
    
    def test_token_validation(self):
        """Test complete token validation"""
        token = create_session_token("ROOM01", 1, "Player1")
        
        # Valid token
        is_valid, error = validate_token(token)
        assert is_valid
        assert error is None
        
        # Expired token
        token.expires_at = int((datetime.now() - timedelta(hours=1)).timestamp() * 1000)
        is_valid, error = validate_token(token)
        assert not is_valid
        assert "expired" in error.lower()
        
        # Invalid version
        token = create_session_token("ROOM01", 1, "Player1")
        token.version = 999
        is_valid, error = validate_token(token)
        assert not is_valid
        assert "version" in error.lower()
    
    def test_nonce_uniqueness(self):
        """Test that nonces are unique"""
        nonces = [generate_nonce() for _ in range(100)]
        assert len(set(nonces)) == 100  # All unique


class TestSessionManager:
    """Test session manager functionality"""
    
    def test_create_session(self, db, test_room, test_player):
        """Test creating a session"""
        manager = SessionManager(db)
        
        token = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        assert token.room_id == test_room.id
        assert token.player_id == test_player.id
        
        # Verify session in database
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        
        assert session is not None
        assert session.room_id == test_room.id
        assert session.is_active
        assert session.connection_count == 1
    
    def test_validate_session(self, db, test_room, test_player):
        """Test validating a session"""
        manager = SessionManager(db)
        
        # Create session
        token = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Validate with token string
        token_str = token.to_string()
        session = manager.validate_session(token_str)
        
        assert session is not None
        assert session.player_id == test_player.id
        assert session.is_active
    
    def test_validate_invalid_session(self, db):
        """Test validating an invalid session"""
        manager = SessionManager(db)
        
        # Invalid token string
        session = manager.validate_session("invalid_token")
        assert session is None
    
    def test_update_heartbeat(self, db, test_room, test_player):
        """Test updating heartbeat"""
        manager = SessionManager(db)
        
        # Create session
        token = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Get session
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        
        original_heartbeat = session.last_heartbeat
        
        # Update heartbeat
        import time
        time.sleep(0.1)  # Small delay to ensure timestamp changes
        manager.update_heartbeat(session.id)
        
        # Verify update
        db.refresh(session)
        assert session.last_heartbeat > original_heartbeat
    
    def test_mark_disconnected(self, db, test_room, test_player):
        """Test marking session as disconnected"""
        manager = SessionManager(db)
        
        # Create session
        token = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Get session
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        
        # Mark disconnected
        manager.mark_disconnected(session.id)
        
        # Verify
        db.refresh(session)
        assert session.disconnected_at is not None
    
    def test_check_abandoned_games(self, db, test_room, test_player):
        """Test checking for abandoned games"""
        manager = SessionManager(db)
        
        # Create session
        token = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Get session and mark as disconnected 6 minutes ago
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        
        session.disconnected_at = datetime.now() - timedelta(minutes=6)
        db.commit()
        
        # Check abandoned games
        abandoned_rooms = manager.check_abandoned_games()
        
        assert test_room.id in abandoned_rooms
    
    def test_cleanup_expired_sessions(self, db, test_room, test_player):
        """Test cleaning up expired sessions"""
        manager = SessionManager(db)
        
        # Create session
        token = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Get session and make it old
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        
        session.connected_at = datetime.now() - timedelta(hours=25)
        db.commit()
        
        # Cleanup
        count = manager.cleanup_expired_sessions()
        
        assert count == 1
        
        # Verify session is gone
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        assert session is None
    
    def test_reconnection_increments_count(self, db, test_room, test_player):
        """Test that reconnection increments connection count"""
        manager = SessionManager(db)
        
        # Create initial session
        token1 = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Create another session (simulating reconnection)
        token2 = manager.create_session(
            room_id=test_room.id,
            player_id=test_player.id,
            player_name=test_player.name,
            ip_address="127.0.0.1",
            user_agent="TestAgent"
        )
        
        # Verify connection count increased
        session = db.query(GameSession).filter(
            GameSession.player_id == test_player.id
        ).first()
        
        assert session.connection_count == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
