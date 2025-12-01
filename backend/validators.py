"""
State Validators for Game State Synchronization

This module provides validation functions for game state transitions,
turn order enforcement, and state integrity checks.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)


class TurnViolationTracker:
    """
    Tracks repeated turn violations for security monitoring.
    
    Maintains a count of violations per player to detect potential
    cheating attempts or client bugs.
    """
    
    def __init__(self):
        # Track violations: {room_id: {player_id: count}}
        self.violations: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
        # Track last violation time: {room_id: {player_id: timestamp}}
        self.last_violation: Dict[str, Dict[int, datetime]] = defaultdict(dict)
    
    def record_violation(self, room_id: str, player_id: int) -> int:
        """
        Record a turn violation for a player.
        
        Args:
            room_id: Room identifier
            player_id: Player who violated turn order
        
        Returns:
            int: Total violation count for this player in this room
        """
        self.violations[room_id][player_id] += 1
        self.last_violation[room_id][player_id] = datetime.now()
        count = self.violations[room_id][player_id]
        
        logger.warning(
            f"Turn violation recorded for player {player_id} in room {room_id}. "
            f"Total violations: {count}"
        )
        
        return count
    
    def get_violation_count(self, room_id: str, player_id: int) -> int:
        """Get total violation count for a player in a room."""
        return self.violations.get(room_id, {}).get(player_id, 0)
    
    def reset_violations(self, room_id: str, player_id: Optional[int] = None):
        """
        Reset violation counts.
        
        Args:
            room_id: Room identifier
            player_id: Specific player to reset, or None to reset all in room
        """
        if player_id is None:
            # Reset all players in room
            if room_id in self.violations:
                del self.violations[room_id]
            if room_id in self.last_violation:
                del self.last_violation[room_id]
        else:
            # Reset specific player
            if room_id in self.violations and player_id in self.violations[room_id]:
                del self.violations[room_id][player_id]
            if room_id in self.last_violation and player_id in self.last_violation[room_id]:
                del self.last_violation[room_id][player_id]


# Global violation tracker instance
_violation_tracker = TurnViolationTracker()


def validate_turn_order(
    room_id: str,
    player_id: int,
    current_turn: int,
    action_type: str
) -> Tuple[bool, Optional[str]]:
    """
    Validate that a player is acting on their turn.
    
    Implements Requirement 11.3: WHEN a player attempts an action out of turn,
    THEN THE State_Validator SHALL reject the action with error "Not your turn"
    
    Implements Requirement 11.5: THE State_Validator SHALL prevent any player
    from taking multiple consecutive actions without a turn switch
    
    Args:
        room_id: Room identifier
        player_id: Player attempting the action (1 or 2)
        current_turn: Current turn from game state (1 or 2)
        action_type: Type of action being attempted
    
    Returns:
        tuple: (is_valid, error_message)
            - is_valid: True if action is allowed, False otherwise
            - error_message: None if valid, error description if invalid
    
    Example:
        >>> validate_turn_order("ABC123", 1, 1, "capture")
        (True, None)
        >>> validate_turn_order("ABC123", 2, 1, "capture")
        (False, "Not your turn")
    """
    # Verify player_id matches current_turn
    if player_id != current_turn:
        # Record violation for security monitoring
        violation_count = _violation_tracker.record_violation(room_id, player_id)
        
        # Log security event for repeated violations
        if violation_count >= 3:
            logger.error(
                f"SECURITY: Player {player_id} in room {room_id} has {violation_count} "
                f"turn violations. Possible cheating attempt."
            )
        
        return False, "Not your turn"
    
    return True, None


def validate_turn_complete(
    room_id: str,
    player_id: int,
    action_type: str,
    game_phase: str
) -> Tuple[bool, Optional[str]]:
    """
    Validate that a turn is complete before switching to next player.
    
    Implements Requirement 11.1: WHEN a player completes their turn,
    THEN THE State_Validator SHALL verify the turn is complete before
    switching to the next player
    
    Args:
        room_id: Room identifier
        player_id: Player who just acted
        action_type: Type of action that was performed
        game_phase: Current game phase
    
    Returns:
        tuple: (is_complete, error_message)
            - is_complete: True if turn can switch, False otherwise
            - error_message: None if complete, reason if not
    
    Example:
        >>> validate_turn_complete("ABC123", 1, "capture", "round1")
        (True, None)
    """
    # In Casino card game, each action completes a turn
    # (capture, build, or trail all end the turn)
    valid_turn_ending_actions = ["capture", "build", "trail"]
    
    if action_type in valid_turn_ending_actions:
        return True, None
    
    # Actions like "ready" or "shuffle" don't end turns
    return False, f"Action '{action_type}' does not complete a turn"


def get_next_turn(current_turn: int) -> int:
    """
    Get the next player's turn.
    
    Implements Requirement 11.2: WHEN THE State_Validator SHALL update the current_turn field
    
    Args:
        current_turn: Current player's turn (1 or 2)
    
    Returns:
        int: Next player's turn (1 or 2)
    
    Example:
        >>> get_next_turn(1)
        2
        >>> get_next_turn(2)
        1
    """
    return 2 if current_turn == 1 else 1


def reset_turn_violations(room_id: str, player_id: Optional[int] = None):
    """
    Reset turn violation tracking for a room or player.
    
    Should be called when:
    - Game starts/restarts
    - Player reconnects
    - Room is cleaned up
    
    Args:
        room_id: Room identifier
        player_id: Specific player to reset, or None to reset all
    """
    _violation_tracker.reset_violations(room_id, player_id)


def get_turn_violation_count(room_id: str, player_id: int) -> int:
    """
    Get the number of turn violations for a player.
    
    Useful for monitoring and security checks.
    
    Args:
        room_id: Room identifier
        player_id: Player to check
    
    Returns:
        int: Number of violations
    """
    return _violation_tracker.get_violation_count(room_id, player_id)


class SecurityViolation:
    """
    Represents a security violation detected during state validation.
    
    Attributes:
        violation_type: Type of security violation
        severity: Severity level (low, medium, high, critical)
        description: Human-readable description
        details: Additional details as dict
    """
    
    def __init__(
        self,
        violation_type: str,
        severity: str,
        description: str,
        details: Optional[Dict[str, Any]] = None
    ):
        self.violation_type = violation_type
        self.severity = severity
        self.description = description
        self.details = details or {}
        self.timestamp = datetime.now()


def validate_card_integrity(
    room_id: str,
    player_id: int,
    deck: List[Dict],
    player1_hand: List[Dict],
    player2_hand: List[Dict],
    table_cards: List[Dict],
    player1_captured: List[Dict],
    player2_captured: List[Dict],
    builds: List[Dict]
) -> Tuple[bool, List[SecurityViolation]]:
    """
    Validate card integrity to detect duplication attempts.
    
    Implements Requirement 4.2: Detect card duplication attempts
    
    Checks:
    - Total card count equals 52
    - No duplicate cards across all locations
    - All card IDs are valid
    
    Args:
        room_id: Room identifier
        player_id: Player who triggered the state change
        deck: Cards in deck
        player1_hand: Player 1's hand
        player2_hand: Player 2's hand
        table_cards: Cards on table
        player1_captured: Player 1's captured cards
        player2_captured: Player 2's captured cards
        builds: Active builds
    
    Returns:
        tuple: (is_valid, violations)
            - is_valid: True if no violations, False otherwise
            - violations: List of SecurityViolation objects
    
    Example:
        >>> is_valid, violations = validate_card_integrity(
        ...     "ABC123", 1, deck, p1_hand, p2_hand, table, p1_cap, p2_cap, builds
        ... )
        >>> if not is_valid:
        ...     for v in violations:
        ...         print(f"Security violation: {v.description}")
    """
    violations = []
    
    # Collect all card IDs
    all_card_ids = []
    
    # Add cards from deck
    for card in deck:
        if isinstance(card, dict) and 'id' in card:
            all_card_ids.append(card['id'])
    
    # Add cards from player hands
    for card in player1_hand:
        if isinstance(card, dict) and 'id' in card:
            all_card_ids.append(card['id'])
    
    for card in player2_hand:
        if isinstance(card, dict) and 'id' in card:
            all_card_ids.append(card['id'])
    
    # Add cards from table
    for card in table_cards:
        if isinstance(card, dict) and 'id' in card:
            all_card_ids.append(card['id'])
    
    # Add cards from captured piles
    for card in player1_captured:
        if isinstance(card, dict) and 'id' in card:
            all_card_ids.append(card['id'])
    
    for card in player2_captured:
        if isinstance(card, dict) and 'id' in card:
            all_card_ids.append(card['id'])
    
    # Add cards from builds
    for build in builds:
        if isinstance(build, dict) and 'cards' in build:
            for card in build['cards']:
                if isinstance(card, dict) and 'id' in card:
                    all_card_ids.append(card['id'])
    
    # Check total card count
    total_cards = len(all_card_ids)
    if total_cards != 52:
        violation = SecurityViolation(
            violation_type="invalid_card_count",
            severity="critical",
            description=f"Invalid total card count: {total_cards} (expected 52)",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "total_cards": total_cards,
                "deck": len(deck),
                "p1_hand": len(player1_hand),
                "p2_hand": len(player2_hand),
                "table": len(table_cards),
                "p1_captured": len(player1_captured),
                "p2_captured": len(player2_captured),
                "builds": sum(len(b.get('cards', [])) for b in builds)
            }
        )
        violations.append(violation)
        
        logger.error(
            f"SECURITY: Invalid card count in room {room_id} by player {player_id}. "
            f"Total: {total_cards}, Expected: 52"
        )
    
    # Check for duplicate cards
    card_counts = {}
    for card_id in all_card_ids:
        card_counts[card_id] = card_counts.get(card_id, 0) + 1
    
    duplicates = {card_id: count for card_id, count in card_counts.items() if count > 1}
    
    if duplicates:
        violation = SecurityViolation(
            violation_type="card_duplication",
            severity="critical",
            description=f"Duplicate cards detected: {list(duplicates.keys())}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "duplicates": duplicates
            }
        )
        violations.append(violation)
        
        logger.error(
            f"SECURITY: Card duplication detected in room {room_id} by player {player_id}. "
            f"Duplicates: {duplicates}"
        )
    
    # Validate card IDs format
    valid_ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    valid_suits = ['hearts', 'diamonds', 'clubs', 'spades']
    
    invalid_cards = []
    for card_id in all_card_ids:
        if '_' not in card_id:
            invalid_cards.append(card_id)
            continue
        
        parts = card_id.split('_')
        if len(parts) != 2:
            invalid_cards.append(card_id)
            continue
        
        rank, suit = parts
        if rank not in valid_ranks or suit not in valid_suits:
            invalid_cards.append(card_id)
    
    if invalid_cards:
        violation = SecurityViolation(
            violation_type="invalid_card_format",
            severity="high",
            description=f"Invalid card IDs detected: {invalid_cards}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "invalid_cards": invalid_cards
            }
        )
        violations.append(violation)
        
        logger.error(
            f"SECURITY: Invalid card format in room {room_id} by player {player_id}. "
            f"Invalid cards: {invalid_cards}"
        )
    
    return len(violations) == 0, violations


def validate_score_integrity(
    room_id: str,
    player_id: int,
    player1_score: int,
    player2_score: int,
    player1_captured: List[Dict],
    player2_captured: List[Dict]
) -> Tuple[bool, List[SecurityViolation]]:
    """
    Validate score integrity to detect score manipulation.
    
    Implements Requirement 4.2: Detect score manipulation
    
    Checks:
    - Scores match captured cards
    - Scores are within valid range (0-21)
    - Score calculations follow game rules
    
    Args:
        room_id: Room identifier
        player_id: Player who triggered the state change
        player1_score: Player 1's current score
        player2_score: Player 2's current score
        player1_captured: Player 1's captured cards
        player2_captured: Player 2's captured cards
    
    Returns:
        tuple: (is_valid, violations)
            - is_valid: True if no violations, False otherwise
            - violations: List of SecurityViolation objects
    
    Example:
        >>> is_valid, violations = validate_score_integrity(
        ...     "ABC123", 1, 5, 3, p1_captured, p2_captured
        ... )
    """
    violations = []
    
    # Calculate expected scores based on captured cards
    def calculate_expected_score(captured_cards: List[Dict]) -> int:
        score = 0
        
        # Count aces (1 point each)
        aces = sum(1 for card in captured_cards 
                  if isinstance(card, dict) and card.get('rank') == 'A')
        score += aces
        
        # 2 of spades (1 point)
        has_big_casino = any(
            isinstance(card, dict) and 
            card.get('rank') == '2' and 
            card.get('suit') == 'spades'
            for card in captured_cards
        )
        if has_big_casino:
            score += 1
        
        # 10 of diamonds (2 points)
        has_little_casino = any(
            isinstance(card, dict) and 
            card.get('rank') == '10' and 
            card.get('suit') == 'diamonds'
            for card in captured_cards
        )
        if has_little_casino:
            score += 2
        
        return score
    
    # Calculate expected base scores (without bonuses)
    expected_p1_base = calculate_expected_score(player1_captured)
    expected_p2_base = calculate_expected_score(player2_captured)
    
    # Maximum possible score is 21 (7 base + 4 bonuses + 10 for winning multiple rounds)
    # But in a single game, max is around 11-15
    max_reasonable_score = 21
    
    # Check if scores are within reasonable range
    if player1_score < 0 or player1_score > max_reasonable_score:
        violation = SecurityViolation(
            violation_type="invalid_score_range",
            severity="critical",
            description=f"Player 1 score out of range: {player1_score}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "score": player1_score,
                "min": 0,
                "max": max_reasonable_score
            }
        )
        violations.append(violation)
        
        logger.error(
            f"SECURITY: Invalid score range for player 1 in room {room_id}. "
            f"Score: {player1_score}"
        )
    
    if player2_score < 0 or player2_score > max_reasonable_score:
        violation = SecurityViolation(
            violation_type="invalid_score_range",
            severity="critical",
            description=f"Player 2 score out of range: {player2_score}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "score": player2_score,
                "min": 0,
                "max": max_reasonable_score
            }
        )
        violations.append(violation)
        
        logger.error(
            f"SECURITY: Invalid score range for player 2 in room {room_id}. "
            f"Score: {player2_score}"
        )
    
    # Check if scores are at least the base score (can be higher due to bonuses)
    # Allow up to 4 bonus points (2 for most cards, 2 for most spades)
    max_bonus = 4
    
    if player1_score < expected_p1_base:
        violation = SecurityViolation(
            violation_type="score_too_low",
            severity="high",
            description=f"Player 1 score too low: {player1_score} < {expected_p1_base}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "actual_score": player1_score,
                "expected_base": expected_p1_base,
                "captured_cards": len(player1_captured)
            }
        )
        violations.append(violation)
        
        logger.warning(
            f"SECURITY: Player 1 score too low in room {room_id}. "
            f"Actual: {player1_score}, Expected base: {expected_p1_base}"
        )
    
    if player1_score > expected_p1_base + max_bonus:
        violation = SecurityViolation(
            violation_type="score_too_high",
            severity="high",
            description=f"Player 1 score too high: {player1_score} > {expected_p1_base + max_bonus}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "actual_score": player1_score,
                "expected_base": expected_p1_base,
                "max_with_bonus": expected_p1_base + max_bonus,
                "captured_cards": len(player1_captured)
            }
        )
        violations.append(violation)
        
        logger.warning(
            f"SECURITY: Player 1 score too high in room {room_id}. "
            f"Actual: {player1_score}, Expected max: {expected_p1_base + max_bonus}"
        )
    
    if player2_score < expected_p2_base:
        violation = SecurityViolation(
            violation_type="score_too_low",
            severity="high",
            description=f"Player 2 score too low: {player2_score} < {expected_p2_base}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "actual_score": player2_score,
                "expected_base": expected_p2_base,
                "captured_cards": len(player2_captured)
            }
        )
        violations.append(violation)
        
        logger.warning(
            f"SECURITY: Player 2 score too low in room {room_id}. "
            f"Actual: {player2_score}, Expected base: {expected_p2_base}"
        )
    
    if player2_score > expected_p2_base + max_bonus:
        violation = SecurityViolation(
            violation_type="score_too_high",
            severity="high",
            description=f"Player 2 score too high: {player2_score} > {expected_p2_base + max_bonus}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "actual_score": player2_score,
                "expected_base": expected_p2_base,
                "max_with_bonus": expected_p2_base + max_bonus,
                "captured_cards": len(player2_captured)
            }
        )
        violations.append(violation)
        
        logger.warning(
            f"SECURITY: Player 2 score too high in room {room_id}. "
            f"Actual: {player2_score}, Expected max: {expected_p2_base + max_bonus}"
        )
    
    return len(violations) == 0, violations


def validate_state_transition(
    room_id: str,
    player_id: int,
    old_phase: str,
    new_phase: str,
    old_round: int,
    new_round: int
) -> Tuple[bool, List[SecurityViolation]]:
    """
    Validate state transitions to detect impossible transitions.
    
    Implements Requirement 4.2: Detect impossible state transitions
    
    Checks:
    - Phase transitions follow valid game flow
    - Round numbers increment correctly
    - No skipping phases
    
    Args:
        room_id: Room identifier
        player_id: Player who triggered the state change
        old_phase: Previous game phase
        new_phase: New game phase
        old_round: Previous round number
        new_round: New round number
    
    Returns:
        tuple: (is_valid, violations)
            - is_valid: True if no violations, False otherwise
            - violations: List of SecurityViolation objects
    
    Example:
        >>> is_valid, violations = validate_state_transition(
        ...     "ABC123", 1, "waiting", "round1", 0, 1
        ... )
    """
    violations = []
    
    # Valid phase transitions
    valid_transitions = {
        'waiting': ['cardSelection', 'dealer'],
        'cardSelection': ['dealer'],
        'dealer': ['dealing', 'round1'],
        'dealing': ['round1'],
        'round1': ['round2', 'finished'],
        'round2': ['finished'],
        'finished': ['waiting']  # For new game
    }
    
    # Check if phase transition is valid
    if old_phase != new_phase:
        allowed_next_phases = valid_transitions.get(old_phase, [])
        
        if new_phase not in allowed_next_phases:
            violation = SecurityViolation(
                violation_type="invalid_phase_transition",
                severity="critical",
                description=f"Invalid phase transition: {old_phase} -> {new_phase}",
                details={
                    "room_id": room_id,
                    "player_id": player_id,
                    "old_phase": old_phase,
                    "new_phase": new_phase,
                    "allowed_phases": allowed_next_phases
                }
            )
            violations.append(violation)
            
            logger.error(
                f"SECURITY: Invalid phase transition in room {room_id} by player {player_id}. "
                f"From {old_phase} to {new_phase}"
            )
    
    # Check round number transitions
    if new_round < old_round:
        violation = SecurityViolation(
            violation_type="round_number_decreased",
            severity="critical",
            description=f"Round number decreased: {old_round} -> {new_round}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "old_round": old_round,
                "new_round": new_round
            }
        )
        violations.append(violation)
        
        logger.error(
            f"SECURITY: Round number decreased in room {room_id} by player {player_id}. "
            f"From {old_round} to {new_round}"
        )
    
    if new_round > old_round + 1:
        violation = SecurityViolation(
            violation_type="round_number_skipped",
            severity="high",
            description=f"Round number skipped: {old_round} -> {new_round}",
            details={
                "room_id": room_id,
                "player_id": player_id,
                "old_round": old_round,
                "new_round": new_round
            }
        )
        violations.append(violation)
        
        logger.warning(
            f"SECURITY: Round number skipped in room {room_id} by player {player_id}. "
            f"From {old_round} to {new_round}"
        )
    
    # Round should only change during specific phase transitions
    if new_round != old_round:
        valid_round_change_phases = ['round1', 'round2', 'finished']
        if old_phase not in valid_round_change_phases:
            violation = SecurityViolation(
                violation_type="invalid_round_change",
                severity="high",
                description=f"Round changed during invalid phase: {old_phase}",
                details={
                    "room_id": room_id,
                    "player_id": player_id,
                    "phase": old_phase,
                    "old_round": old_round,
                    "new_round": new_round
                }
            )
            violations.append(violation)
            
            logger.warning(
                f"SECURITY: Round changed during invalid phase in room {room_id}. "
                f"Phase: {old_phase}, Round: {old_round} -> {new_round}"
            )
    
    return len(violations) == 0, violations


def log_security_event(
    room_id: str,
    player_id: int,
    violations: List[SecurityViolation]
):
    """
    Log security events for monitoring and analysis.
    
    Implements Requirement 4.2: Log security events
    
    Creates structured log entries for all security violations with
    appropriate severity levels and details for investigation.
    
    Args:
        room_id: Room identifier
        player_id: Player who triggered the violations
        violations: List of SecurityViolation objects
    
    Example:
        >>> violations = [SecurityViolation(...)]
        >>> log_security_event("ABC123", 1, violations)
    """
    if not violations:
        return
    
    # Group violations by severity
    critical = [v for v in violations if v.severity == "critical"]
    high = [v for v in violations if v.severity == "high"]
    medium = [v for v in violations if v.severity == "medium"]
    low = [v for v in violations if v.severity == "low"]
    
    # Log critical violations
    for violation in critical:
        logger.error(
            f"SECURITY VIOLATION [CRITICAL]: {violation.description}",
            extra={
                "room_id": room_id,
                "player_id": player_id,
                "violation_type": violation.violation_type,
                "severity": violation.severity,
                "timestamp": violation.timestamp.isoformat(),
                "details": violation.details
            }
        )
    
    # Log high severity violations
    for violation in high:
        logger.error(
            f"SECURITY VIOLATION [HIGH]: {violation.description}",
            extra={
                "room_id": room_id,
                "player_id": player_id,
                "violation_type": violation.violation_type,
                "severity": violation.severity,
                "timestamp": violation.timestamp.isoformat(),
                "details": violation.details
            }
        )
    
    # Log medium severity violations
    for violation in medium:
        logger.warning(
            f"SECURITY VIOLATION [MEDIUM]: {violation.description}",
            extra={
                "room_id": room_id,
                "player_id": player_id,
                "violation_type": violation.violation_type,
                "severity": violation.severity,
                "timestamp": violation.timestamp.isoformat(),
                "details": violation.details
            }
        )
    
    # Log low severity violations
    for violation in low:
        logger.info(
            f"SECURITY VIOLATION [LOW]: {violation.description}",
            extra={
                "room_id": room_id,
                "player_id": player_id,
                "violation_type": violation.violation_type,
                "severity": violation.severity,
                "timestamp": violation.timestamp.isoformat(),
                "details": violation.details
            }
        )
    
    # Log summary
    logger.info(
        f"Security validation completed for room {room_id}, player {player_id}. "
        f"Total violations: {len(violations)} "
        f"(Critical: {len(critical)}, High: {len(high)}, "
        f"Medium: {len(medium)}, Low: {len(low)})"
    )
