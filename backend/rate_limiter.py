"""
Rate Limiting Module for Casino Card Game API

Provides IP-based and session-based rate limiting to protect against abuse.
Uses Redis for distributed rate limiting across multiple server instances.
"""

import time
import logging
from typing import Tuple
from functools import wraps
from fastapi import HTTPException, Request
from redis_client import redis_client

logger = logging.getLogger(__name__)

# Rate limit configurations: (max_requests, window_seconds)
RATE_LIMITS = {
    "room_create": (10, 60),
    "room_join": (20, 60),
    "game_action": (60, 60),
    "websocket": (10, 60),
    "api_general": (100, 60),
}


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    if forwarded := request.headers.get("X-Forwarded-For"):
        return forwarded.split(",")[0].strip()
    if real_ip := request.headers.get("X-Real-IP"):
        return real_ip
    return request.client.host if request.client else "127.0.0.1"


def _build_rate_limit_headers(limit: int, remaining: int, reset_time: int) -> dict:
    """Build rate limit response headers."""
    retry_after = max(0, reset_time - int(time.time()))
    return {
        "Retry-After": str(retry_after),
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset_time)
    }


async def check_rate_limit(key: str, limit: int, window_seconds: int) -> Tuple[bool, int, int]:
    """
    Check if a rate limit has been exceeded using sliding window.
    
    Returns:
        Tuple of (allowed, remaining, reset_time)
    """
    try:
        redis_key = f"ratelimit:{key}"
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        pipe = redis_client.client.pipeline()
        pipe.zremrangebyscore(redis_key, 0, window_start)
        pipe.zcard(redis_key)
        pipe.zadd(redis_key, {str(current_time): current_time})
        pipe.expire(redis_key, window_seconds + 1)
        
        results = await pipe.execute()
        current_count = results[1]
        
        remaining = max(0, limit - current_count - 1)
        reset_time = current_time + window_seconds
        
        return (current_count < limit, remaining, reset_time)
        
    except Exception as e:
        logger.warning(f"Rate limit check failed: {e}")
        return (True, limit, int(time.time()) + window_seconds)


def _raise_rate_limit_error(limit_type: str, identifier: str, limit: int, remaining: int, reset_time: int):
    """Raise HTTPException for rate limit exceeded."""
    retry_after = reset_time - int(time.time())
    logger.warning(f"Rate limit exceeded for {limit_type}: {identifier}")
    raise HTTPException(
        status_code=429,
        detail={
            "error": "rate_limit_exceeded",
            "message": f"Too many requests. Please try again in {retry_after} seconds.",
            "retry_after": retry_after
        },
        headers=_build_rate_limit_headers(limit, remaining, reset_time)
    )


async def rate_limit_ip(request: Request, limit_type: str = "api_general") -> None:
    """Apply IP-based rate limiting."""
    limit_type = limit_type if limit_type in RATE_LIMITS else "api_general"
    limit, window = RATE_LIMITS[limit_type]
    client_ip = _get_client_ip(request)
    
    allowed, remaining, reset_time = await check_rate_limit(f"{limit_type}:{client_ip}", limit, window)
    
    if not allowed:
        _raise_rate_limit_error(limit_type, client_ip, limit, remaining, reset_time)


async def rate_limit_session(session_id: str, limit_type: str = "game_action") -> None:
    """Apply session-based rate limiting."""
    limit_type = limit_type if limit_type in RATE_LIMITS else "game_action"
    limit, window = RATE_LIMITS[limit_type]
    
    allowed, remaining, reset_time = await check_rate_limit(
        f"{limit_type}:session:{session_id[:16]}", limit, window
    )
    
    if not allowed:
        _raise_rate_limit_error(limit_type, f"{session_id[:8]}...", limit, remaining, reset_time)


def rate_limited(limit_type: str = "api_general"):
    """Decorator for rate-limited endpoints."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request') or next(
                (arg for arg in args if isinstance(arg, Request)), None
            )
            if request:
                await rate_limit_ip(request, limit_type)
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class RateLimitMiddleware:
    """ASGI middleware for global rate limiting."""
    
    def __init__(self, app, limit: int = 100, window: int = 60):
        self.app = app
        self.limit = limit
        self.window = window
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
            
        client_ip = self._extract_client_ip(scope)
        allowed, _, _ = await check_rate_limit(f"global:{client_ip}", self.limit, self.window)
        
        if not allowed:
            await self._send_rate_limit_response(send)
            return
        
        await self.app(scope, receive, send)
    
    def _extract_client_ip(self, scope) -> str:
        """Extract client IP from ASGI scope."""
        client = scope.get("client")
        client_ip = client[0] if client else "127.0.0.1"
        
        headers = dict(scope.get("headers", []))
        if forwarded := headers.get(b"x-forwarded-for", b"").decode():
            client_ip = forwarded.split(",")[0].strip()
        
        return client_ip
    
    async def _send_rate_limit_response(self, send):
        """Send 429 rate limit response."""
        await send({
            "type": "http.response.start",
            "status": 429,
            "headers": [[b"content-type", b"application/json"], [b"retry-after", b"60"]]
        })
        await send({
            "type": "http.response.body",
            "body": b'{"detail": "Too many requests. Please try again later."}'
        })
