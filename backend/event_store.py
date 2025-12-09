"""
Event Store Engine for Game State Synchronization

This module implements the Event Store Engine which is responsible for:
- Storing all game actions as immutable events
- Maintaining event sequence and version tracking
- Supporting event replay for state reconstruction
- Creating and managing state snapshots for performance optimization

The Event Store Engine is a core component of the state synchronization system,
enabling audit trails, state recovery, and conflict resolution.
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, and_, select

from models import GameEvent, StateSnapshot, Room
from database import get_db

logger = logging.getLogger(__name__)


class EventStoreEngine:
    """
    Event Store Engine for managing game events and state snapshots.
    
    This class provides the core functionality for event sourcing in the game:
    - Store events with sequence numbers and versions
    - Retrieve events for replay
    - Create and manage state snapshots
    - Replay events to reconstruct game state
    
    Configuration:
        snapshot_interval: Number of events between automatic snapshots (default: 10)
        max_snapshots: Maximum number of snapshots to keep per room (default: 5)
    """
    
    def __init__(self, db: Union[Session, AsyncSession], snapshot_interval: int = 10, max_snapshots: int = 5):
        """
        Initialize the Event Store Engine.
        
        Args:
            db: SQLAlchemy database session (sync or async)
            snapshot_interval: Number of events between snapshots (default: 10)
            max_snapshots: Maximum snapshots to keep per room (default: 5)
        """
        self.db = db
        self.snapshot_interval = snapshot_interval
        self.max_snapshots = max_snapshots
        logger.info(
            f"EventStoreEngine initialized with snapshot_interval={snapshot_interval}, "
            f"max_snapshots={max_snapshots}"
        )
    
    def _compute_event_checksum(self, action_data: Dict[str, Any]) -> str:
        """
        Compute SHA-256 checksum of event action data.
        
        Args:
            action_data: Event action data dictionary
            
        Returns:
            Hex string of SHA-256 hash
        """
        # Create deterministic JSON string
        canonical_json = json.dumps(action_data, sort_keys=True, separators=(',', ':'))
        # Compute SHA-256 hash
        return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
    
    def _compute_state_checksum(self, state_data: Dict[str, Any]) -> str:
        """
        Compute SHA-256 checksum of game state.
        
        Args:
            state_data: Complete game state dictionary
            
        Returns:
            Hex string of SHA-256 hash
        """
        # Extract canonical state representation
        canonical = {
            'version': state_data.get('version', 0),
            'phase': state_data.get('game_phase', 'waiting'),
            'current_turn': state_data.get('current_turn', 1),
            'round_number': state_data.get('round_number', 0),
            'card_counts': {
                'deck': len(state_data.get('deck', [])),
                'player1_hand': len(state_data.get('player1_hand', [])),
                'player2_hand': len(state_data.get('player2_hand', [])),
                'table_cards': len(state_data.get('table_cards', [])),
                'player1_captured': len(state_data.get('player1_captured', [])),
                'player2_captured': len(state_data.get('player2_captured', [])),
            },
            'scores': {
                'player1': state_data.get('player1_score', 0),
                'player2': state_data.get('player2_score', 0),
            }
        }
        
        # Create deterministic JSON string
        canonical_json = json.dumps(canonical, sort_keys=True, separators=(',', ':'))
        # Compute SHA-256 hash
        return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
    
    async def _get_next_sequence_number(self, room_id: str) -> int:
        """
        Get the next sequence number for a room.
        
        Args:
            room_id: Room identifier
            
        Returns:
            Next sequence number (1-based)
        """
        # Check if using AsyncSession
        if isinstance(self.db, AsyncSession):
            stmt = select(GameEvent).filter(
                GameEvent.room_id == room_id
            ).order_by(desc(GameEvent.sequence_number)).limit(1)
            result = await self.db.execute(stmt)
            last_event = result.scalar_one_or_none()
        else:
            last_event = self.db.query(GameEvent).filter(
                GameEvent.room_id == room_id
            ).order_by(desc(GameEvent.sequence_number)).first()
        
        if last_event:
            return last_event.sequence_number + 1
        return 1
    
    async def store_event(
        self,
        room_id: str,
        action_type: str,
        action_data: Dict[str, Any],
        version: int,
        player_id: Optional[int] = None
    ) -> GameEvent:
        """
        Store a game action as an immutable event.
        
        This method creates a new event record with:
        - Auto-incremented sequence number per room
        - Version number for state tracking
        - Checksum for data integrity
        - Timestamp for ordering
        
        Args:
            room_id: Room identifier
            action_type: Type of action (capture, build, trail, ready, shuffle, etc.)
            action_data: Action details and state changes as dictionary
            version: State version after this event
            player_id: Player who triggered the event (optional)
            
        Returns:
            Created GameEvent object
            
        Raises:
            Exception: If event storage fails
        """
        try:
            # Generate sequence number
            sequence_number = await self._get_next_sequence_number(room_id)
            
            # Compute checksum
            checksum = self._compute_event_checksum(action_data)
            
            # Create event
            event = GameEvent(
                room_id=room_id,
                sequence_number=sequence_number,
                version=version,
                player_id=player_id,
                action_type=action_type,
                action_data=action_data,
                checksum=checksum
            )
            
            # Store in database
            self.db.add(event)
            if isinstance(self.db, AsyncSession):
                await self.db.commit()
                await self.db.refresh(event)
            else:
                self.db.commit()
                self.db.refresh(event)
            
            logger.info(
                f"Event stored: room={room_id}, seq={sequence_number}, "
                f"version={version}, type={action_type}"
            )
            
            return event
            
        except Exception as e:
            if isinstance(self.db, AsyncSession):
                await self.db.rollback()
            else:
                self.db.rollback()
            logger.error(f"Failed to store event: {e}", exc_info=True)
            raise
    
    async def get_events(
        self,
        room_id: str,
        from_version: int = 0,
        to_version: Optional[int] = None
    ) -> List[GameEvent]:
        """
        Retrieve events for a room within a version range.
        
        Events are returned in sequence number order to ensure proper replay.
        This method is used for state synchronization and event replay.
        
        Args:
            room_id: Room identifier
            from_version: Starting version (inclusive, default: 0 for all events)
            to_version: Ending version (inclusive, default: None for latest)
            
        Returns:
            List of GameEvent objects ordered by sequence_number
        """
        try:
            if isinstance(self.db, AsyncSession):
                stmt = select(GameEvent).filter(
                    GameEvent.room_id == room_id,
                    GameEvent.version >= from_version
                )
                
                if to_version is not None:
                    stmt = stmt.filter(GameEvent.version <= to_version)
                
                stmt = stmt.order_by(GameEvent.sequence_number)
                result = await self.db.execute(stmt)
                events = result.scalars().all()
            else:
                query = self.db.query(GameEvent).filter(
                    GameEvent.room_id == room_id,
                    GameEvent.version >= from_version
                )
                
                if to_version is not None:
                    query = query.filter(GameEvent.version <= to_version)
                
                events = query.order_by(GameEvent.sequence_number).all()
            
            logger.debug(
                f"Retrieved {len(events)} events for room={room_id}, "
                f"from_version={from_version}, to_version={to_version}"
            )
            
            return events
            
        except Exception as e:
            logger.error(f"Failed to retrieve events: {e}", exc_info=True)
            raise
    
    async def replay_events(
        self,
        room_id: str,
        from_snapshot: Optional[StateSnapshot] = None
    ) -> Dict[str, Any]:
        """
        Replay events to reconstruct game state.
        
        This method reconstructs the current game state by:
        1. Starting from a snapshot (if provided) or empty state
        2. Replaying all subsequent events in sequence order
        3. Applying each event's action_data to update the state
        
        The replayed state can be used for state recovery, synchronization,
        or validation purposes.
        
        Args:
            room_id: Room identifier
            from_snapshot: Optional snapshot to start from (default: None for full replay)
            
        Returns:
            Reconstructed game state as dictionary
        """
        try:
            # Determine starting point
            if from_snapshot:
                # Start from snapshot
                state = from_snapshot.state_data.copy()
                from_version = from_snapshot.version + 1
                logger.info(
                    f"Replaying from snapshot: room={room_id}, "
                    f"snapshot_version={from_snapshot.version}"
                )
            else:
                # Start from empty/initial state
                if isinstance(self.db, AsyncSession):
                    stmt = select(Room).filter(Room.id == room_id)
                    result = await self.db.execute(stmt)
                    room = result.scalar_one_or_none()
                else:
                    room = self.db.query(Room).filter(Room.id == room_id).first()
                
                if not room:
                    raise ValueError(f"Room {room_id} not found")
                
                # Get initial state from room
                state = {
                    'version': 0,
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
                }
                from_version = 0
                logger.info(f"Replaying from initial state: room={room_id}")
            
            # Get events to replay
            events = await self.get_events(room_id, from_version=from_version)
            
            # Replay events in sequence order
            for event in events:
                # Apply event's action_data to state
                # The action_data contains the state changes from this event
                if 'state_changes' in event.action_data:
                    state.update(event.action_data['state_changes'])
                
                # Update version
                state['version'] = event.version
                
                logger.debug(
                    f"Applied event: seq={event.sequence_number}, "
                    f"version={event.version}, type={event.action_type}"
                )
            
            logger.info(
                f"Replay complete: room={room_id}, "
                f"events_replayed={len(events)}, final_version={state.get('version', 0)}"
            )
            
            return state
            
        except Exception as e:
            logger.error(f"Failed to replay events: {e}", exc_info=True)
            raise
    
    async def create_snapshot(
        self,
        room_id: str,
        state_data: Dict[str, Any]
    ) -> StateSnapshot:
        """
        Create a state snapshot for optimized replay.
        
        Snapshots store the complete game state at a specific version,
        allowing event replay to start from the snapshot instead of
        replaying all events from the beginning.
        
        Args:
            room_id: Room identifier
            state_data: Complete game state dictionary
            
        Returns:
            Created StateSnapshot object
            
        Raises:
            Exception: If snapshot creation fails
        """
        try:
            # Get version from state
            version = state_data.get('version', 0)
            
            # Compute checksum
            checksum = self._compute_state_checksum(state_data)
            
            # Create snapshot
            snapshot = StateSnapshot(
                room_id=room_id,
                version=version,
                state_data=state_data,
                checksum=checksum
            )
            
            # Store in database
            self.db.add(snapshot)
            if isinstance(self.db, AsyncSession):
                await self.db.commit()
                await self.db.refresh(snapshot)
            else:
                self.db.commit()
                self.db.refresh(snapshot)
            
            logger.info(
                f"Snapshot created: room={room_id}, version={version}, "
                f"checksum={checksum[:8]}..."
            )
            
            return snapshot
            
        except Exception as e:
            if isinstance(self.db, AsyncSession):
                await self.db.rollback()
            else:
                self.db.rollback()
            logger.error(f"Failed to create snapshot: {e}", exc_info=True)
            raise
    
    async def check_and_create_snapshot(
        self,
        room_id: str,
        current_version: int,
        state_data: Dict[str, Any]
    ) -> Optional[StateSnapshot]:
        """
        Check if a snapshot is needed and create one if necessary.
        
        A snapshot is created every snapshot_interval events (default: 10).
        This method also cleans up old snapshots, keeping only the most
        recent max_snapshots (default: 5).
        
        Args:
            room_id: Room identifier
            current_version: Current state version
            state_data: Complete game state dictionary
            
        Returns:
            Created StateSnapshot if snapshot was needed, None otherwise
        """
        try:
            # Check if snapshot is needed
            if current_version % self.snapshot_interval != 0:
                return None
            
            # Check if snapshot already exists for this version
            if isinstance(self.db, AsyncSession):
                stmt = select(StateSnapshot).filter(
                    StateSnapshot.room_id == room_id,
                    StateSnapshot.version == current_version
                )
                result = await self.db.execute(stmt)
                existing = result.scalar_one_or_none()
            else:
                existing = self.db.query(StateSnapshot).filter(
                    StateSnapshot.room_id == room_id,
                    StateSnapshot.version == current_version
                ).first()
            
            if existing:
                logger.debug(
                    f"Snapshot already exists: room={room_id}, version={current_version}"
                )
                return None
            
            # Create snapshot
            snapshot = await self.create_snapshot(room_id, state_data)
            
            # Clean up old snapshots
            await self._cleanup_old_snapshots(room_id)
            
            return snapshot
            
        except Exception as e:
            logger.error(f"Failed to check/create snapshot: {e}", exc_info=True)
            # Don't raise - snapshot creation failure shouldn't break the game
            return None
    
    async def _cleanup_old_snapshots(self, room_id: str) -> None:
        """
        Clean up old snapshots, keeping only the most recent ones.
        
        Args:
            room_id: Room identifier
        """
        try:
            # Get all snapshots for room, ordered by version descending
            if isinstance(self.db, AsyncSession):
                stmt = select(StateSnapshot).filter(
                    StateSnapshot.room_id == room_id
                ).order_by(desc(StateSnapshot.version))
                result = await self.db.execute(stmt)
                snapshots = result.scalars().all()
            else:
                snapshots = self.db.query(StateSnapshot).filter(
                    StateSnapshot.room_id == room_id
                ).order_by(desc(StateSnapshot.version)).all()
            
            # Keep only max_snapshots most recent
            if len(snapshots) > self.max_snapshots:
                snapshots_to_delete = snapshots[self.max_snapshots:]
                
                for snapshot in snapshots_to_delete:
                    if isinstance(self.db, AsyncSession):
                        await self.db.delete(snapshot)
                    else:
                        self.db.delete(snapshot)
                
                if isinstance(self.db, AsyncSession):
                    await self.db.commit()
                else:
                    self.db.commit()
                
                logger.info(
                    f"Cleaned up {len(snapshots_to_delete)} old snapshots for room={room_id}"
                )
                
        except Exception as e:
            if isinstance(self.db, AsyncSession):
                await self.db.rollback()
            else:
                self.db.rollback()
            logger.error(f"Failed to cleanup snapshots: {e}", exc_info=True)
    
    async def get_latest_snapshot(self, room_id: str) -> Optional[StateSnapshot]:
        """
        Get the most recent snapshot for a room.
        
        Args:
            room_id: Room identifier
            
        Returns:
            Latest StateSnapshot or None if no snapshots exist
        """
        try:
            if isinstance(self.db, AsyncSession):
                stmt = select(StateSnapshot).filter(
                    StateSnapshot.room_id == room_id
                ).order_by(desc(StateSnapshot.version)).limit(1)
                result = await self.db.execute(stmt)
                snapshot = result.scalar_one_or_none()
            else:
                snapshot = self.db.query(StateSnapshot).filter(
                    StateSnapshot.room_id == room_id
                ).order_by(desc(StateSnapshot.version)).first()
            
            if snapshot:
                logger.debug(
                    f"Retrieved latest snapshot: room={room_id}, version={snapshot.version}"
                )
            
            return snapshot
            
        except Exception as e:
            logger.error(f"Failed to get latest snapshot: {e}", exc_info=True)
            return None
    
    def __repr__(self) -> str:
        return (
            f"<EventStoreEngine(snapshot_interval={self.snapshot_interval}, "
            f"max_snapshots={self.max_snapshots})>"
        )
