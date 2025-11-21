"""
Redis client for session management and caching.

Provides both synchronous and asynchronous Redis clients with
helper methods for common operations.
"""

from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from typing import Optional, Any
import json
import os
from datetime import timedelta


class RedisClient:
    """Redis client wrapper with helper methods"""

    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client: Optional[Redis] = None
        self._async_client: Optional[AsyncRedis] = None

    def get_client(self) -> Redis:
        """Get synchronous Redis client"""
        if self._client is None:
            self._client = Redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30,
            )
        return self._client

    async def get_async_client(self) -> AsyncRedis:
        """Get asynchronous Redis client"""
        if self._async_client is None:
            self._async_client = AsyncRedis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30,
            )
        return self._async_client

    async def set_json(
        self, key: str, value: dict, expire: Optional[int] = None
    ) -> bool:
        """
        Store JSON data in Redis

        Args:
            key: Redis key
            value: Dictionary to store
            expire: Optional expiration time in seconds

        Returns:
            True if successful
        """
        try:
            client = await self.get_async_client()
            serialized = json.dumps(value)
            await client.set(key, serialized, ex=expire)
            return True
        except Exception as e:
            print(f"Error setting JSON in Redis: {e}")
            return False

    async def get_json(self, key: str) -> Optional[dict]:
        """
        Retrieve JSON data from Redis

        Args:
            key: Redis key

        Returns:
            Dictionary if found, None otherwise
        """
        try:
            client = await self.get_async_client()
            data = await client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Error getting JSON from Redis: {e}")
            return None

    async def delete(self, key: str) -> bool:
        """
        Delete key from Redis

        Args:
            key: Redis key

        Returns:
            True if key was deleted
        """
        try:
            client = await self.get_async_client()
            result = await client.delete(key)
            return result > 0
        except Exception as e:
            print(f"Error deleting from Redis: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in Redis

        Args:
            key: Redis key

        Returns:
            True if key exists
        """
        try:
            client = await self.get_async_client()
            result = await client.exists(key)
            return result > 0
        except Exception as e:
            print(f"Error checking existence in Redis: {e}")
            return False

    async def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration time for a key

        Args:
            key: Redis key
            seconds: Expiration time in seconds

        Returns:
            True if successful
        """
        try:
            client = await self.get_async_client()
            return await client.expire(key, seconds)
        except Exception as e:
            print(f"Error setting expiration in Redis: {e}")
            return False

    async def ttl(self, key: str) -> int:
        """
        Get time to live for a key

        Args:
            key: Redis key

        Returns:
            TTL in seconds, -1 if no expiration, -2 if key doesn't exist
        """
        try:
            client = await self.get_async_client()
            return await client.ttl(key)
        except Exception as e:
            print(f"Error getting TTL from Redis: {e}")
            return -2

    async def publish(self, channel: str, message: dict) -> int:
        """
        Publish message to a channel

        Args:
            channel: Channel name
            message: Message dictionary

        Returns:
            Number of subscribers that received the message
        """
        try:
            client = await self.get_async_client()
            serialized = json.dumps(message)
            return await client.publish(channel, serialized)
        except Exception as e:
            print(f"Error publishing to Redis: {e}")
            return 0

    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment a counter

        Args:
            key: Redis key
            amount: Amount to increment by

        Returns:
            New value after increment
        """
        try:
            client = await self.get_async_client()
            return await client.incrby(key, amount)
        except Exception as e:
            print(f"Error incrementing in Redis: {e}")
            return 0

    async def set_with_ttl(self, key: str, value: str, ttl: int) -> bool:
        """
        Set a value with TTL

        Args:
            key: Redis key
            value: Value to store
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        try:
            client = await self.get_async_client()
            await client.setex(key, ttl, value)
            return True
        except Exception as e:
            print(f"Error setting with TTL in Redis: {e}")
            return False

    async def ping(self) -> bool:
        """
        Check if Redis is available

        Returns:
            True if Redis responds to ping
        """
        try:
            client = await self.get_async_client()
            return await client.ping()
        except Exception as e:
            print(f"Redis ping failed: {e}")
            return False

    async def close(self):
        """Close Redis connections"""
        if self._async_client:
            await self._async_client.close()
        if self._client:
            self._client.close()


# Global Redis client instance
redis_client = RedisClient()
