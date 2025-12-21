
import json
import hashlib
from typing import Dict, Any

def compute_checksum_from_dict(state_dict: Dict[str, Any]) -> str:
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
    print(f"Canonical JSON: {canonical_json}")
    
    # Compute SHA-256 hash
    hash_obj = hashlib.sha256(canonical_json.encode('utf-8'))
    
    # Return hex string
    return hash_obj.hexdigest()

# Example state
state = {
    "version": 0,
    "phase": "waiting",
    "current_turn": 1,
    "round": 0,
    "deck": [],
    "player1_hand": [],
    "player2_hand": [],
    "table_cards": [],
    "player1_captured": [],
    "player2_captured": [],
    "builds": [],
    "player1_score": 0,
    "player2_score": 0,
    "shuffle_complete": False,
    "card_selection_complete": False,
    "dealing_complete": False,
    "game_started": False,
    "game_completed": False
}

print(f"Checksum: {compute_checksum_from_dict(state)}")
