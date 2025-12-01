"""
Example usage of ConflictResolver in the game state synchronization system.

This demonstrates how the ConflictResolver integrates with the rest of the
state synchronization components to handle concurrent player actions.

Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5
"""

import asyncio
from datetime import datetime
from conflict_resolver import ConflictResolver, GameAction, Conflict


async def example_conflict_scenario():
    """
    Example scenario: Two players try to capture the same card simultaneously.
    
    This demonstrates the complete conflict resolution flow:
    1. Detect conflict between actions
    2. Resolve using server-wins strategy
    3. Log the conflict
    4. Send notification to affected player
    """
    
    print("=== Conflict Resolution Example ===\n")
    
    # Initialize resolver
    resolver = ConflictResolver(conflict_window_ms=100)
    
    # Simulate two players trying to capture the same card
    print("Scenario: Both players try to capture 3♠ within 50ms")
    print()
    
    # Player 1's action (arrives first at server)
    action1 = GameAction(
        id="action_001",
        player_id=1,
        action_type="capture",
        card_id="8_hearts",
        target_cards=["3_spades", "5_diamonds"],
        server_timestamp=1000
    )
    print(f"Player 1 action: Capture 3♠ + 5♦ with 8♥ (timestamp: {action1.server_timestamp}ms)")
    
    # Player 2's action (arrives 50ms later)
    action2 = GameAction(
        id="action_002",
        player_id=2,
        action_type="capture",
        card_id="8_clubs",
        target_cards=["3_spades"],
        server_timestamp=1050
    )
    print(f"Player 2 action: Capture 3♠ with 8♣ (timestamp: {action2.server_timestamp}ms)")
    print()
    
    # Step 1: Detect conflict
    print("Step 1: Detect Conflict")
    is_conflict = resolver.detect_conflict(action1, action2)
    print(f"Conflict detected: {is_conflict}")
    print(f"Reason: Both actions affect 3♠ within {resolver.conflict_window_ms}ms window")
    print()
    
    # Step 2: Resolve conflict
    print("Step 2: Resolve Conflict")
    
    # Mock validator (in real system, this would validate against game state)
    class MockValidator:
        pass
    
    result = resolver.resolve(
        current_state=None,
        conflicting_actions=[action1, action2],
        validator=MockValidator()
    )
    
    print(f"Accepted actions: {len(result.accepted_actions)}")
    for action in result.accepted_actions:
        print(f"  - Action {action.id} (Player {action.player_id})")
    
    print(f"Rejected actions: {len(result.rejected_actions)}")
    for action in result.rejected_actions:
        print(f"  - Action {action.id} (Player {action.player_id})")
    print()
    
    # Step 3: Log conflict
    print("Step 3: Log Conflict")
    conflict = Conflict(
        room_id="ABC123",
        action1=action1,
        action2=action2,
        reason="Both players tried to capture 3♠ simultaneously",
        timestamp=datetime.now()
    )
    resolver.log_conflict("ABC123", conflict)
    print(f"Conflict logged for room ABC123")
    print()
    
    # Step 4: Create and send notification
    print("Step 4: Send Notification to Affected Player")
    
    if result.rejected_actions:
        rejected = result.rejected_actions[0]
        accepted = result.accepted_actions[0]
        
        notification = resolver.create_conflict_notification(
            rejected_action=rejected,
            accepted_action=accepted,
            reason="Opponent captured the card first"
        )
        
        print(f"Notification created for Player {rejected.player_id}:")
        print(f"  Type: {notification['type']}")
        print(f"  Message: {notification['message']}")
        print(f"  Time difference: {notification['time_difference_ms']}ms")
        print()
        
        # In real system, this would be sent via WebSocket
        print("Notification would be sent via WebSocket to Player 2")
        print()
    
    # Step 5: View statistics
    print("Step 5: Conflict Statistics")
    stats = resolver.get_conflict_stats()
    print(f"Total conflicts: {stats['total_conflicts']}")
    print(f"Conflicts by room: {stats['conflicts_by_room']}")
    print(f"Average time difference: {stats['average_time_diff_ms']:.1f}ms")
    print()
    
    print("=== End of Example ===")


async def example_multiple_conflicts():
    """
    Example with multiple concurrent actions requiring resolution.
    """
    
    print("\n=== Multiple Conflicts Example ===\n")
    
    resolver = ConflictResolver(conflict_window_ms=100)
    
    print("Scenario: Three players act within 80ms")
    print()
    
    # Three actions affecting overlapping cards
    actions = [
        GameAction(
            id="a1",
            player_id=1,
            action_type="capture",
            card_id="8_hearts",
            target_cards=["3_spades", "5_diamonds"],
            server_timestamp=1000
        ),
        GameAction(
            id="a2",
            player_id=2,
            action_type="capture",
            card_id="8_clubs",
            target_cards=["3_spades"],
            server_timestamp=1050
        ),
        GameAction(
            id="a3",
            player_id=3,
            action_type="build",
            card_id="2_hearts",
            target_cards=["5_diamonds"],
            build_value=7,
            server_timestamp=1080
        )
    ]
    
    for action in actions:
        print(f"Player {action.player_id}: {action.action_type} (timestamp: {action.server_timestamp}ms)")
    print()
    
    # Resolve all conflicts
    class MockValidator:
        pass
    
    result = resolver.resolve(
        current_state=None,
        conflicting_actions=actions,
        validator=MockValidator()
    )
    
    print("Resolution Result:")
    print(f"  Accepted: {[a.id for a in result.accepted_actions]}")
    print(f"  Rejected: {[a.id for a in result.rejected_actions]}")
    print(f"  Conflicts detected: {result.conflicts_detected}")
    print()
    
    print("=== End of Example ===")


if __name__ == "__main__":
    # Run examples
    asyncio.run(example_conflict_scenario())
    asyncio.run(example_multiple_conflicts())
