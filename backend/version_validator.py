"""
Version Validator for State Synchronization

This module provides version validation functionality to detect version mismatches,
gaps, and conflicts in game state synchronization.

Requirements: 1.2, 1.3, 1.4
"""

from typing import Optional, List
from pydantic import BaseModel


class ValidationResult(BaseModel):
    """
    Result of version validation.
    
    Attributes:
        valid: Whether the version is valid
        has_gap: Whether there's a version gap
        gap_size: Size of the version gap (if any)
        message: Human-readable message
        requires_sync: Whether a full state sync is required
    """
    valid: bool
    has_gap: bool = False
    gap_size: int = 0
    message: str
    requires_sync: bool = False


def validate_version(client_version: int, server_version: int) -> ValidationResult:
    """
    Validate client version against server version.
    
    This function checks if the client's version is in sync with the server's version
    and detects version gaps that require synchronization.
    
    Args:
        client_version: Version number from the client
        server_version: Current version number on the server
    
    Returns:
        ValidationResult: Validation result with gap detection
    
    Requirements:
        - 1.2: Compare received version with local version
        - 1.3: Reject updates with lower version
        - 1.4: Detect version gaps and fetch missing updates
    
    Examples:
        >>> validate_version(5, 5)
        ValidationResult(valid=True, has_gap=False, message="Version in sync")
        
        >>> validate_version(3, 5)
        ValidationResult(valid=False, has_gap=True, gap_size=2, 
                        message="Version gap detected", requires_sync=True)
        
        >>> validate_version(6, 5)
        ValidationResult(valid=False, has_gap=False, 
                        message="Client version ahead of server", requires_sync=True)
    """
    # Case 1: Versions match - client is in sync
    if client_version == server_version:
        return ValidationResult(
            valid=True,
            has_gap=False,
            gap_size=0,
            message="Version in sync",
            requires_sync=False
        )
    
    # Case 2: Client version is behind server - gap detected
    if client_version < server_version:
        gap_size = server_version - client_version
        
        return ValidationResult(
            valid=False,
            has_gap=True,
            gap_size=gap_size,
            message=f"Version gap detected: client at {client_version}, server at {server_version}",
            requires_sync=True
        )
    
    # Case 3: Client version is ahead of server - invalid state
    # This should not happen in normal operation and indicates a problem
    return ValidationResult(
        valid=False,
        has_gap=False,
        gap_size=0,
        message=f"Client version ({client_version}) ahead of server ({server_version})",
        requires_sync=True
    )


def get_missing_versions(client_version: int, server_version: int) -> List[int]:
    """
    Get list of missing version numbers between client and server.
    
    This is useful for fetching specific events or updates that the client missed.
    
    Args:
        client_version: Version number from the client
        server_version: Current version number on the server
    
    Returns:
        List[int]: List of missing version numbers (empty if no gap)
    
    Requirements:
        - 1.4: Identify missing state updates to fill the gap
    
    Examples:
        >>> get_missing_versions(5, 5)
        []
        
        >>> get_missing_versions(3, 7)
        [4, 5, 6, 7]
        
        >>> get_missing_versions(7, 5)
        []
    """
    if client_version >= server_version:
        return []
    
    # Return all versions from client_version + 1 to server_version (inclusive)
    return list(range(client_version + 1, server_version + 1))


def should_reject_update(client_version: int, update_version: int) -> bool:
    """
    Determine if an update should be rejected based on version.
    
    Updates should be rejected if they are older than the client's current version,
    as this indicates the client has already processed newer state.
    
    Args:
        client_version: Current version on the client
        update_version: Version of the incoming update
    
    Returns:
        bool: True if update should be rejected, False otherwise
    
    Requirements:
        - 1.3: Reject updates with lower version than local version
    
    Examples:
        >>> should_reject_update(5, 6)
        False
        
        >>> should_reject_update(5, 5)
        False
        
        >>> should_reject_update(5, 4)
        True
    """
    return update_version < client_version


def is_version_stale(client_version: int, server_version: int, max_gap: int = 10) -> bool:
    """
    Check if client version is too far behind (stale).
    
    A version is considered stale if the gap exceeds a threshold, indicating
    the client may need a full state resync rather than incremental updates.
    
    Args:
        client_version: Version number from the client
        server_version: Current version number on the server
        max_gap: Maximum acceptable gap before considering stale (default: 10)
    
    Returns:
        bool: True if version is stale, False otherwise
    
    Examples:
        >>> is_version_stale(5, 7)
        False
        
        >>> is_version_stale(1, 15)
        True
        
        >>> is_version_stale(1, 15, max_gap=20)
        False
    """
    if client_version >= server_version:
        return False
    
    gap = server_version - client_version
    return gap > max_gap
