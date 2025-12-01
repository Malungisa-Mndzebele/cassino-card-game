"""
Test suite for the /api/sync endpoint

This module tests the state synchronization endpoint that allows clients
to sync their state with the server after reconnection or desynchronization.

Requirements: 8.1, 8.5
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db
from models import Base, Room, Player
from event_store import EventStoreEngine

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def async_engine():
    """Create async test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
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
    """Create test room with initial state"""
    room = Room(
        id="TEST01",
        game_phase="waiting",
        status="active",
        version=5,
        checksum="test_checksum_123"
    )
    async_db.add(room)
    await async_db.commit()
    await async_db.refresh(room)
    return room


@pytest_asyncio.fixture
async def test_room_with_events(async_db, test_room):
    """Create test room with events"""
    event_store = EventStoreEngine(db=async_db)
    
    # Store some events
    for i in range(1, 6):
        await event_store.store_event(
            room_id=test_room.id,
            action_type="test_action",
            action_data={"test": f"data_{i}"},
            version=i,
            player_id=1
        )
    
    return test_room


@pytest_asyncio.fixture
async def client(async_db):
    """Create test client with database override"""
    async def override_get_db():
        yield async_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


class TestSyncEndpoint:
    """Test /api/sync endpoint"""
    
    @pytest.mark.asyncio
    async def test_sync_client_in_sync(self, client, test_room):
        """Test sync when client version matches server version"""
        response = await client.post(
            "/api/sync",
            json={
                "room_id": test_room.id,
                "client_version": 5
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["current_version"] == 5
        assert data["client_version"] == 5
        assert data["requires_full_sync"] is False
        assert data["message"] == "Client is in sync"
        assert data["state"] is None
        assert data["missing_events"] is None
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Requires event_store async fixes from task 2")
    async def test_sync_client_behind_incremental(self, client, test_room_with_events):
        """Test sync when client is behind (incremental sync)"""
        response = await client.post(
            "/api/sync",
            json={
                "room_id": test_room_with_events.id,
                "client_version": 3
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["current_version"] == 5
        assert data["client_version"] == 3
        assert data["requires_full_sync"] is False
        assert "missing events" in data["message"].lower()
        assert data["missing_events"] is not None
        assert len(data["missing_events"]) == 2  # Events for versions 4 and 5
    
    @pytest.mark.asyncio
    async def test_sync_client_behind_full_sync(self, client, test_room, async_db):
        """Test sync when client is far behind (full sync required)"""
        # Update room to have a large version gap
        test_room.version = 20
        async_db.add(test_room)
        await async_db.commit()
        await async_db.refresh(test_room)
        
        response = await client.post(
            "/api/sync",
            json={
                "room_id": test_room.id,
                "client_version": 5
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["current_version"] == 20
        assert data["client_version"] == 5
        assert data["requires_full_sync"] is True
        assert data["state"] is not None
        assert "full sync" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_sync_client_ahead(self, client, test_room):
        """Test sync when client version is ahead of server (error)"""
        response = await client.post(
            "/api/sync",
            json={
                "room_id": test_room.id,
                "client_version": 10
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is False
        assert data["current_version"] == 5
        assert data["client_version"] == 10
        assert data["requires_full_sync"] is True
        assert "ahead" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_sync_room_not_found(self, client):
        """Test sync with non-existent room"""
        response = await client.post(
            "/api/sync",
            json={
                "room_id": "NOTFND",
                "client_version": 5
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is False
        assert "not found" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_sync_invalid_request(self, client):
        """Test sync with invalid request data"""
        response = await client.post(
            "/api/sync",
            json={
                "room_id": "ABC",  # Too short
                "client_version": -1  # Negative version
            }
        )
        
        assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
