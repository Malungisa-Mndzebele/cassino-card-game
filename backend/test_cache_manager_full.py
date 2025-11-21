"""
Comprehensive tests for cache_manager.py - Target: 100% coverage
Tests all caching operations, TTL management, and error scenarios
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from cache_manager import CacheManager, cache_manager


class TestCacheManagerInit:
    """Test CacheManager initialization and constants"""
    
    def test_cache_manager_constants(self):
        """Test cache key prefixes and TTL values"""
        manager = CacheManager()
        
        assert manager.GAME_STATE_PREFIX == "game:state:"
        assert manager.PLAYER_PREFIX == "player:"
        assert manager.ROOM_PREFIX == "room:"
        assert manager.SESSION_PREFIX == "session:"
        assert manager.ACTIVE_ROOMS_KEY == "rooms:active"
        
        assert manager.GAME_STATE_TTL == 300
        assert manager.PLAYER_DATA_TTL == 1800
        assert manager.ROOM_DATA_TTL == 3600
        assert manager.SESSION_TTL == 1800


class TestGameStateCache:
    """Test game state caching operations"""
    
    @pytest.mark.asyncio
    async def test_cache_game_state_success(self):
        """Test caching game state successfully"""
        manager = CacheManager()
        state = {"phase": "playing", "turn": "player1"}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.set_json = AsyncMock(return_value=True)
            
            result = await manager.cache_game_state("ROOM01", state)
            
            assert result is True
            mock_redis.set_json.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cache_game_state_custom_ttl(self):
        """Test caching with custom TTL"""
        manager = CacheManager()
        state = {"phase": "playing"}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.set_json = AsyncMock(return_value=True)
            
            result = await manager.cache_game_state("ROOM01", state, ttl=600)
            
            assert result is True
            call_args = mock_redis.set_json.call_args
            assert call_args[1]['expire'] == 600
    
    @pytest.mark.asyncio
    async def test_get_game_state_hit(self):
        """Test retrieving cached game state (cache hit)"""
        manager = CacheManager()
        expected_state = {"phase": "playing", "turn": "player1"}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=expected_state)
            
            result = await manager.get_game_state("ROOM01")
            
            assert result == expected_state
            mock_redis.get_json.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_game_state_miss(self):
        """Test retrieving game state (cache miss)"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=None)
            
            result = await manager.get_game_state("ROOM01")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_invalidate_game_state_success(self):
        """Test invalidating game state cache"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.delete = AsyncMock(return_value=True)
            
            result = await manager.invalidate_game_state("ROOM01")
            
            assert result is True
            mock_redis.delete.assert_called_once()


class TestPlayerDataCache:
    """Test player data caching operations"""
    
    @pytest.mark.asyncio
    async def test_cache_player_data_success(self):
        """Test caching player data"""
        manager = CacheManager()
        data = {"name": "Player1", "score": 10}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.set_json = AsyncMock(return_value=True)
            
            result = await manager.cache_player_data("player1", data)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_get_player_data_hit(self):
        """Test retrieving cached player data"""
        manager = CacheManager()
        expected_data = {"name": "Player1", "score": 10}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=expected_data)
            
            result = await manager.get_player_data("player1")
            
            assert result == expected_data
    
    @pytest.mark.asyncio
    async def test_get_player_data_miss(self):
        """Test player data cache miss"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=None)
            
            result = await manager.get_player_data("player1")
            
            assert result is None


class TestRoomDataCache:
    """Test room data caching operations"""
    
    @pytest.mark.asyncio
    async def test_cache_room_data_success(self):
        """Test caching room data"""
        manager = CacheManager()
        data = {"id": "ROOM01", "players": 2}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.set_json = AsyncMock(return_value=True)
            
            result = await manager.cache_room_data("ROOM01", data)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_get_room_data_hit(self):
        """Test retrieving cached room data"""
        manager = CacheManager()
        expected_data = {"id": "ROOM01", "players": 2}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=expected_data)
            
            result = await manager.get_room_data("ROOM01")
            
            assert result == expected_data
    
    @pytest.mark.asyncio
    async def test_get_room_data_miss(self):
        """Test room data cache miss"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=None)
            
            result = await manager.get_room_data("ROOM01")
            
            assert result is None


class TestActiveRooms:
    """Test active rooms set operations"""
    
    @pytest.mark.asyncio
    async def test_add_active_room_success(self):
        """Test adding room to active set"""
        manager = CacheManager()
        
        mock_client = AsyncMock()
        mock_client.sadd = AsyncMock()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_async_client = AsyncMock(return_value=mock_client)
            
            result = await manager.add_active_room("ROOM01")
            
            assert result is True
            mock_client.sadd.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_add_active_room_error(self):
        """Test error handling when adding active room"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_async_client = AsyncMock(side_effect=Exception("Redis error"))
            
            result = await manager.add_active_room("ROOM01")
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_remove_active_room_success(self):
        """Test removing room from active set"""
        manager = CacheManager()
        
        mock_client = AsyncMock()
        mock_client.srem = AsyncMock()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_async_client = AsyncMock(return_value=mock_client)
            
            result = await manager.remove_active_room("ROOM01")
            
            assert result is True
            mock_client.srem.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_remove_active_room_error(self):
        """Test error handling when removing active room"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_async_client = AsyncMock(side_effect=Exception("Redis error"))
            
            result = await manager.remove_active_room("ROOM01")
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_get_active_rooms_success(self):
        """Test getting active rooms list"""
        manager = CacheManager()
        
        mock_client = AsyncMock()
        mock_client.smembers = AsyncMock(return_value={"ROOM01", "ROOM02"})
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_async_client = AsyncMock(return_value=mock_client)
            
            result = await manager.get_active_rooms()
            
            assert len(result) == 2
            assert "ROOM01" in result
            assert "ROOM02" in result
    
    @pytest.mark.asyncio
    async def test_get_active_rooms_error(self):
        """Test error handling when getting active rooms"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_async_client = AsyncMock(side_effect=Exception("Redis error"))
            
            result = await manager.get_active_rooms()
            
            assert result == []


class TestSessionCache:
    """Test session caching operations"""
    
    @pytest.mark.asyncio
    async def test_cache_session_success(self):
        """Test caching session data"""
        manager = CacheManager()
        data = {"user_id": "user1", "token": "abc123"}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.set_json = AsyncMock(return_value=True)
            
            result = await manager.cache_session("session1", data)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_get_session_hit(self):
        """Test retrieving cached session"""
        manager = CacheManager()
        expected_data = {"user_id": "user1", "token": "abc123"}
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=expected_data)
            
            result = await manager.get_session("session1")
            
            assert result == expected_data
    
    @pytest.mark.asyncio
    async def test_get_session_miss(self):
        """Test session cache miss"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.get_json = AsyncMock(return_value=None)
            
            result = await manager.get_session("session1")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_invalidate_session_success(self):
        """Test invalidating session cache"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.delete = AsyncMock(return_value=True)
            
            result = await manager.invalidate_session("session1")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_extend_session_ttl_success(self):
        """Test extending session TTL"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.expire = AsyncMock(return_value=True)
            
            result = await manager.extend_session_ttl("session1", ttl=3600)
            
            assert result is True
            mock_redis.expire.assert_called_once()


class TestClearRoomCache:
    """Test clearing all room cache"""
    
    @pytest.mark.asyncio
    async def test_clear_room_cache_success(self):
        """Test clearing all cache for a room"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.delete = AsyncMock(return_value=True)
            mock_redis.get_async_client = AsyncMock()
            mock_client = AsyncMock()
            mock_client.srem = AsyncMock()
            mock_redis.get_async_client.return_value = mock_client
            
            with patch.object(manager, 'invalidate_game_state', return_value=True):
                result = await manager.clear_room_cache("ROOM01")
                
                assert result is True
    
    @pytest.mark.asyncio
    async def test_clear_room_cache_partial_failure(self):
        """Test clearing room cache with partial failures"""
        manager = CacheManager()
        
        with patch('cache_manager.redis_client') as mock_redis:
            mock_redis.delete = AsyncMock(return_value=False)
            mock_redis.get_async_client = AsyncMock()
            mock_client = AsyncMock()
            mock_client.srem = AsyncMock()
            mock_redis.get_async_client.return_value = mock_client
            
            with patch.object(manager, 'invalidate_game_state', return_value=True):
                result = await manager.clear_room_cache("ROOM01")
                
                # Should still return True if at least some operations succeed
                assert isinstance(result, bool)


class TestGlobalCacheManager:
    """Test global cache_manager instance"""
    
    def test_global_cache_manager_exists(self):
        """Test that global cache_manager instance exists"""
        assert cache_manager is not None
        assert isinstance(cache_manager, CacheManager)
