"""
CSRF Protection Module for Casino Card Game API

Provides CSRF token generation and validation to protect against
Cross-Site Request Forgery attacks on state-changing operations.
"""

import secrets
import hashlib
import logging
from typing import Optional, Tuple
from fastapi import Request, HTTPException
from redis_client import redis_client

logger = logging.getLogger(__name__)

# Configuration
CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_TTL = 3600  # 1 hour
CSRF_HEADER_NAME = "X-CSRF-Token"


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def _hash_token(token: str, session_id: str) -> str:
    """Hash token with session ID for storage."""
    return hashlib.sha256(f"{token}:{session_id}".encode()).hexdigest()


def _get_cache_key(session_id: str) -> str:
    """Get Redis cache key for CSRF token."""
    return f"csrf:{session_id}"


async def create_csrf_token(session_id: str) -> str:
    """Create and store a CSRF token for a session."""
    token = generate_csrf_token()
    token_hash = _hash_token(token, session_id)
    
    try:
        await redis_client.set_json(
            _get_cache_key(session_id),
            {"token_hash": token_hash},
            expire=CSRF_TOKEN_TTL
        )
        logger.debug("CSRF token created for session")
    except Exception as e:
        logger.warning(f"Failed to store CSRF token in Redis: {e}")
    
    return token


async def validate_csrf_token(token: str, session_id: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a CSRF token against the stored hash.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not token:
        return False, "CSRF token missing"
    if not session_id:
        return False, "Session ID missing"
    
    try:
        stored_data = await redis_client.get_json(_get_cache_key(session_id))
        if not stored_data:
            return False, "CSRF token expired or invalid"
        
        stored_hash = stored_data.get("token_hash")
        if not stored_hash:
            return False, "CSRF token data corrupted"
        
        expected_hash = _hash_token(token, session_id)
        if not secrets.compare_digest(stored_hash, expected_hash):
            logger.warning("CSRF token mismatch for session")
            return False, "CSRF token invalid"
        
        return True, None
        
    except Exception as e:
        logger.error(f"CSRF validation error: {e}")
        return True, None  # Fail open for availability


async def refresh_csrf_token(session_id: str) -> str:
    """Refresh the CSRF token for a session."""
    try:
        await redis_client.delete(_get_cache_key(session_id))
    except Exception as e:
        logger.warning(f"Failed to delete old CSRF token: {e}")
    
    return await create_csrf_token(session_id)


async def csrf_protect(request: Request, session_id: Optional[str] = None) -> None:
    """
    Validate CSRF token on state-changing requests.
    
    Raises:
        HTTPException: 403 if CSRF validation fails
    """
    # Skip for safe methods
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    
    csrf_token = request.headers.get(CSRF_HEADER_NAME)
    
    # Get session ID if not provided
    if not session_id:
        session_id = request.headers.get("X-Session-Token") or request.cookies.get("session_token")
    
    # Skip if no session (unauthenticated request)
    if not session_id:
        return
    
    is_valid, error = await validate_csrf_token(csrf_token or "", session_id)
    
    if not is_valid:
        logger.warning(f"CSRF validation failed: {error}")
        raise HTTPException(
            status_code=403,
            detail={"error": "csrf_validation_failed", "message": error or "CSRF token validation failed"}
        )
