"""
State Checksum Module for Game State Synchronization

This module provides checksum computation and validation for game state integrity.
Checksums are used to detect state desynchronization between clients and server.

The checksum algorithm extracts a canonical representation of the game state,
serializes it to a deterministic JSON string, and computes a SHA-256 hash.
"""

import hashlib
import json
from typing import Dict, Any, Optional
from models import Room


def compute_checksum(state: Room) -> str:
    """
    Compute SHA-256 checksum of game state.
    
    Extracts canonical state representation including version, phase, turn,
    card counts, and scores. The representation is deterministic to ensure
    the same state always produces the same checksum.
    
    Args:
        state: Room model instance containing game state
    
    Returns:
        str: Hex string of SHA-256 hash (64 characters)
    
    Example:
        >>> room = Room(id="ABC123", version=5, game_phase="round1")
        >>> checksum = compute_checksum(room)
        >>> len(checksum)
        64
        >>> checksum.isalnum()
        True
    
    Requirements: 4.4
    """
    # Extract canonical state representation
    canonical = {
        "version": state.version,
        "phase": state.game_phase,
        "current_turn": state.current_turn,
        "round_number": state.round_number,
        "card_counts": {
            "deck": len(state.deck) if state.deck else 0,
            "player1_hand": len(state.player1_hand) if state.player1_hand else 0,
            "player2_hand": len(state.player2_hand) if state.player2_hand else 0,
            "table_cards": len(state.table_cards) if state.table_cards else 0,
            "player1_captured": len(state.player1_captured) if state.player1_captured else 0,
            "player2_captured": len(state.player2_captured) if state.player2_captured else 0,
            "builds": len(state.builds) if state.builds else 0
        },
        "scores": {
            "player1": state.player1_score,
            "player2": state.player2_score
        },
        "flags": {
            "shuffle_complete": state.shuffle_complete,
            "card_selection_complete": state.card_selection_complete,
            "dealing_complete": state.dealing_complete,
            "game_started": state.game_started,
            "game_completed": state.game_completed
        }
    }
    
    # Serialize to deterministic JSON string
    # sort_keys=True ensures consistent ordering
    # separators removes whitespace for consistency
    canonical_json = json.dumps(canonical, sort_keys=True, separators=(',', ':'))
    
    # Compute SHA-256 hash
    hash_obj = hashlib.sha256(canonical_json.encode('utf-8'))
    
    # Return hex string
    return hash_obj.hexdigest()


def validate_checksum(state: Room, expected_checksum: str) -> bool:
    """
    Validate game state checksum against expected value.
    
    Computes the actual checksum of the current state and compares it
    with the expected checksum. Used to detect state desynchronization.
    
    Args:
        state: Room model instance containing game state
        expected_checksum: Expected checksum hex string
    
    Returns:
        bool: True if checksums match, False otherwise
    
    Example:
        >>> room = Room(id="ABC123", version=5)
        >>> checksum = compute_checksum(room)
        >>> validate_checksum(room, checksum)
        True
        >>> validate_checksum(room, "invalid_checksum")
        False
    
    Requirements: 4.5
    """
    if not expected_checksum:
        return False
    
    # Compute actual checksum
    actual_checksum = compute_checksum(state)
    
    # Compare with expected (case-insensitive)
    return actual_checksum.lower() == expected_checksum.lower()


def compute_checksum_from_dict(state_dict: Dict[str, Any]) -> str:
    """
    Compute checksum from state dictionary.
    
    Alternative to compute_checksum() that works with dictionary representation
    of state instead of Room model. Useful for computing checksums on the
    frontend or when working with serialized state.
    
    Args:
        state_dict: Dictionary containing game state fields
    
    Returns:
        str: Hex string of SHA-256 hash (64 characters)
    
    Example:
        >>> state = {
        ...     "version": 5,
        ...     "phase": "round1",
        ...     "current_turn": 1,
        ...     "player1_score": 3,
        ...     "player2_score": 2
        ... }
        >>> checksum = compute_checksum_from_dict(state)
        >>> len(checksum)
        64
    
    Requirements: 4.4
    """
    # Extract canonical representation from dictionary
    canonical = {
        "version": state_dict.get("version", 0),
        "phase": state_dict.get("phase", "waiting"),
        "current_turn": state_dict.get("current_turn", 1),
        "round_number": state_dict.get("round", 0),
        "card_counts": {
            "deck": len(state_dict.get("deck", [])),
            "player1_hand": len(state_dict.get("player1_hand", [])),
            "player2_hand": len(state_dict.get("player2_hand", [])),
            "table_cards": len(state_dict.get("table_cards", [])),
            "player1_captured": len(state_dict.get("player1_captured", [])),
            "player2_captured": len(state_dict.get("player2_captured", [])),
            "builds": len(state_dict.get("builds", []))
        },
        "scores": {
            "player1": state_dict.get("player1_score", 0),
            "player2": state_dict.get("player2_score", 0)
        },
        "flags": {
            "shuffle_complete": state_dict.get("shuffle_complete", False),
            "card_selection_complete": state_dict.get("card_selection_complete", False),
            "dealing_complete": state_dict.get("dealing_complete", False),
            "game_started": state_dict.get("game_started", False),
            "game_completed": state_dict.get("game_completed", False)
        }
    }
    
    # Serialize to deterministic JSON string
    canonical_json = json.dumps(canonical, sort_keys=True, separators=(',', ':'))
    
    # Compute SHA-256 hash
    hash_obj = hashlib.sha256(canonical_json.encode('utf-8'))
    
    # Return hex string
    return hash_obj.hexdigest()
