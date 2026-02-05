"""
Rate Limiting Module for Casino Card Game API

Provides IP-based and session-based rate limiting to protect against abuse.
Uses Redis for distributed rate limiting across multiple server instances.

Rate Limits:
    - Room creation: 10 per minute per IP
    - Room join: 20 per minute per IP
    - Game actions: 60 per minute per session
    - WebSocket connections: 5 per minute per IP
"""

import time
import logging
from typing import Optional, Tuple
from functools import wraps
from fastapi import HTTPException, Request
from redis_client import redis_client

logger = logging.getLogger(__name__)

# Rate limit configurations (requests, window_seconds)
RATE_LIMITS = {
    "room_create": (10, 60),      # 10 room creations per minute
    "room_join": (20, 60),        # 20 room joins per minute
    "game_action": (60, 60),      # 60 game actions per minute
    "websocket": (10, 60),        # 10 WebSocket connections per minute
    "api_general": (100, 60),     # 100 general API calls per minute
}


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "127.0.0.1"


async def check_rate_limit(
    key: str,
    limit: int,
    window_seconds: int
) -> Tuple[bool, int, int]:
    """
    Check if a rate limit has been exceeded using sliding window.
    
    Args:
        key: Unique identifier for the rate limit (e.g., "room_create:192.168.1.1")
        limit: Maximum number of requests allowed
        window_seconds: Time window in seconds
        
    Returns:
        Tuple of (allowed, remaining, reset_time)
    """
    try:
        redis_key = f"ratelimit:{key}"
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        # Use Redis pipeline for atomic operations
        pipe = redis_client.client.pipeline()
        
        # Remove old entries outside the window
        pipe.zremrangebyscore(redis_key, 0, window_start)
        
        # Count current requests in window
        pipe.zcard(redis_key)
        
        # Add current request
        pipe.zadd(redis_key, {str(current_time): current_time})
        
        # Set expiry on the key
        pipe.expire(redis_key, window_seconds + 1)
        
        results = await pipe.execute()
        current_count = results[1]
        
        remaining = max(0, limit - current_count - 1)
        reset_time = current_time + window_seconds
        
        if current_count >= limit:
            return False, 0, reset_time
        
        return True, remaining, reset_time
        
    except Exception as e:
        # If Redis fails, allow the request but log the error
        logger.warning(f"Rate limit check failed: {e}")
        return True, limit, int(time.time()) + window_seconds


async def rate_limit_ip(
    request: Request,
    limit_type: str = "api_general"
) -> None:
    """
    Apply IP-based rate limiting.
    
    Args:
        request: FastAPI request object
        limit_type: Type of rate limit to apply
        
    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    if limit_type not in RATE_LIMITS:
        limit_type = "api_general"
    
    limit, window = RATE_LIMITS[limit_type]
    client_ip = _get_client_ip(request)
    key = f"{limit_type}:{client_ip}"
    
    allowed, remaining, reset_time = await check_rate_limit(key, limit, window)
    
    if not allowed:
        logger.warning(f"Rate limit exceeded for {limit_type} from IP {client_ip}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": f"Too many requests. Please try again in {reset_time - int(time.time())} seconds.",
                "retry_after": reset_time - int(time.time())
            },
            headers={
                "Retry-After": str(reset_time - int(time.time())),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(reset_time)
            }
        )


async def rate_limit_session(
    session_id: str,
    limit_type: str = "game_action"
) -> None:
    """
    Apply session-based rate limiting.
    
    Args:
        session_id: Session identifier
        limit_type: Type of rate limit to apply
        
    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    if limit_type not in RATE_LIMITS:
        limit_type = "game_action"
    
    limit, window = RATE_LIMITS[limit_type]
    key = f"{limit_type}:session:{session_id[:16]}"  # Use first 16 chars of session
    
    allowed, remaining, reset_time = await check_rate_limit(key, limit, window)
    
    if not allowed:
        logger.warning(f"Rate limit exceeded for {limit_type} session {session_id[:8]}...")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": "Too many game actions. Please slow down.",
                "retry_after": reset_time - int(time.time())
            },
            headers={
                "Retry-After": str(reset_time - int(time.time())),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(reset_time)
            }
        )


def rate_limited(limit_type: str = "api_general"):
    """
    Decorator for rate-limited endpoints.
    
    Usage:
        @app.post("/rooms/create")
        @rate_limited("room_create")
        async def create_room(request: Request, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the request object in args or kwargs
            request = kwargs.get('request')
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if request:
                await rate_limit_ip(request, limit_type)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class RateLimitMiddleware:
    """
    ASGI middleware for global rate limiting.
    
    Applies a general rate limit to all requests before they reach endpoints.
    """
    
    def __init__(self, app, limit: int = 100, window: int = 60):
        self.app = app
        self.limit = limit
        self.window = window
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Extract client IP from scope
            client = scope.get("client")
            client_ip = client[0] if client else "127.0.0.1"
            
            # Check for forwarded headers
            headers = dict(scope.get("headers", []))
            forwarded = headers.get(b"x-forwarded-for", b"").decode()
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
            
            key = f"global:{client_ip}"
            allowed, _, _ = await check_rate_limit(key, self.limit, self.window)
            
            if not allowed:
                # Return 429 response
                response = {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"retry-after", b"60"]
                    ]
                }
                await send(response)
                
                body = b'{"detail": "Too many requests. Please try again later."}'
                await send({
                    "type": "http.response.body",
                    "body": body
                })
                return
        
        await self.app(scope, receive, send)
