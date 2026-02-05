"""
CSRF Protection Module for Casino Card Game API

Provides CSRF token generation and validation to protect against
Cross-Site Request Forgery attacks on state-changing operations.

Usage:
    - Generate token on session creation
    - Validate token on POST/PUT/DELETE requests
    - Token is tied to session for additional security
"""

import secrets
import hashlib
import logging
from typing import Optional, Tuple
from fastapi import Request, HTTPException
from redis_client import redis_client

logger = logging.getLogger(__name__)

# CSRF token configuration
CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_TTL = 3600  # 1 hour
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def hash_token(token: str, session_id: str) -> str:
    """Hash token with session ID for storage."""
    combined = f"{token}:{session_id}"
    return hashlib.sha256(combined.encode()).hexdigest()


async def create_csrf_token(session_id: str) -> str:
    """
    Create and store a CSRF token for a session.
    
    Args:
        session_id: The session identifier to bind the token to
        
    Returns:
        The generated CSRF token
    """
    token = generate_csrf_token()
    token_hash = hash_token(token, session_id)
    
    # Store token hash in Redis
    cache_key = f"csrf:{session_id}"
    try:
        await redis_client.set_json(
            cache_key,
            {"token_hash": token_hash},
            expire=CSRF_TOKEN_TTL
        )
        logger.debug(f"CSRF token created for session")
    except Exception as e:
        logger.warning(f"Failed to store CSRF token in Redis: {e}")
    
    return token


async def validate_csrf_token(
    token: str,
    session_id: str
) -> Tuple[bool, Optional[str]]:
    """
    Validate a CSRF token against the stored hash.
    
    Args:
        token: The CSRF token from the request
        session_id: The session identifier
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not token:
        return False, "CSRF token missing"
    
    if not session_id:
        return False, "Session ID missing"
    
    # Get stored token hash
    cache_key = f"csrf:{session_id}"
    try:
        stored_data = await redis_client.get_json(cache_key)
        if not stored_data:
            return False, "CSRF token expired or invalid"
        
        stored_hash = stored_data.get("token_hash")
        if not stored_hash:
            return False, "CSRF token data corrupted"
        
        # Verify token
        expected_hash = hash_token(token, session_id)
        if not secrets.compare_digest(stored_hash, expected_hash):
            logger.warning(f"CSRF token mismatch for session")
            return False, "CSRF token invalid"
        
        return True, None
        
    except Exception as e:
        logger.error(f"CSRF validation error: {e}")
        # Allow request if Redis fails (fail open for availability)
        return True, None


async def refresh_csrf_token(session_id: str) -> str:
    """
    Refresh the CSRF token for a session.
    
    Args:
        session_id: The session identifier
        
    Returns:
        The new CSRF token
    """
    # Delete old token
    cache_key = f"csrf:{session_id}"
    try:
        await redis_client.delete(cache_key)
    except Exception as e:
        logger.warning(f"Failed to delete old CSRF token: {e}")
    
    # Create new token
    return await create_csrf_token(session_id)


async def csrf_protect(request: Request, session_id: Optional[str] = None) -> None:
    """
    Middleware-style function to validate CSRF token on requests.
    
    Args:
        request: FastAPI request object
        session_id: Optional session ID (extracted from request if not provided)
        
    Raises:
        HTTPException: 403 if CSRF validation fails
    """
    # Skip CSRF check for safe methods
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    
    # Get CSRF token from header
    csrf_token = request.headers.get(CSRF_HEADER_NAME)
    
    # Get session ID from request if not provided
    if not session_id:
        # Try to get from session token in header or cookie
        session_id = request.headers.get("X-Session-Token")
        if not session_id:
            session_id = request.cookies.get("session_token")
    
    # If no session, skip CSRF (unauthenticated request)
    if not session_id:
        return
    
    # Validate token
    is_valid, error = await validate_csrf_token(csrf_token or "", session_id)
    
    if not is_valid:
        logger.warning(f"CSRF validation failed: {error}")
        raise HTTPException(
            status_code=403,
            detail={
                "error": "csrf_validation_failed",
                "message": error or "CSRF token validation failed"
            }
        )
