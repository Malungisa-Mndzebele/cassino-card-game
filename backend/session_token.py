"""
Session Token Management
Handles creation, validation, and serialization of session tokens
"""

import hmac
import hashlib
import secrets
import json
import base64
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Optional
import os


# Server secret for HMAC signatures (should be in environment variable)
SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "default-secret-key-change-in-production")


@dataclass
class SessionToken:
    """Session token data structure"""
    room_id: str
    player_id: int
    player_name: str
    signature: str
    nonce: str
    created_at: int  # Unix timestamp in milliseconds
    expires_at: int  # Unix timestamp in milliseconds
    version: int = 1
    
    def to_string(self) -> str:
        """Serialize token to base64-encoded JSON string"""
        token_dict = asdict(self)
        json_str = json.dumps(token_dict, separators=(',', ':'))
        encoded = base64.urlsafe_b64encode(json_str.encode('utf-8'))
        return encoded.decode('utf-8')
    
    @classmethod
    def from_string(cls, token_str: str) -> Optional['SessionToken']:
        """Deserialize token from base64-encoded JSON string"""
        try:
            decoded = base64.urlsafe_b64decode(token_str.encode('utf-8'))
            token_dict = json.loads(decoded.decode('utf-8'))
            return cls(**token_dict)
        except Exception:
            return None
    
    def is_expired(self) -> bool:
        """Check if token has expired"""
        now = int(datetime.now().timestamp() * 1000)
        return now > self.expires_at
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return asdict(self)


def generate_signature(room_id: str, player_id: int, created_at: int, nonce: str) -> str:
    """
    Generate HMAC-SHA256 signature for session token
    
    Args:
        room_id: Room identifier
        player_id: Player identifier
        created_at: Creation timestamp
        nonce: Random nonce for uniqueness
        
    Returns:
        Hex-encoded signature string
    """
    # Create payload string
    payload = f"{room_id}:{player_id}:{created_at}:{nonce}"
    
    # Generate HMAC-SHA256 signature
    signature = hmac.new(
        SECRET_KEY.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature


def generate_nonce() -> str:
    """Generate a random nonce for token uniqueness"""
    return secrets.token_urlsafe(16)


def create_session_token(room_id: str, player_id: int, player_name: str) -> SessionToken:
    """
    Create a new session token
    
    Args:
        room_id: Room identifier
        player_id: Player identifier  
        player_name: Player display name
        
    Returns:
        SessionToken object
    """
    # Generate timestamps
    now = datetime.now()
    created_at = int(now.timestamp() * 1000)
    expires_at = int((now + timedelta(hours=24)).timestamp() * 1000)
    
    # Generate nonce
    nonce = generate_nonce()
    
    # Generate signature
    signature = generate_signature(room_id, player_id, created_at, nonce)
    
    # Create token
    token = SessionToken(
        room_id=room_id,
        player_id=player_id,
        player_name=player_name,
        signature=signature,
        nonce=nonce,
        created_at=created_at,
        expires_at=expires_at,
        version=1
    )
    
    return token


def validate_token_signature(token: SessionToken) -> bool:
    """
    Validate the signature of a session token
    
    Args:
        token: SessionToken to validate
        
    Returns:
        True if signature is valid, False otherwise
    """
    # Regenerate signature with token data
    expected_signature = generate_signature(
        token.room_id,
        token.player_id,
        token.created_at,
        token.nonce
    )
    
    # Compare signatures (constant-time comparison to prevent timing attacks)
    return hmac.compare_digest(token.signature, expected_signature)


def validate_token(token: SessionToken) -> tuple[bool, Optional[str]]:
    """
    Validate a session token completely
    
    Args:
        token: SessionToken to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check version compatibility
    if token.version != 1:
        return False, "Unsupported token version"
    
    # Check expiration
    if token.is_expired():
        return False, "Token has expired"
    
    # Validate signature
    if not validate_token_signature(token):
        return False, "Invalid token signature"
    
    return True, None
