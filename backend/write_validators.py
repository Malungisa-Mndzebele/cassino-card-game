with open('validators.py', 'w', encoding='utf-8') as f:
    f.write('''# Turn validation
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)

class TurnViolationTracker:
    def __init__(self):
        self.violations: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
        self.last_violation: Dict[str, Dict[int, datetime]] = defaultdict(dict)
    
    def record_violation(self, room_id: str, player_id: int) -> int:
        self.violations[room_id][player_id] += 1
        self.last_violation[room_id][player_id] = datetime.now()
        count = self.violations[room_id][player_id]
        logger.warning(f"Turn violation for player {player_id} in room {room_id}. Total: {count}")
        return count
    
    def get_violation_count(self, room_id: str, player_id: int) -> int:
        return self.violations.get(room_id, {}).get(player_id, 0)
    
    def reset_violations(self, room_id: str, player_id: Optional[int] = None):
        if player_id is None:
            if room_id in self.violations:
                del self.violations[room_id]
            if room_id in self.last_violation:
                del self.last_violation[room_id]
        else:
            if room_id in self.violations and player_id in self.violations[room_id]:
                del self.violations[room_id][player_id]
            if room_id in self.last_violation and player_id in self.last_violation[room_id]:
                del self.last_violation[room_id][player_id]

_violation_tracker = TurnViolationTracker()

def validate_turn_order(room_id: str, player_id: int, current_turn: int, action_type: str) -> Tuple[bool, Optional[str]]:
    if player_id != current_turn:
        violation_count = _violation_tracker.record_violation(room_id, player_id)
        if violation_count >= 3:
            logger.error(f"SECURITY: Player {player_id} in room {room_id} has {violation_count} turn violations")
        return False, "Not your turn"
    return True, None

def validate_turn_complete(room_id: str, player_id: int, action_type: str, game_phase: str) -> Tuple[bool, Optional[str]]:
    valid_turn_ending_actions = ["capture", "build", "trail"]
    if action_type in valid_turn_ending_actions:
        return True, None
    return False, f"Action '{action_type}' does not complete a turn"

def get_next_turn(current_turn: int) -> int:
    return 2 if current_turn == 1 else 1

def reset_turn_violations(room_id: str, player_id: Optional[int] = None):
    _violation_tracker.reset_violations(room_id, player_id)

def get_turn_violation_count(room_id: str, player_id: int) -> int:
    return _violation_tracker.get_violation_count(room_id, player_id)
''')
print("File created successfully")
