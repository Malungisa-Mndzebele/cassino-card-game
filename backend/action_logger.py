"""
Game Action Logger
Logs all game actions for replay and deduplication
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
import hashlib
import logging
from typing import Optional

from models import GameActionLog


logger = logging.getLogger(__name__)


class ActionLogger:
    """Service for logging game actions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_game_action(
        self,
        room_id: str,
        player_id: int,
        action_type: str,
        action_data: dict
    ) -> str:
        """
        Log a game action
        
        Args:
            room_id: Room identifier
            player_id: Player identifier
            action_type: Type of action (capture, build, trail, ready, shuffle)
            action_data: Action data dictionary
            
        Returns:
            Action ID for deduplication
        """
        # Generate unique action ID
        action_id = self._generate_action_id(room_id, player_id, action_type, action_data)
        
        # Check if action already logged (deduplication)
        existing = self.db.query(GameActionLog).filter(
            GameActionLog.action_id == action_id
        ).first()
        
        if existing:
            logger.info(f"Action {action_id} already logged, skipping duplicate")
            return action_id
        
        # Get next sequence number for this room
        last_action = self.db.query(GameActionLog).filter(
            GameActionLog.room_id == room_id
        ).order_by(GameActionLog.sequence_number.desc()).first()
        
        sequence_number = 1 if not last_action else last_action.sequence_number + 1
        
        # Create action log entry
        action_log = GameActionLog(
            room_id=room_id,
            player_id=player_id,
            action_type=action_type,
            action_data=action_data,
            sequence_number=sequence_number,
            action_id=action_id
        )
        
        self.db.add(action_log)
        self.db.commit()
        
        logger.info(f"Logged action {action_id} (seq {sequence_number}) for player {player_id} in room {room_id}")
        
        return action_id
    
    def is_action_processed(self, action_id: str) -> bool:
        """
        Check if an action has already been processed
        
        Args:
            action_id: Action identifier
            
        Returns:
            True if action exists, False otherwise
        """
        existing = self.db.query(GameActionLog).filter(
            GameActionLog.action_id == action_id
        ).first()
        
        return existing is not None
    
    def get_action_by_id(self, action_id: str) -> Optional[GameActionLog]:
        """
        Get action by ID
        
        Args:
            action_id: Action identifier
            
        Returns:
            GameActionLog or None
        """
        return self.db.query(GameActionLog).filter(
            GameActionLog.action_id == action_id
        ).first()
    
    def get_room_actions(
        self,
        room_id: str,
        limit: Optional[int] = None
    ) -> list[GameActionLog]:
        """
        Get all actions for a room
        
        Args:
            room_id: Room identifier
            limit: Optional limit on number of actions
            
        Returns:
            List of GameActionLog objects
        """
        query = self.db.query(GameActionLog).filter(
            GameActionLog.room_id == room_id
        ).order_by(GameActionLog.sequence_number)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def _generate_action_id(
        self,
        room_id: str,
        player_id: int,
        action_type: str,
        action_data: dict
    ) -> str:
        """
        Generate unique action ID for deduplication
        
        Args:
            room_id: Room identifier
            player_id: Player identifier
            action_type: Action type
            action_data: Action data
            
        Returns:
            Unique action ID (hash)
        """
        # Create deterministic string from action data
        import json
        data_str = json.dumps(action_data, sort_keys=True)
        
        # Include timestamp to ensure uniqueness
        from datetime import datetime
        timestamp = datetime.now().isoformat()
        
        # Create hash
        hash_input = f"{room_id}:{player_id}:{action_type}:{data_str}:{timestamp}"
        action_id = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
        
        return action_id


def log_action_decorator(action_type: str):
    """
    Decorator to automatically log game actions
    
    Args:
        action_type: Type of action to log
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract room_id and player_id from kwargs
            room_id = kwargs.get('room_id')
            player_id = kwargs.get('player_id')
            db = kwargs.get('db')
            
            if room_id and player_id and db:
                # Log the action
                logger_service = ActionLogger(db)
                action_data = {k: v for k, v in kwargs.items() 
                             if k not in ['db', 'room_id', 'player_id']}
                
                action_id = logger_service.log_game_action(
                    room_id, player_id, action_type, action_data
                )
                
                # Add action_id to kwargs for the function
                kwargs['action_id'] = action_id
            
            # Call original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator
