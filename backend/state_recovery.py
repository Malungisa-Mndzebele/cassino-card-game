"""
Game State Recovery Service
Handles state retrieval and missed actions for reconnecting players
"""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass
import logging

from models import Room, Player, GameActionLog, GameSession


logger = logging.getLogger(__name__)


@dataclass
class GameAction:
    """Represents a game action"""
    id: str
    player_id: int
    action_type: str
    action_data: dict
    timestamp: datetime
    sequence_number: int


@dataclass
class RecoveryState:
    """Complete state for player reconnection"""
    game_state: dict
    missed_actions: List[GameAction]
    is_your_turn: bool
    time_disconnected: int  # seconds
    opponent_status: str  # "connected" | "disconnected"
    missed_actions_summary: str


class StateRecoveryService:
    """Service for recovering game state after reconnection"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_recovery_state(
        self,
        room_id: str,
        player_id: int
    ) -> Optional[RecoveryState]:
        """
        Get complete state for player reconnection
        
        Args:
            room_id: Room identifier
            player_id: Player identifier
            
        Returns:
            RecoveryState object or None if room not found
        """
        # Get room
        room = self.db.query(Room).filter(Room.id == room_id).first()
        if not room:
            logger.warning(f"Room {room_id} not found for recovery")
            return None
        
        # Get player's session to determine disconnection time
        session = self.db.query(GameSession).filter(
            GameSession.room_id == room_id,
            GameSession.player_id == player_id,
            GameSession.is_active == True
        ).first()
        
        time_disconnected = 0
        if session and session.disconnected_at:
            time_disconnected = int((datetime.now() - session.disconnected_at).total_seconds())
        
        # Get missed actions since disconnection
        missed_actions = []
        if session and session.disconnected_at:
            missed_actions = self.get_missed_actions(
                room_id,
                player_id,
                session.disconnected_at
            )
        
        # Determine if it's player's turn
        players = sorted(room.players, key=lambda p: p.joined_at)
        is_your_turn = False
        if len(players) >= 2:
            current_player = players[room.current_turn - 1] if room.current_turn <= len(players) else None
            is_your_turn = current_player and current_player.id == player_id
        
        # Get opponent status
        opponent_status = self._get_opponent_status(room_id, player_id)
        
        # Create game state dict
        game_state = self._room_to_dict(room)
        
        # Generate missed actions summary
        summary = self._generate_missed_actions_summary(missed_actions, player_id)
        
        recovery_state = RecoveryState(
            game_state=game_state,
            missed_actions=missed_actions,
            is_your_turn=is_your_turn,
            time_disconnected=time_disconnected,
            opponent_status=opponent_status,
            missed_actions_summary=summary
        )
        
        logger.info(f"Recovery state generated for player {player_id} in room {room_id}")
        
        return recovery_state
    
    def get_missed_actions(
        self,
        room_id: str,
        player_id: int,
        since: datetime
    ) -> List[GameAction]:
        """
        Get actions that occurred during disconnection
        
        Args:
            room_id: Room identifier
            player_id: Player identifier
            since: Timestamp to get actions since
            
        Returns:
            List of GameAction objects
        """
        # Query action log for actions after disconnection
        action_logs = self.db.query(GameActionLog).filter(
            GameActionLog.room_id == room_id,
            GameActionLog.timestamp > since
        ).order_by(GameActionLog.sequence_number).all()
        
        # Convert to GameAction objects
        actions = []
        for log in action_logs:
            action = GameAction(
                id=log.action_id,
                player_id=log.player_id,
                action_type=log.action_type,
                action_data=log.action_data,
                timestamp=log.timestamp,
                sequence_number=log.sequence_number
            )
            actions.append(action)
        
        logger.info(f"Found {len(actions)} missed actions for player {player_id}")
        
        return actions
    
    def validate_state_consistency(self, room_id: str) -> bool:
        """
        Verify game state integrity
        
        Args:
            room_id: Room identifier
            
        Returns:
            True if state is consistent, False otherwise
        """
        room = self.db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return False
        
        try:
            # Check card counts
            deck_count = len(room.deck or [])
            p1_hand_count = len(room.player1_hand or [])
            p2_hand_count = len(room.player2_hand or [])
            table_count = len(room.table_cards or [])
            p1_captured_count = len(room.player1_captured or [])
            p2_captured_count = len(room.player2_captured or [])
            
            # Build cards
            build_card_count = 0
            for build in (room.builds or []):
                build_card_count += len(build.get('cards', []))
            
            total_cards = (deck_count + p1_hand_count + p2_hand_count + 
                          table_count + p1_captured_count + p2_captured_count + 
                          build_card_count)
            
            if total_cards != 52:
                logger.error(f"Card count mismatch in room {room_id}: {total_cards} != 52")
                return False
            
            # Check for duplicate cards
            all_card_ids = set()
            for card_list in [room.deck, room.player1_hand, room.player2_hand,
                             room.table_cards, room.player1_captured, room.player2_captured]:
                if card_list:
                    for card in card_list:
                        card_id = card.get('id')
                        if card_id in all_card_ids:
                            logger.error(f"Duplicate card found in room {room_id}: {card_id}")
                            return False
                        all_card_ids.add(card_id)
            
            # Check build cards
            for build in (room.builds or []):
                for card in build.get('cards', []):
                    card_id = card.get('id')
                    if card_id in all_card_ids:
                        logger.error(f"Duplicate card in build in room {room_id}: {card_id}")
                        return False
                    all_card_ids.add(card_id)
            
            logger.info(f"State consistency validated for room {room_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error validating state consistency: {e}")
            return False
    
    def _get_opponent_status(self, room_id: str, player_id: int) -> str:
        """Get opponent's connection status"""
        # Get all sessions in room
        sessions = self.db.query(GameSession).filter(
            GameSession.room_id == room_id,
            GameSession.is_active == True
        ).all()
        
        # Find opponent's session
        for session in sessions:
            if session.player_id != player_id:
                if session.disconnected_at:
                    return "disconnected"
                return "connected"
        
        return "unknown"
    
    def _room_to_dict(self, room: Room) -> dict:
        """Convert room to dictionary"""
        return {
            "roomId": room.id,
            "players": [{"id": p.id, "name": p.name, "ready": p.ready, "joined_at": p.joined_at.isoformat()} 
                       for p in room.players],
            "phase": room.game_phase,
            "round": room.round_number,
            "deck": room.deck or [],
            "player1Hand": room.player1_hand or [],
            "player2Hand": room.player2_hand or [],
            "tableCards": room.table_cards or [],
            "builds": room.builds or [],
            "player1Captured": room.player1_captured or [],
            "player2Captured": room.player2_captured or [],
            "player1Score": room.player1_score,
            "player2Score": room.player2_score,
            "currentTurn": room.current_turn,
            "cardSelectionComplete": room.card_selection_complete,
            "shuffleComplete": room.shuffle_complete,
            "gameStarted": room.game_started,
            "lastPlay": room.last_play,
            "lastAction": room.last_action,
            "lastUpdate": room.last_update.isoformat(),
            "gameCompleted": room.game_completed,
            "winner": room.winner,
            "dealingComplete": room.dealing_complete,
            "player1Ready": room.player1_ready,
            "player2Ready": room.player2_ready
        }
    
    def _generate_missed_actions_summary(
        self,
        actions: List[GameAction],
        player_id: int
    ) -> str:
        """Generate human-readable summary of missed actions"""
        if not actions:
            return "No actions occurred while you were disconnected."
        
        # Limit to last 5 actions
        recent_actions = actions[-5:]
        
        summary_parts = []
        for action in recent_actions:
            if action.player_id == player_id:
                # Your action
                if action.action_type == "capture":
                    summary_parts.append("You captured cards")
                elif action.action_type == "build":
                    summary_parts.append("You created a build")
                elif action.action_type == "trail":
                    summary_parts.append("You trailed a card")
            else:
                # Opponent's action
                if action.action_type == "capture":
                    summary_parts.append("Opponent captured cards")
                elif action.action_type == "build":
                    summary_parts.append("Opponent created a build")
                elif action.action_type == "trail":
                    summary_parts.append("Opponent trailed a card")
        
        if len(actions) > 5:
            summary = f"{len(actions) - 5} more actions occurred. Recent: " + ", ".join(summary_parts)
        else:
            summary = "While disconnected: " + ", ".join(summary_parts)
        
        return summary
