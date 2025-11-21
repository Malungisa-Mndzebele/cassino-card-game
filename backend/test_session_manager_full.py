"""
Comprehensive tests for session_manager.py - Target: 100% coverage
Tests all session management functions, edge cases, and error conditions
"""
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from session_manager import (
    SessionToken,
    create_session_token,
    create_session_fingerprint,
    SessionManager,
    get_session_manager
)
from models import Base, GameSession, Player, Room


# Test database setup
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def async_engine():
    """Create async test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture
async def async_db(async_engine):
    """Create async database session"""
    async_session = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def test_room(async_db):
    """Create test room"""
    room = Room(id="TEST01")
    async_db.add(room)
    await async_db.commit()
    return room


@pytest_asyncio.fixture
async def test_player(async_db, test_room):
    """Create test player"""
    player = Player(room_id=test_room.id, name="TestPlayer")
    async_db.add(player)
    await async_db.commit()
    return player


class TestSessionToken:
    """Test SessionToken class"""
    
    def test_session_token_creation(self):
        """Test creating a SessionToken"""
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        token = SessionToken(
            token="test_token_123",
            room_id="ROOM01",
            player_id=1,
            player_name="Player1",
            created_at=created,
            expires_at=expires
        )
        
        assert token.token == "test_token_123"
        assert token.room_id == "ROOM01"
        assert token.player_id == 1
        assert token.player_name == "Player1"
        assert token.created_at == created
        assert token.expires_at == expires
    
    def test_session_token_to_dict(self):
        """Test converting SessionToken to dictionary"""
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        token = SessionToken(
            token="test_token_123",
            room_id="ROOM01",
            player_id=1,
            player_name="Player1",
            created_at=created,
            expires_at=expires
        )
        
        data = token.to_dict()
        
        assert data["token"] == "test_token_123"
        assert data["room_id"] == "ROOM01"
        assert data["player_id"] == 1
        assert data["player_name"] == "Player1"
        assert "created_at" in data
        assert "expires_at" in data
    
    def test_session_token_from_dict(self):
        """Test creating SessionToken from dictionary"""
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        data = {
            "token": "test_token_123",
            "room_id": "ROOM01",
            "player_id": 1,
            "player_name": "Player1",
            "created_at": created.isoformat(),
            "expires_at": expires.isoformat()
        }
        
        token = SessionToken.from_dict(data)
        
        assert token.token == "test_token_123"
        assert token.room_id == "ROOM01"
        assert token.player_id == 1
        assert token.player_name == "Player1"
    
    def test_session_token_to_string(self):
        """Test getting token string"""
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        token = SessionToken(
            token="test_token_123",
            room_id="ROOM01",
            player_id=1,
            player_name="Player1",
            created_at=created,
            expires_at=expires
        )
        
        assert token.to_string() == "test_token_123"
    
    def test_session_token_is_expired_false(self):
        """Test token not expired"""
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        token = SessionToken(
            token="test_token_123",
            room_id="ROOM01",
            player_id=1,
            player_name="Player1",
            created_at=created,
            expires_at=expires
        )
        
        assert token.is_expired() is False
    
    def test_session_token_is_expired_true(self):
        """Test token is expired"""
        created = datetime.utcnow() - timedelta(hours=48)
        expires = created + timedelta(hours=24)
        
        token = SessionToken(
            token="test_token_123",
            room_id="ROOM01",
            player_id=1,
            player_name="Player1",
            created_at=created,
            expires_at=expires
        )
        
        assert token.is_expired() is True


class TestCreateSessionToken:
    """Test create_session_token function"""
    
    def test_create_session_token_default_ttl(self):
        """Test creating session token with default TTL"""
        token = create_session_token("ROOM01", 1, "Player1")
        
        assert token.room_id == "ROOM01"
        assert token.player_id == 1
        assert token.player_name == "Player1"
        assert len(token.token) > 0
        assert token.expires_at > token.created_at
    
    def test_create_session_token_custom_ttl(self):
        """Test creating session token with custom TTL"""
        token = create_session_token("ROOM01", 1, "Player1", ttl_hours=12)
        
        expected_expires = token.created_at + timedelta(hours=12)
        # Allow 1 second tolerance for test execution time
        assert abs((token.expires_at - expected_expires).total_seconds()) < 1
    
    def test_create_session_token_unique(self):
        """Test that tokens are unique"""
        token1 = create_session_token("ROOM01", 1, "Player1")
        token2 = create_session_token("ROOM01", 1, "Player1")
        
        assert token1.token != token2.token


class TestCreateSessionFingerprint:
    """Test create_session_fingerprint function"""
    
    def test_create_fingerprint(self):
        """Test creating session fingerprint"""
        fingerprint = create_session_fingerprint("192.168.1.1", "Mozilla/5.0")
        
        assert len(fingerprint) == 64  # SHA256 hex digest length
        assert isinstance(fingerprint, str)
    
    def test_create_fingerprint_consistent(self):
        """Test fingerprint is consistent for same inputs"""
        fp1 = create_session_fingerprint("192.168.1.1", "Mozilla/5.0")
        fp2 = create_session_fingerprint("192.168.1.1", "Mozilla/5.0")
        
        assert fp1 == fp2
    
    def test_create_fingerprint_different_ip(self):
        """Test different fingerprints for different IPs"""
        fp1 = create_session_fingerprint("192.168.1.1", "Mozilla/5.0")
        fp2 = create_session_fingerprint("192.168.1.2", "Mozilla/5.0")
        
        assert fp1 != fp2
    
    def test_create_fingerprint_different_user_agent(self):
        """Test different fingerprints for different user agents"""
        fp1 = create_session_fingerprint("192.168.1.1", "Mozilla/5.0")
        fp2 = create_session_fingerprint("192.168.1.1", "Chrome/90.0")
        
        assert fp1 != fp2


class TestSessionManagerInit:
    """Test SessionManager initialization"""
    
    @pytest.mark.asyncio
    async def test_session_manager_init(self, async_db):
        """Test SessionManager initialization"""
        manager = SessionManager(async_db)
        
        assert manager.db == async_db
        assert manager.SESSION_TTL == 1800
        assert manager.HEARTBEAT_INTERVAL == 30


class TestSessionManagerCreateSession:
    """Test SessionManager.create_session method"""
    
    @pytest.mark.asyncio
    async def test_create_session_new(self, async_db, test_room, test_player):
        """Test creating a new session"""
        manager = SessionManager(async_db)
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.cache_session = AsyncMock()
            
            token = await manager.create_session(
                room_id=test_room.id,
                player_id=test_player.id,
                player_name=test_player.name,
                ip_address="192.168.1.1",
                user_agent="Mozilla/5.0"
            )
            
            assert token.room_id == test_room.id
            assert token.player_id == test_player.id
            assert token.player_name == test_player.name
            assert len(token.token) > 0
            
            # Verify cache was called
            mock_cache.cache_session.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_session_existing(self, async_db, test_room, test_player):
        """Test creating session when one already exists"""
        manager = SessionManager(async_db)
        
        # Create first session
        existing_session = GameSession(
            room_id=test_room.id,
            player_id=test_player.id,
            session_token="old_token",
            connected_at=datetime.utcnow(),
            last_heartbeat=datetime.utcnow(),
            is_active=True,
            connection_count=1,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )
        async_db.add(existing_session)
        await async_db.commit()
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.cache_session = AsyncMock()
            
            # Create new session (should update existing)
            token = await manager.create_session(
                room_id=test_room.id,
                player_id=test_player.id,
                player_name=test_player.name,
                ip_address="192.168.1.2",
                user_agent="Chrome/90.0"
            )
            
            assert token.room_id == test_room.id
            assert token.player_id == test_player.id
            
            # Verify session was updated (connection_count should be 2)
            await async_db.refresh(existing_session)
            assert existing_session.connection_count == 2
            assert existing_session.session_token == token.token


class TestSessionManagerValidateSession:
    """Test SessionManager.validate_session method"""
    
    @pytest.mark.asyncio
    async def test_validate_session_valid(self, async_db):
        """Test validating a valid session"""
        manager = SessionManager(async_db)
        
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        session_data = {
            "token": "test_token",
            "room_id": "ROOM01",
            "player_id": 1,
            "player_name": "Player1",
            "created_at": created.isoformat(),
            "expires_at": expires.isoformat(),
            "fingerprint": create_session_fingerprint("192.168.1.1", "Mozilla/5.0"),
            "is_active": True
        }
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=session_data)
            
            result = await manager.validate_session(
                "test_token",
                ip_address="192.168.1.1",
                user_agent="Mozilla/5.0"
            )
            
            assert result is not None
            assert result["room_id"] == "ROOM01"
            assert result["player_id"] == 1
    
    @pytest.mark.asyncio
    async def test_validate_session_not_found(self, async_db):
        """Test validating non-existent session"""
        manager = SessionManager(async_db)
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=None)
            
            result = await manager.validate_session("invalid_token")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_validate_session_inactive(self, async_db):
        """Test validating inactive session"""
        manager = SessionManager(async_db)
        
        session_data = {
            "token": "test_token",
            "is_active": False
        }
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=session_data)
            
            result = await manager.validate_session("test_token")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_validate_session_fingerprint_mismatch(self, async_db):
        """Test validating session with fingerprint mismatch"""
        manager = SessionManager(async_db)
        
        created = datetime.utcnow()
        expires = created + timedelta(hours=24)
        
        session_data = {
            "token": "test_token",
            "room_id": "ROOM01",
            "player_id": 1,
            "player_name": "Player1",
            "created_at": created.isoformat(),
            "expires_at": expires.isoformat(),
            "fingerprint": create_session_fingerprint("192.168.1.1", "Mozilla/5.0"),
            "is_active": True
        }
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=session_data)
            
            # Try to validate with different IP
            result = await manager.validate_session(
                "test_token",
                ip_address="192.168.1.2",
                user_agent="Mozilla/5.0"
            )
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_validate_session_expired(self, async_db):
        """Test validating expired session"""
        manager = SessionManager(async_db)
        
        created = datetime.utcnow() - timedelta(hours=48)
        expires = created + timedelta(hours=24)
        
        session_data = {
            "token": "test_token",
            "room_id": "ROOM01",
            "player_id": 1,
            "player_name": "Player1",
            "created_at": created.isoformat(),
            "expires_at": expires.isoformat(),
            "is_active": True
        }
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=session_data)
            mock_cache.invalidate_session = AsyncMock(return_value=True)
            
            result = await manager.validate_session("test_token")
            
            assert result is None
            mock_cache.invalidate_session.assert_called_once_with("test_token")


class TestSessionManagerUpdateHeartbeat:
    """Test SessionManager.update_heartbeat method"""
    
    @pytest.mark.asyncio
    async def test_update_heartbeat_success(self, async_db):
        """Test updating heartbeat successfully"""
        manager = SessionManager(async_db)
        
        session_data = {
            "token": "test_token",
            "last_heartbeat": datetime.utcnow().isoformat()
        }
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=session_data)
            mock_cache.extend_session_ttl = AsyncMock()
            mock_cache.cache_session = AsyncMock()
            
            result = await manager.update_heartbeat("test_token")
            
            assert result is True
            mock_cache.extend_session_ttl.assert_called_once()
            mock_cache.cache_session.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_heartbeat_not_found(self, async_db):
        """Test updating heartbeat for non-existent session"""
        manager = SessionManager(async_db)
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=None)
            
            result = await manager.update_heartbeat("invalid_token")
            
            assert result is False


class TestSessionManagerInvalidateSession:
    """Test SessionManager.invalidate_session method"""
    
    @pytest.mark.asyncio
    async def test_invalidate_session_success(self, async_db):
        """Test invalidating session successfully"""
        manager = SessionManager(async_db)
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.invalidate_session = AsyncMock(return_value=True)
            
            result = await manager.invalidate_session("test_token")
            
            assert result is True
            mock_cache.invalidate_session.assert_called_once_with("test_token")
    
    @pytest.mark.asyncio
    async def test_invalidate_session_failure(self, async_db):
        """Test invalidating session failure"""
        manager = SessionManager(async_db)
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.invalidate_session = AsyncMock(return_value=False)
            
            result = await manager.invalidate_session("test_token")
            
            assert result is False


class TestSessionManagerGetActiveSessions:
    """Test SessionManager.get_active_sessions method"""
    
    @pytest.mark.asyncio
    async def test_get_active_sessions(self, async_db, test_room, test_player):
        """Test getting active sessions for a room"""
        manager = SessionManager(async_db)
        
        # Create active session in database
        session = GameSession(
            room_id=test_room.id,
            player_id=test_player.id,
            session_token="test_token",
            connected_at=datetime.utcnow(),
            last_heartbeat=datetime.utcnow(),
            is_active=True,
            connection_count=1,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )
        async_db.add(session)
        await async_db.commit()
        
        session_data = {
            "token": "test_token",
            "room_id": test_room.id,
            "player_id": test_player.id
        }
        
        with patch('session_manager.cache_manager') as mock_cache:
            mock_cache.get_session = AsyncMock(return_value=session_data)
            
            sessions = await manager.get_active_sessions(test_room.id)
            
            assert len(sessions) == 1
            assert sessions[0]["token"] == "test_token"
    
    @pytest.mark.asyncio
    async def test_get_active_sessions_empty(self, async_db, test_room):
        """Test getting active sessions when none exist"""
        manager = SessionManager(async_db)
        
        sessions = await manager.get_active_sessions(test_room.id)
        
        assert len(sessions) == 0


class TestSessionManagerCleanupExpiredSessions:
    """Test SessionManager.cleanup_expired_sessions method"""
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_sessions(self, async_db, test_room, test_player):
        """Test cleaning up expired sessions"""
        manager = SessionManager(async_db)
        
        # Create expired session
        old_time = datetime.utcnow() - timedelta(hours=25)
        expired_session = GameSession(
            room_id=test_room.id,
            player_id=test_player.id,
            session_token="expired_token",
            connected_at=old_time,
            last_heartbeat=old_time,
            is_active=False,
            connection_count=1,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )
        async_db.add(expired_session)
        await async_db.commit()
        
        count = await manager.cleanup_expired_sessions()
        
        assert count == 1
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_sessions_none(self, async_db):
        """Test cleanup when no expired sessions"""
        manager = SessionManager(async_db)
        
        count = await manager.cleanup_expired_sessions()
        
        assert count == 0


class TestGetSessionManager:
    """Test get_session_manager function"""
    
    @pytest.mark.asyncio
    async def test_get_session_manager(self, async_db):
        """Test getting session manager instance"""
        manager = get_session_manager(async_db)
        
        assert isinstance(manager, SessionManager)
        assert manager.db == async_db
