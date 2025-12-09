"""
Service Layer for Casino Card Game Backend

This package contains business logic services that handle game operations,
room management, and player interactions. Services are designed to be:
- Testable (pure functions where possible)
- Reusable (called from multiple routes)
- Maintainable (single responsibility)
- Type-safe (comprehensive type hints)

Services:
    - RoomService: Room creation, joining, state management
    - GameService: Game actions, validation, state updates
    - PlayerService: Player management, ready status
    - WebSocketService: WebSocket message handling and broadcasting
"""

from .room_service import RoomService

__all__ = [
    'RoomService',
]

# TODO: Add these imports when services are implemented
# from .game_service import GameService
# from .player_service import PlayerService
