"""
Conflict Resolver for Game State Synchronization

This module implements conflict detection and resolution for concurrent game actions.
When two players submit actions within a short time window (100ms), the resolver
determines which actions are valid and which should be rejected using a server-wins
strategy.

Key Features:
- Detect conflicting actions based on timing and affected cards
- Resolve conflicts using server-wins strategy (timestamp order)
- Log all conflicts for analysis and debugging
- Notify affected clients of rejected actions

Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5
"""

import logging
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class GameAction:
    """
    Represents a game action submitted by a player.
    
    Attributes:
        id: Unique action identifier
        player_id: ID of player who submitted action
        action_type: Type of action (capture, build, trail, ready, shuffle)
        card_id: ID of card being played (if applicable)
        target_cards: List of target card IDs (for capture/build)
        build_value: Value for build actions
        client_timestamp: When action was initiated on client (milliseconds)
        server_timestamp: When action was received by server (milliseconds)
        version: State version when action was created
    """
    id: str
    player_id: int
    action_type: str
    card_id: Optional[str] = None
    target_cards: Optional[List[str]] = None
    build_value: Optional[int] = None
    client_timestamp: int = 0
    server_timestamp: int = 0
    version: Optional[int] = None
    
    def get_affected_cards(self) -> Set[str]:
        """Get all card IDs affected by this action"""
        affected = set()
        if self.card_id:
            affected.add(self.card_id)
        if self.target_cards:
            affected.update(self.target_cards)
        return affected


@dataclass
class ResolutionResult:
    """
    Result of conflict resolution.
    
    Attributes:
        final_state: The resolved game state after applying accepted actions
        accepted_actions: List of actions that were accepted
        rejected_actions: List of actions that were rejected
        conflicts_detected: Number of conflicts detected
    """
    final_state: Any  # GameState type
    accepted_actions: List[GameAction]
    rejected_actions: List[GameAction]
    conflicts_detected: int


@dataclass
class Conflict:
    """
    Represents a detected conflict between actions.
    
    Attributes:
        room_id: ID of room where conflict occurred
        action1: First conflicting action
        action2: Second conflicting action
        reason: Description of why actions conflict
        timestamp: When conflict was detected
    """
    room_id: str
    action1: GameAction
    action2: GameAction
    reason: str
    timestamp: datetime


class ConflictResolver:
    """
    Resolves conflicts between concurrent game actions.
    
    This class implements the conflict detection and resolution strategy for
    handling simultaneous actions from multiple players. It uses a server-wins
    approach where actions are processed in timestamp order, and later actions
    are validated against the state created by earlier actions.
    
    Configuration:
        conflict_window_ms: Time window for detecting conflicts (default 100ms)
    
    Requirements: 3.1, 6.1
    """
    
    def __init__(self, conflict_window_ms: int = 100):
        """
        Initialize ConflictResolver.
        
        Args:
            conflict_window_ms: Time window in milliseconds for detecting conflicts.
                               Actions within this window are considered concurrent.
                               Default is 100ms per requirements.
        
        Requirements: 3.1
        """
        self.conflict_window_ms = conflict_window_ms
        self.conflicts_log: List[Conflict] = []
        logger.info(f"ConflictResolver initialized with {conflict_window_ms}ms conflict window")
    
    def detect_conflict(self, action1: GameAction, action2: GameAction) -> bool:
        """
        Check if two actions conflict with each other.
        
        Actions conflict if they:
        1. Occur within the conflict window (100ms by default)
        2. Are from different players
        3. Affect the same cards (overlap in card IDs)
        
        Args:
            action1: First game action
            action2: Second game action
        
        Returns:
            bool: True if actions conflict, False otherwise
        
        Requirements: 3.1
        
        Example:
            >>> resolver = ConflictResolver()
            >>> action1 = GameAction(
            ...     id="a1", player_id=1, action_type="capture",
            ...     card_id="8_hearts", target_cards=["3_spades", "5_diamonds"],
            ...     server_timestamp=1000
            ... )
            >>> action2 = GameAction(
            ...     id="a2", player_id=2, action_type="capture",
            ...     card_id="8_clubs", target_cards=["3_spades"],
            ...     server_timestamp=1050
            ... )
            >>> resolver.detect_conflict(action1, action2)
            True  # Both try to capture 3_spades within 100ms
        """
        # Check if actions are from different players
        if action1.player_id == action2.player_id:
            return False
        
        # Check if actions are within conflict window
        time_diff = abs(action1.server_timestamp - action2.server_timestamp)
        if time_diff > self.conflict_window_ms:
            return False
        
        # Check if actions affect the same cards
        cards1 = action1.get_affected_cards()
        cards2 = action2.get_affected_cards()
        
        has_overlap = len(cards1 & cards2) > 0
        
        if has_overlap:
            logger.debug(
                f"Conflict detected: actions {action1.id} and {action2.id} "
                f"affect overlapping cards within {time_diff}ms"
            )
        
        return has_overlap
    
    def resolve(
        self,
        current_state: Any,
        conflicting_actions: List[GameAction],
        validator: Any
    ) -> ResolutionResult:
        """
        Resolve conflicts using server-wins strategy.
        
        Resolution algorithm:
        1. Sort actions by server timestamp (earliest first)
        2. Apply first action to current state
        3. Validate subsequent actions against new state
        4. Accept valid actions, reject invalid ones
        5. Return final state and lists of accepted/rejected actions
        
        Args:
            current_state: Current game state before any actions
            conflicting_actions: List of potentially conflicting actions
            validator: State validator instance for validating actions
        
        Returns:
            ResolutionResult: Contains final state, accepted/rejected action lists
        
        Requirements: 3.2, 3.3, 6.1, 6.2
        
        Example:
            >>> resolver = ConflictResolver()
            >>> state = get_current_state()
            >>> actions = [action1, action2, action3]
            >>> result = resolver.resolve(state, actions, validator)
            >>> print(f"Accepted: {len(result.accepted_actions)}")
            >>> print(f"Rejected: {len(result.rejected_actions)}")
        """
        # Sort actions by server timestamp (server-wins strategy)
        sorted_actions = sorted(
            conflicting_actions,
            key=lambda a: a.server_timestamp
        )
        
        logger.info(
            f"Resolving {len(sorted_actions)} potentially conflicting actions "
            f"using server-wins strategy"
        )
        
        state = current_state
        accepted = []
        rejected = []
        conflicts_detected = 0
        
        for i, action in enumerate(sorted_actions):
            # Validate action against current state
            is_valid = self._validate_action_against_state(state, action, validator)
            
            if is_valid:
                # Apply action to state
                state = self._apply_action_to_state(state, action)
                accepted.append(action)
                logger.debug(f"Action {action.id} accepted (position {i+1}/{len(sorted_actions)})")
            else:
                # Reject action
                rejected.append(action)
                conflicts_detected += 1
                logger.warning(
                    f"Action {action.id} rejected due to conflict "
                    f"(position {i+1}/{len(sorted_actions)})"
                )
        
        logger.info(
            f"Conflict resolution complete: "
            f"{len(accepted)} accepted, {len(rejected)} rejected, "
            f"{conflicts_detected} conflicts"
        )
        
        return ResolutionResult(
            final_state=state,
            accepted_actions=accepted,
            rejected_actions=rejected,
            conflicts_detected=conflicts_detected
        )
    
    def log_conflict(self, room_id: str, conflict: Conflict) -> None:
        """
        Log a conflict for analysis and debugging.
        
        Conflicts are logged to both the application logger and stored in memory
        for later analysis. This helps identify patterns and troubleshoot issues.
        
        Args:
            room_id: ID of room where conflict occurred
            conflict: Conflict details
        
        Requirements: 6.5
        
        Example:
            >>> resolver = ConflictResolver()
            >>> conflict = Conflict(
            ...     room_id="ABC123",
            ...     action1=action1,
            ...     action2=action2,
            ...     reason="Both players tried to capture same card",
            ...     timestamp=datetime.now()
            ... )
            >>> resolver.log_conflict("ABC123", conflict)
        """
        # Add to in-memory log
        self.conflicts_log.append(conflict)
        
        # Log to application logger
        logger.warning(
            f"Conflict in room {room_id}: {conflict.reason}",
            extra={
                "room_id": room_id,
                "action1_id": conflict.action1.id,
                "action1_player": conflict.action1.player_id,
                "action1_type": conflict.action1.action_type,
                "action2_id": conflict.action2.id,
                "action2_player": conflict.action2.player_id,
                "action2_type": conflict.action2.action_type,
                "time_diff_ms": abs(
                    conflict.action1.server_timestamp - conflict.action2.server_timestamp
                ),
                "timestamp": conflict.timestamp.isoformat()
            }
        )
        
        # Keep only last 1000 conflicts in memory to prevent unbounded growth
        if len(self.conflicts_log) > 1000:
            self.conflicts_log = self.conflicts_log[-1000:]
    
    def get_conflict_stats(self, room_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get conflict statistics for analysis.
        
        Args:
            room_id: Optional room ID to filter stats. If None, returns global stats.
        
        Returns:
            dict: Statistics including total conflicts, conflicts by room, etc.
        """
        conflicts = self.conflicts_log
        if room_id:
            conflicts = [c for c in conflicts if c.room_id == room_id]
        
        return {
            "total_conflicts": len(conflicts),
            "conflicts_by_room": self._count_by_room(conflicts),
            "conflicts_by_action_type": self._count_by_action_type(conflicts),
            "average_time_diff_ms": self._average_time_diff(conflicts)
        }
    
    def _validate_action_against_state(
        self,
        state: Any,
        action: GameAction,
        validator: Any
    ) -> bool:
        """
        Validate if an action is valid against the current state.
        
        This is a helper method that delegates to the state validator.
        
        Args:
            state: Current game state
            action: Action to validate
            validator: State validator instance
        
        Returns:
            bool: True if action is valid, False otherwise
        """
        # This will be implemented to call the actual validator
        # For now, return True as placeholder
        # TODO: Integrate with actual StateValidator
        return True
    
    def _apply_action_to_state(self, state: Any, action: GameAction) -> Any:
        """
        Apply an action to the state and return new state.
        
        This is a helper method that applies the action's effects to the state.
        
        Args:
            state: Current game state
            action: Action to apply
        
        Returns:
            New game state after applying action
        """
        # This will be implemented to actually modify state
        # For now, return state as placeholder
        # TODO: Integrate with actual state modification logic
        return state
    
    def _count_by_room(self, conflicts: List[Conflict]) -> Dict[str, int]:
        """Count conflicts by room ID"""
        counts = {}
        for conflict in conflicts:
            counts[conflict.room_id] = counts.get(conflict.room_id, 0) + 1
        return counts
    
    def _count_by_action_type(self, conflicts: List[Conflict]) -> Dict[str, int]:
        """Count conflicts by action type"""
        counts = {}
        for conflict in conflicts:
            key = f"{conflict.action1.action_type}_{conflict.action2.action_type}"
            counts[key] = counts.get(key, 0) + 1
        return counts
    
    def _average_time_diff(self, conflicts: List[Conflict]) -> float:
        """Calculate average time difference between conflicting actions"""
        if not conflicts:
            return 0.0
        
        total = sum(
            abs(c.action1.server_timestamp - c.action2.server_timestamp)
            for c in conflicts
        )
        return total / len(conflicts)
    
    def create_conflict_notification(
        self,
        rejected_action: GameAction,
        accepted_action: GameAction,
        reason: str
    ) -> Dict[str, Any]:
        """
        Create a conflict notification for a rejected action.
        
        This notification is sent to the client whose action was rejected,
        explaining why the action failed and providing details about the
        conflicting action that was accepted.
        
        Args:
            rejected_action: The action that was rejected
            accepted_action: The action that was accepted (causing the conflict)
            reason: Human-readable explanation of why the action was rejected
        
        Returns:
            dict: Notification message ready to be sent via WebSocket
        
        Requirements: 3.4, 6.3
        
        Example:
            >>> resolver = ConflictResolver()
            >>> notification = resolver.create_conflict_notification(
            ...     rejected_action=action2,
            ...     accepted_action=action1,
            ...     reason="Opponent captured the card first"
            ... )
            >>> # Send via WebSocket: await websocket.send_json(notification)
        """
        notification = {
            "type": "action_rejected",
            "subtype": "conflict",
            "message": reason,
            "rejected_action": {
                "id": rejected_action.id,
                "action_type": rejected_action.action_type,
                "card_id": rejected_action.card_id,
                "target_cards": rejected_action.target_cards,
                "timestamp": rejected_action.server_timestamp
            },
            "conflicting_action": {
                "id": accepted_action.id,
                "player_id": accepted_action.player_id,
                "action_type": accepted_action.action_type,
                "card_id": accepted_action.card_id,
                "target_cards": accepted_action.target_cards,
                "timestamp": accepted_action.server_timestamp
            },
            "time_difference_ms": abs(
                rejected_action.server_timestamp - accepted_action.server_timestamp
            ),
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(
            f"Created conflict notification for action {rejected_action.id} "
            f"(player {rejected_action.player_id})"
        )
        
        return notification
    
    async def send_conflict_notification(
        self,
        websocket_manager: Any,
        player_id: int,
        room_id: str,
        rejected_action: GameAction,
        accepted_action: GameAction,
        reason: str
    ) -> bool:
        """
        Send a conflict notification to the affected player.
        
        This method creates and sends a notification to the player whose action
        was rejected due to a conflict. The notification includes details about
        what happened and why the action was rejected.
        
        Args:
            websocket_manager: WebSocket manager instance for sending messages
            player_id: ID of player to notify (whose action was rejected)
            room_id: Room where conflict occurred
            rejected_action: The action that was rejected
            accepted_action: The action that was accepted
            reason: Human-readable explanation
        
        Returns:
            bool: True if notification was sent successfully, False otherwise
        
        Requirements: 3.4, 6.3
        
        Example:
            >>> resolver = ConflictResolver()
            >>> success = await resolver.send_conflict_notification(
            ...     websocket_manager=ws_manager,
            ...     player_id=2,
            ...     room_id="ABC123",
            ...     rejected_action=action2,
            ...     accepted_action=action1,
            ...     reason="Opponent played first"
            ... )
        """
        # Create notification message
        notification = self.create_conflict_notification(
            rejected_action=rejected_action,
            accepted_action=accepted_action,
            reason=reason
        )
        
        try:
            # Try to send to specific player's session
            # Note: This requires the websocket_manager to have a method
            # to send to a specific player in a room
            # For now, we'll broadcast to the room and let the client filter
            await websocket_manager.broadcast_to_room(notification, room_id)
            
            logger.info(
                f"Sent conflict notification to player {player_id} in room {room_id}"
            )
            return True
            
        except Exception as e:
            logger.error(
                f"Failed to send conflict notification to player {player_id}: {e}"
            )
            return False
