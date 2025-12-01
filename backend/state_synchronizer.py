"""
State Synchronizer for Game State Synchronization

This module implements the State Synchronizer service which coordinates state updates
between frontend and backend. It is the central component responsible for:
- Processing player actions and updating state
- Managing version numbers and checksums
- Coordinating with Event Store, State Validator, and Conflict Resolver
- Triggering state broadcasts to all clients
- Handling state synchronization on reconnection

The State Synchronizer ensures all players see identical game state at all times
and provides mechanisms for conflict resolution and state recovery.

Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel

from event_store import EventStoreEngine
from state_checksum import compute_checksum, compute_checksum_from_dict
from version_validator import validate_version, get_missing_versions
from validators import (
    validate_card_integrity,
    validate_score_integrity,
    validate_state_transition,
    log_security_event
)
from models import Room
from database import get_db

logger = logging.getLogger(__name__)


class StateUpdateResult(BaseModel):
    """
    Result of a state update operation.
    
    Attributes:
        success: Whether the update succeeded
        state: Updated game state (if successful)
        version: New state version
        checksum: New state checksum
        errors: List of error messages (if failed)
    """
    success: bool
    state: Optional[Dict[str, Any]] = None
    version: int
    checksum: Optional[str] = None
    errors: List[str] = []


class SyncResult(BaseModel):
    """
    Result of a client synchronization operation.
    
    Attributes:
        success: Whether sync succeeded
        current_version: Current server version
        client_version: Client's version
        state: Full game state (if full sync needed)
        missing_events: List of missing events (if incremental sync)
        requires_full_sync: Whether full state sync is required
        message: Human-readable message
    """
    success: bool
    current_version: int
    client_version: int
    state: Optional[Dict[str, Any]] = None
    missing_events: Optional[List[Dict[str, Any]]] = None
    requires_full_sync: bool = False
    message: str


class StateSynchronizer:
    """
    State Synchronizer service for coordinating game state updates.
    
    This class is the central coordinator for state synchronization, managing:
    - State update processing with version tracking
    - Event storage and retrieval
    - State validation and conflict resolution
    - Client synchronization on reconnection
    - Broadcasting state updates to all clients
    
    The State Synchronizer ensures atomicity, consistency, and proper ordering
    of all state changes in the game.
    
    Configuration:
        db: SQLAlchemy database session
        snapshot_interval: Events between snapshots (default: 10)
        max_version_gap: Maximum version gap before requiring full sync (default: 10)
    
    Requirements: 1.1, 8.1
    """
    
    def __init__(
        self,
        db: Session,
        snapshot_interval: int = 10,
        max_version_gap: int = 10
    ):
        """
        Initialize the State Synchronizer.
        
        Args:
            db: SQLAlchemy database session
            snapshot_interval: Number of events between automatic snapshots
            max_version_gap: Maximum version gap before requiring full sync
        """
        self.db = db
        self.snapshot_interval = snapshot_interval
        self.max_version_gap = max_version_gap
        
        # Initialize Event Store Engine
        self.event_store = EventStoreEngine(
            db=db,
            snapshot_interval=snapshot_interval
        )
        
        logger.info(
            f"StateSynchronizer initialized with snapshot_interval={snapshot_interval}, "
            f"max_version_gap={max_version_gap}"
        )
    
    async def process_action(
        self,
        room_id: str,
        player_id: int,
        action_type: str,
        action_data: Dict[str, Any]
    ) -> StateUpdateResult:
        """
        Process a player action and update game state.
        
        This method coordinates the complete state update flow:
        1. Load current state from database
        2. Validate the action (placeholder - full validation in later tasks)
        3. Apply action to state (placeholder - actual game logic in later tasks)
        4. Increment version number
        5. Compute new checksum
        6. Store event in event store
        7. Persist updated state to database
        8. Create snapshot if needed
        9. Return result for broadcasting
        
        The entire operation is atomic - if any step fails, the state is not updated.
        
        Args:
            room_id: Room identifier
            player_id: Player who initiated the action
            action_type: Type of action (capture, build, trail, ready, shuffle, etc.)
            action_data: Action details and parameters
        
        Returns:
            StateUpdateResult: Result containing updated state or errors
        
        Requirements: 1.1, 4.1, 4.4, 5.1
        """
        try:
            # 1. Load current state (async query)
            from sqlalchemy import select
            result = await self.db.execute(
                select(Room).where(Room.id == room_id)
            )
            room = result.scalar_one_or_none()
            if not room:
                return StateUpdateResult(
                    success=False,
                    version=0,
                    errors=[f"Room {room_id} not found"]
                )
            
            current_version = room.version
            logger.debug(
                f"Processing action: room={room_id}, player={player_id}, "
                f"type={action_type}, current_version={current_version}"
            )
            
            # Store old state for validation
            old_phase = room.game_phase
            old_round = room.round_number
            
            # 2. Validate action (placeholder - full validation in task 8)
            # For now, we assume all actions are valid
            # TODO: Implement full validation in task 8.1
            
            # 3. Apply action to state (placeholder - actual game logic integration)
            # For now, we just prepare the state changes structure
            # The actual game logic will be integrated when connecting to existing endpoints
            state_changes = {
                'action_type': action_type,
                'action_data': action_data,
                'player_id': player_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # 3.5. Security validations (Requirement 4.2)
            all_violations = []
            
            # Validate card integrity
            is_card_valid, card_violations = validate_card_integrity(
                room_id=room_id,
                player_id=player_id,
                deck=room.deck,
                player1_hand=room.player1_hand,
                player2_hand=room.player2_hand,
                table_cards=room.table_cards,
                player1_captured=room.player1_captured,
                player2_captured=room.player2_captured,
                builds=room.builds
            )
            all_violations.extend(card_violations)
            
            # Validate score integrity
            is_score_valid, score_violations = validate_score_integrity(
                room_id=room_id,
                player_id=player_id,
                player1_score=room.player1_score,
                player2_score=room.player2_score,
                player1_captured=room.player1_captured,
                player2_captured=room.player2_captured
            )
            all_violations.extend(score_violations)
            
            # Validate state transitions
            is_transition_valid, transition_violations = validate_state_transition(
                room_id=room_id,
                player_id=player_id,
                old_phase=old_phase,
                new_phase=room.game_phase,
                old_round=old_round,
                new_round=room.round_number
            )
            all_violations.extend(transition_violations)
            
            # Log all security violations
            if all_violations:
                log_security_event(room_id, player_id, all_violations)
                
                # Check for critical violations that should block the action
                critical_violations = [v for v in all_violations if v.severity == "critical"]
                if critical_violations:
                    await self.db.rollback()
                    error_messages = [v.description for v in critical_violations]
                    logger.error(
                        f"Action blocked due to critical security violations: "
                        f"room={room_id}, player={player_id}, violations={error_messages}"
                    )
                    return StateUpdateResult(
                        success=False,
                        version=current_version,
                        errors=error_messages
                    )
            
            # 4. Increment version
            new_version = current_version + 1
            room.version = new_version
            room.last_modified = datetime.utcnow()
            room.modified_by = player_id
            
            # 5. Compute checksum
            new_checksum = compute_checksum(room)
            room.checksum = new_checksum
            
            # 6. Store event
            await self.event_store.store_event(
                room_id=room_id,
                action_type=action_type,
                action_data={
                    **action_data,
                    'state_changes': state_changes
                },
                version=new_version,
                player_id=player_id
            )
            
            # 7. Persist state to database
            await self.db.commit()
            await self.db.refresh(room)
            
            # 8. Create snapshot if needed
            state_dict = self._room_to_dict(room)
            await self.event_store.check_and_create_snapshot(
                room_id=room_id,
                current_version=new_version,
                state_data=state_dict
            )
            
            logger.info(
                f"Action processed successfully: room={room_id}, "
                f"new_version={new_version}, checksum={new_checksum[:8]}..."
            )
            
            # 9. Return result
            return StateUpdateResult(
                success=True,
                state=state_dict,
                version=new_version,
                checksum=new_checksum,
                errors=[]
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(
                f"Failed to process action: room={room_id}, error={e}",
                exc_info=True
            )
            return StateUpdateResult(
                success=False,
                version=current_version if 'current_version' in locals() else 0,
                errors=[f"Failed to process action: {str(e)}"]
            )
    
    async def get_current_state(self, room_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current authoritative game state for a room.
        
        This method retrieves the complete current state from the database,
        including version number and checksum for synchronization purposes.
        
        Args:
            room_id: Room identifier
        
        Returns:
            Dictionary containing complete game state with version and checksum,
            or None if room not found
        
        Requirements: 8.1
        """
        try:
            # Load state from database (async query)
            from sqlalchemy import select
            result = await self.db.execute(
                select(Room).where(Room.id == room_id)
            )
            room = result.scalar_one_or_none()
            
            if not room:
                logger.warning(f"Room not found: {room_id}")
                return None
            
            # Convert to dictionary with version and checksum
            state = self._room_to_dict(room)
            
            logger.debug(
                f"Retrieved current state: room={room_id}, "
                f"version={room.version}, checksum={room.checksum[:8] if room.checksum else 'None'}..."
            )
            
            return state
            
        except Exception as e:
            logger.error(
                f"Failed to get current state: room={room_id}, error={e}",
                exc_info=True
            )
            return None
    
    async def sync_client(
        self,
        room_id: str,
        client_version: int
    ) -> SyncResult:
        """
        Synchronize a client to the current server state.
        
        This method handles client synchronization by:
        1. Comparing client version with server version
        2. If versions match, return success (client is in sync)
        3. If client is behind, return missing events or full state
        4. If client is ahead, return error (invalid state)
        
        The method determines whether to send incremental updates (missing events)
        or a full state sync based on the version gap size.
        
        Args:
            room_id: Room identifier
            client_version: Client's current version number
        
        Returns:
            SyncResult: Synchronization result with state or events
        
        Requirements: 8.1, 8.2, 8.3, 8.4
        """
        try:
            # Get current server state
            current_state = await self.get_current_state(room_id)
            
            if not current_state:
                return SyncResult(
                    success=False,
                    current_version=0,
                    client_version=client_version,
                    requires_full_sync=True,
                    message=f"Room {room_id} not found"
                )
            
            server_version = current_state['version']
            
            # Validate version
            validation = validate_version(client_version, server_version)
            
            logger.info(
                f"Sync request: room={room_id}, client_version={client_version}, "
                f"server_version={server_version}, valid={validation.valid}, "
                f"has_gap={validation.has_gap}, gap_size={validation.gap_size}"
            )
            
            # Case 1: Versions match - client is in sync
            if validation.valid and not validation.has_gap:
                return SyncResult(
                    success=True,
                    current_version=server_version,
                    client_version=client_version,
                    requires_full_sync=False,
                    message="Client is in sync"
                )
            
            # Case 2: Client is behind - determine sync strategy
            if validation.has_gap:
                # Check if gap is too large for incremental sync
                if validation.gap_size > self.max_version_gap:
                    # Full state sync required
                    logger.info(
                        f"Full sync required: gap_size={validation.gap_size} > "
                        f"max_version_gap={self.max_version_gap}"
                    )
                    return SyncResult(
                        success=True,
                        current_version=server_version,
                        client_version=client_version,
                        state=current_state,
                        requires_full_sync=True,
                        message=f"Full sync: version gap too large ({validation.gap_size} versions)"
                    )
                
                # Incremental sync - get missing events
                missing_versions = get_missing_versions(client_version, server_version)
                
                try:
                    # Get events for missing versions
                    events = await self.event_store.get_events(
                        room_id=room_id,
                        from_version=client_version + 1,
                        to_version=server_version
                    )
                    
                    # Convert events to dictionaries
                    missing_events = [
                        {
                            'sequence_number': event.sequence_number,
                            'version': event.version,
                            'action_type': event.action_type,
                            'action_data': event.action_data,
                            'player_id': event.player_id,
                            'timestamp': event.timestamp.isoformat(),
                            'checksum': event.checksum
                        }
                        for event in events
                    ]
                    
                    logger.info(
                        f"Incremental sync: returning {len(missing_events)} events "
                        f"for versions {missing_versions}"
                    )
                    
                    return SyncResult(
                        success=True,
                        current_version=server_version,
                        client_version=client_version,
                        missing_events=missing_events,
                        requires_full_sync=False,
                        message=f"Incremental sync: {len(missing_events)} missing events"
                    )
                    
                except Exception as e:
                    # If event retrieval fails, fall back to full sync
                    logger.warning(
                        f"Failed to retrieve events, falling back to full sync: {e}"
                    )
                    return SyncResult(
                        success=True,
                        current_version=server_version,
                        client_version=client_version,
                        state=current_state,
                        requires_full_sync=True,
                        message="Full sync: event retrieval failed"
                    )
            
            # Case 3: Client is ahead - invalid state
            return SyncResult(
                success=False,
                current_version=server_version,
                client_version=client_version,
                state=current_state,
                requires_full_sync=True,
                message=f"Client version ({client_version}) ahead of server ({server_version})"
            )
            
        except Exception as e:
            logger.error(
                f"Failed to sync client: room={room_id}, error={e}",
                exc_info=True
            )
            return SyncResult(
                success=False,
                current_version=0,
                client_version=client_version,
                requires_full_sync=True,
                message=f"Sync failed: {str(e)}"
            )
    
    def _room_to_dict(self, room: Room) -> Dict[str, Any]:
        """
        Convert Room model to dictionary representation.
        
        Args:
            room: Room model instance
        
        Returns:
            Dictionary containing all room state fields
        """
        return {
            'id': room.id,
            'version': room.version,
            'checksum': room.checksum,
            'status': room.status,
            'game_phase': room.game_phase,
            'current_turn': room.current_turn,
            'round_number': room.round_number,
            'deck': room.deck,
            'player1_hand': room.player1_hand,
            'player2_hand': room.player2_hand,
            'table_cards': room.table_cards,
            'builds': room.builds,
            'player1_captured': room.player1_captured,
            'player2_captured': room.player2_captured,
            'player1_score': room.player1_score,
            'player2_score': room.player2_score,
            'shuffle_complete': room.shuffle_complete,
            'card_selection_complete': room.card_selection_complete,
            'dealing_complete': room.dealing_complete,
            'game_started': room.game_started,
            'game_completed': room.game_completed,
            'last_play': room.last_play,
            'last_action': room.last_action,
            'winner': room.winner,
            'player1_ready': room.player1_ready,
            'player2_ready': room.player2_ready,
            'last_modified': room.last_modified.isoformat() if room.last_modified else None,
            'modified_by': room.modified_by
        }
    
    def __repr__(self) -> str:
        return (
            f"<StateSynchronizer(snapshot_interval={self.snapshot_interval}, "
            f"max_version_gap={self.max_version_gap})>"
        )
