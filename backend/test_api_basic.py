"""
Basic API tests for health check and core endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test the health check endpoint"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert data["status"] in ["healthy", "degraded"]
        assert "database" in data
        assert "redis" in data


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test the root endpoint"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "Casino" in data["message"]


@pytest.mark.asyncio
async def test_create_room():
    """Test creating a new room"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/rooms/create",
            json={"player_name": "TestPlayer"}
        )
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "room_id" in data
        assert "player_id" in data
        assert len(data["room_id"]) == 6  # Room code is 6 characters
        assert data["player_id"] is not None


@pytest.mark.asyncio
async def test_create_room_invalid_name():
    """Test creating room with invalid player name"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # Empty name
        response = await client.post(
            "/rooms/create",
            json={"player_name": ""}
        )
        assert response.status_code == 422  # Validation error
        
        # Name too long
        response = await client.post(
            "/rooms/create",
            json={"player_name": "A" * 100}
        )
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_join_room():
    """Test joining an existing room"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # First create a room
        create_response = await client.post(
            "/rooms/create",
            json={"player_name": "Player1"}
        )
        room_id = create_response.json()["room_id"]
        
        # Then join it
        join_response = await client.post(
            "/rooms/join",
            json={
                "room_id": room_id,
                "player_name": "Player2"
            }
        )
        
        assert join_response.status_code == 200
        data = join_response.json()
        
        assert "player_id" in data
        assert data["player_id"] is not None


@pytest.mark.asyncio
async def test_join_nonexistent_room():
    """Test joining a room that doesn't exist"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/rooms/join",
            json={
                "room_id": "XXXXXX",
                "player_name": "Player1"
            }
        )
        
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_room_state():
    """Test getting room state"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # Create a room
        create_response = await client.post(
            "/rooms/create",
            json={"player_name": "Player1"}
        )
        room_id = create_response.json()["room_id"]
        
        # Get room state
        state_response = await client.get(f"/rooms/{room_id}/state")
        
        assert state_response.status_code == 200
        data = state_response.json()
        
        assert "phase" in data
        assert "players" in data
        assert len(data["players"]) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
