"""
Casino Card Game Backend API - v2.1.0

FastAPI application providing REST and WebSocket endpoints for the Casino card game.
Handles room management, game logic, real-time communication, and session persistence.

Key Features:
    - Room creation and matchmaking
    - Real-time WebSocket game state synchronization
    - Session management with reconnection support
    - Complete game logic validation
    - Action logging for replay and recovery
    - Health monitoring and heartbeat tracking

API Endpoints:
    REST:
        - POST /rooms/create - Create new game room
        - POST /rooms/join - Join existing room
        - POST /rooms/join-random - Join random available room
        - GET /rooms/{room_id}/state - Get current game state
        - POST /rooms/player-ready - Set player ready status
        - POST /game/start-shuffle - Start shuffle phase
        - POST /game/select-face-up-cards - Deal initial cards
        - POST /game/play-card - Execute game action
        - POST /game/reset - Reset game
        - GET /health - Health check
    
    WebSocket:
        - WS /ws/{room_id} - Real-time game updates

Environment Variables:
    DATABASE_URL: Database connection string
    CORS_ORIGINS: Comma-separated allowed origins
    ROOT_PATH: API root path prefix
    SESSION_SECRET_KEY: Secret for session token signing

Example:
    >>> # Start server
    >>> uvicorn main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
import os
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import random
import string
import json
import logging
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from database import get_db, async_engine
from models import Base, Room, Player, GameSession
from schemas import (
    CreateRoomRequest, JoinRoomRequest, JoinRandomRoomRequest, SetPlayerReadyRequest,
    LeaveRoomRequest, CreateAIGameRequest,
    PlayCardRequest, StartShuffleRequest, SelectFaceUpCardsRequest, StartGameRequest,
    CreateRoomResponse, JoinRoomResponse, StandardResponse, GameStateResponse, PlayerResponse,
    SyncRequest,
    TableBuildRequest
)
from fastapi import Request
from game_logic import CasinoGameLogic, GameCard, Build
from ai_player import AIPlayer
from rate_limiter import rate_limit_ip
from request_tracking import RequestTrackingMiddleware, setup_request_tracking_logging

# Note: Database tables are now managed by Alembic migrations
# Run migrations with: alembic upgrade head

# Initialize logger
logger = logging.getLogger(__name__)

# Import SessionToken for fallback session creation
from session_manager import SessionToken


def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request, handling proxies.
    
    Checks X-Forwarded-For and X-Real-IP headers for proxied requests,
    falling back to direct client host if not behind a proxy.
    
    Args:
        request (Request): FastAPI request object
    
    Returns:
        str: Client IP address
    
    Example:
        >>> ip = get_client_ip(request)
        >>> # Returns "192.168.1.1" or similar
    """
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to client host
    return request.client.host if request.client.host else "127.0.0.1"

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for application startup and shutdown.
    Replaces deprecated @app.on_event decorators.
    """
    from database import init_db, close_db
    from redis_client import redis_client
    
    # Startup
    logger.info("Starting Casino Card Game Backend...")
    
    # Validate required environment variables in production
    if not DEBUG_MODE:
        required_vars = ["DATABASE_URL"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            logger.critical(f"Missing required environment variables: {', '.join(missing_vars)}")
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Generate SESSION_SECRET_KEY if not set (log warning)
        if not os.getenv("SESSION_SECRET_KEY"):
            import secrets
            generated_key = secrets.token_urlsafe(48)
            os.environ["SESSION_SECRET_KEY"] = generated_key
            logger.warning("SESSION_SECRET_KEY not set - generated ephemeral key. Set this in environment for persistent sessions.")
        
        # Validate SESSION_SECRET_KEY length
        secret_key = os.getenv("SESSION_SECRET_KEY", "")
        if len(secret_key) < 32:
            logger.critical("SESSION_SECRET_KEY must be at least 32 characters")
            raise RuntimeError("SESSION_SECRET_KEY must be at least 32 characters")
    
    # Initialize database tables
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")
    
    # Check Redis connection
    redis_available = await redis_client.ping()
    if redis_available:
        logger.info("Redis connected")
    else:
        logger.warning("Redis not available (sessions and caching disabled)")
    
    # Setup request tracking logging
    setup_request_tracking_logging()
    logger.info("Request tracking logging configured")
    
    # Start background tasks
    try:
        await background_task_manager.start()
        logger.info("Background tasks started")
    except Exception as e:
        logger.warning(f"Background tasks warning: {e}")
    
    # Start WebSocket Redis subscriber (only if Redis is available)
    if redis_available:
        try:
            await manager.start_subscriber()
            logger.info("WebSocket subscriber started")
        except Exception as e:
            logger.warning(f"WebSocket subscriber warning: {e}")
    else:
        logger.info("WebSocket using local-only mode (no Redis)")
    
    logger.info("Backend ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Casino Card Game Backend...")
    
    # Stop WebSocket subscriber
    try:
        await manager.stop_subscriber()
        logger.info("WebSocket subscriber stopped")
    except Exception as e:
        logger.warning(f"WebSocket subscriber cleanup warning: {e}")
    
    # Stop background tasks
    try:
        await background_task_manager.stop()
        logger.info("Background tasks stopped")
    except Exception as e:
        logger.warning(f"Background tasks cleanup warning: {e}")
    
    # Close database connections
    try:
        await close_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.warning(f"Database cleanup warning: {e}")
    
    # Close Redis connections
    try:
        await redis_client.close()
        logger.info("Redis connections closed")
    except Exception as e:
        logger.warning(f"Redis cleanup warning: {e}")
    
    logger.info("Shutdown complete")

# Support mounting behind a path prefix (e.g., /cassino-api on shared hosting)
ROOT_PATH = os.getenv("ROOT_PATH", "")
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
app = FastAPI(title="Casino Card Game API", version="1.0.0", root_path=ROOT_PATH, lifespan=lifespan, debug=DEBUG_MODE)

# Add request tracking middleware (must be added first to wrap all requests)
app.add_middleware(RequestTrackingMiddleware)

# Add CORS middleware
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-Session-Token",
        "X-CSRF-Token",
        "X-Request-ID",
        "X-Correlation-ID",
    ],
    expose_headers=[
        "Content-Type",
        "X-Session-Token",
        "X-Request-ID",
        "X-Correlation-ID",
    ],
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logger.error(f"Global exception handler: {error_msg}")
        with open("global_error.log", "w") as f:
            f.write(error_msg)
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check with database and Redis status"""
    from schemas import HealthCheckResponse
    from redis_client import redis_client
    from database import async_engine
    
    # Check database connection
    db_healthy = True
    try:
        from sqlalchemy import text
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_healthy = False
    
    # Check Redis connection
    redis_healthy = await redis_client.ping()
    
    # Overall status
    overall_status = "healthy" if (db_healthy and redis_healthy) else "degraded"
    
    return HealthCheckResponse(
        status=overall_status,
        database="connected" if db_healthy else "disconnected",
        redis="connected" if redis_healthy else "disconnected"
    )

# Root endpoint for API
@app.get("/")
async def root():
    return {"message": "Casino Card Game API", "version": "1.1.0", "features": ["ai_game"]}

# Debug endpoint to check waiting rooms (only available in debug mode)
@app.get("/debug/waiting-rooms")
async def get_waiting_rooms(db: AsyncSession = Depends(get_db)):
    """Debug endpoint to see all waiting rooms - only available in debug mode"""
    # Only allow in debug mode
    if not DEBUG_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Room)
        .where(Room.game_phase == "waiting")
        .options(selectinload(Room.players))
    )
    waiting_rooms = result.scalars().all()
    
    rooms_info = []
    for room in waiting_rooms:
        rooms_info.append({
            "room_id": room.id,
            "phase": room.game_phase,
            "player_count": len(room.players) if room.players else 0,
            # Don't expose player names or IDs in production
            "players": [{"name": p.name[:3] + "***"} for p in (room.players or [])]
        })
    
    return {
        "total_waiting_rooms": len(waiting_rooms),
        "rooms_with_space": len([r for r in rooms_info if r["player_count"] == 1]),
        "rooms": rooms_info
    }

# Heartbeat monitoring endpoint
@app.get("/api/heartbeat/{room_id}")
async def get_heartbeat_status(room_id: str, db: AsyncSession = Depends(get_db)):
    """Get heartbeat status for all players in a room"""
    from session_manager import SessionManager
    
    session_manager = SessionManager(db)
    sessions = session_manager.get_room_sessions(room_id)
    
    players_status = []
    for session in sessions:
        # Calculate time since last heartbeat
        from datetime import datetime
        time_since_heartbeat = (datetime.now() - session.last_heartbeat).total_seconds()
        
        status = {
            "player_id": session.player_id,
            "last_heartbeat": session.last_heartbeat.isoformat(),
            "seconds_since_heartbeat": int(time_since_heartbeat),
            "is_healthy": time_since_heartbeat < 15,
            "is_connected": session.disconnected_at is None,
            "disconnected_at": session.disconnected_at.isoformat() if session.disconnected_at else None
        }
        players_status.append(status)
    
    return {
        "room_id": room_id,
        "players": players_status
    }

# Claim victory endpoint for abandoned games
@app.post("/api/game/claim-victory")
async def claim_victory(
    room_id: str,
    player_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Claim victory when opponent has abandoned the game"""
    from session_manager import SessionManager
    from datetime import timedelta
    
    room = await get_room_or_404(db, room_id)
    
    # Get all sessions in room
    session_manager = SessionManager(db)
    sessions = session_manager.get_room_sessions(room_id)
    
    # Check if opponent has been disconnected for > 5 minutes
    from datetime import datetime, timedelta
    five_minutes_ago = datetime.now() - timedelta(minutes=5)
    opponent_abandoned = False
    
    for session in sessions:
        if session.player_id != player_id:
            if session.disconnected_at and session.disconnected_at < five_minutes_ago:
                opponent_abandoned = True
                break
    
    if not opponent_abandoned:
        raise HTTPException(
            status_code=400,
            detail="Opponent has not been disconnected long enough to claim victory"
        )
    
    # Award victory to claiming player
    players_in_room = get_sorted_players(room)
    is_player1 = player_id == players_in_room[0].id
    
    room.game_phase = "finished"
    room.game_completed = True
    room.winner = 1 if is_player1 else 2
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = player_id
    
    await db.commit()
    
    # Broadcast game end
    await manager.broadcast_json_to_room({
        "type": "game_ended",
        "reason": "opponent_abandoned",
        "winner": room.winner
    }, room_id)
    
    return {
        "success": True,
        "message": "Victory claimed",
        "winner": room.winner,
        "game_state": await game_state_to_response(room)
    }

# State recovery endpoint
@app.get("/api/recovery/{room_id}/{player_id}")
async def get_recovery_state(
    room_id: str,
    player_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get recovery state for a reconnecting player"""
    from state_recovery import StateRecoveryService
    
    recovery_service = StateRecoveryService(db)
    recovery_state = recovery_service.get_recovery_state(room_id, player_id)
    
    if not recovery_state:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {
        "game_state": recovery_state.game_state,
        "missed_actions": [
            {
                "id": action.id,
                "player_id": action.player_id,
                "action_type": action.action_type,
                "timestamp": action.timestamp.isoformat()
            }
            for action in recovery_state.missed_actions
        ],
        "is_your_turn": recovery_state.is_your_turn,
        "time_disconnected": recovery_state.time_disconnected,
        "opponent_status": recovery_state.opponent_status,
        "summary": recovery_state.missed_actions_summary
    }

# State synchronization endpoint
@app.post("/api/sync")
async def sync_state(
    sync_request: SyncRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Synchronize client state with server.
    
    This endpoint handles client synchronization by comparing the client's
    version with the server's current version and returning either:
    - Success message if versions match (client is in sync)
    - Missing events for incremental sync (if gap is small)
    - Full state for complete resync (if gap is large or events unavailable)
    
    The endpoint uses the StateSynchronizer service to coordinate the sync
    operation and determine the appropriate sync strategy.
    
    Requirements: 8.1, 8.5
    """
    from state_synchronizer import StateSynchronizer
    
    try:
        # Initialize State Synchronizer
        synchronizer = StateSynchronizer(db=db)
        
        # Perform sync
        sync_result = await synchronizer.sync_client(
            room_id=sync_request.room_id,
            client_version=sync_request.client_version
        )
        
        # Return sync result
        return {
            "success": sync_result.success,
            "current_version": sync_result.current_version,
            "client_version": sync_result.client_version,
            "state": sync_result.state,
            "missing_events": sync_result.missing_events,
            "requires_full_sync": sync_result.requires_full_sync,
            "message": sync_result.message
        }
        
    except Exception as e:
        logger.error(f"Sync endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync state: {str(e)}"
        )

# Add explicit CORS preflight handler


# Import enhanced WebSocket manager and background tasks
from websocket_manager import WebSocketConnectionManager
from background_tasks import background_task_manager

# WebSocket connection manager
manager = WebSocketConnectionManager()

# Initialize game logic
game_logic = CasinoGameLogic()

# Utility functions

def generate_room_id() -> str:
    """
    Generate a unique 6-character room code.
    
    Creates a random alphanumeric code using uppercase letters and digits.
    Caller should verify uniqueness in database.
    
    Returns:
        str: 6-character room code (e.g., "ABC123")
    
    Example:
        >>> room_id = generate_room_id()
        >>> len(room_id)
        6
        >>> room_id.isupper() and room_id.isalnum()
        True
    """
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def convert_game_cards_to_dict(cards: List[GameCard]) -> List[Dict[str, Any]]:
    """
    Convert GameCard objects to dictionary format for JSON storage.
    
    Args:
        cards (list): List of GameCard objects
    
    Returns:
        list: List of card dictionaries with id, suit, rank, value keys
    
    Example:
        >>> card = GameCard("A_hearts", "hearts", "A", 14)
        >>> convert_game_cards_to_dict([card])
        [{'id': 'A_hearts', 'suit': 'hearts', 'rank': 'A', 'value': 14}]
    """
    return [{"id": card.id, "suit": card.suit, "rank": card.rank, "value": card.value} for card in cards]


def convert_dict_to_game_cards(cards_dict: List[Dict[str, Any]]) -> List[GameCard]:
    """
    Convert dictionary format to GameCard objects.
    
    Args:
        cards_dict (list): List of card dictionaries
    
    Returns:
        list: List of GameCard objects
    
    Example:
        >>> card_dict = {'id': 'A_hearts', 'suit': 'hearts', 'rank': 'A', 'value': 14}
        >>> cards = convert_dict_to_game_cards([card_dict])
        >>> cards[0].rank
        'A'
    """
    return [GameCard(id=card["id"], suit=card["suit"], rank=card["rank"], value=card["value"]) for card in cards_dict]


def convert_builds_to_dict(builds: List[Build]) -> List[Dict[str, Any]]:
    """
    Convert Build objects to dictionary format for JSON storage.
    
    Args:
        builds (list): List of Build objects
    
    Returns:
        list: List of build dictionaries with id, cards, value, owner keys
    
    Example:
        >>> card = GameCard("5_hearts", "hearts", "5", 5)
        >>> build = Build("build_1", [card], 8, 1)
        >>> convert_builds_to_dict([build])
        [{'id': 'build_1', 'cards': [...], 'value': 8, 'owner': 1}]
    """
    return [{"id": build.id, "cards": convert_game_cards_to_dict(build.cards), "value": build.value, "owner": build.owner} for build in builds]


def convert_dict_to_builds(builds_dict: List[Dict[str, Any]]) -> List[Build]:
    """
    Convert dictionary format to Build objects.
    
    Args:
        builds_dict (list): List of build dictionaries
    
    Returns:
        list: List of Build objects
    
    Example:
        >>> build_dict = {'id': 'build_1', 'cards': [...], 'value': 8, 'owner': 1}
        >>> builds = convert_dict_to_builds([build_dict])
        >>> builds[0].value
        8
    """
    return [Build(id=build["id"], cards=convert_dict_to_game_cards(build["cards"]), value=build["value"], owner=build["owner"]) for build in builds_dict]

async def game_state_to_response(room: Room) -> GameStateResponse:
    """
    Convert room model to game state response.
    
    Computes checksum before returning state to ensure integrity verification.
    Uses SQLAlchemy inspect to safely access attributes without triggering lazy loads.
    
    Requirements: 4.4
    """
    from state_checksum import compute_checksum
    from datetime import datetime
    from sqlalchemy import inspect
    
    # Compute checksum before returning state
    try:
        checksum = compute_checksum(room)
    except Exception as e:
        logger.warning(f"Checksum computation error: {e}")
        checksum = "error"
    
    # Use SQLAlchemy inspect to safely access attributes without triggering lazy loads
    insp = inspect(room)
    
    # Ensure players relationship is loaded (avoid greenlet issues)
    players_data = []
    # Check if players is loaded before accessing
    if 'players' not in insp.unloaded and room.players is not None:
        players_data = [PlayerResponse(
            id=p.id,
            name=p.name,
            ready=bool(p.ready),
            joined_at=p.joined_at,
            ip_address=p.ip_address
        ) for p in room.players]
    
    # Safely access last_update - check if it's loaded first
    # Use dict access to avoid triggering lazy load
    last_update_value = datetime.utcnow()
    if 'last_update' not in insp.unloaded:
        # Attribute is loaded, safe to access
        try:
            attr_value = insp.attrs.last_update.loaded_value
            if attr_value is not None:
                last_update_value = attr_value
        except (AttributeError, KeyError):
            # Fallback if attribute access fails
            pass
    
    return GameStateResponse(
        room_id=room.id,
        players=players_data,
        phase=(room.game_phase or "waiting"),
        round=int(room.round_number or 0),
        deck=(room.deck or []),
        player1_hand=(room.player1_hand or []),
        player2_hand=(room.player2_hand or []),
        table_cards=(room.table_cards or []),
        builds=(room.builds or []),
        player1_captured=(room.player1_captured or []),
        player2_captured=(room.player2_captured or []),
        player1_score=int(room.player1_score or 0),
        player2_score=int(room.player2_score or 0),
        current_turn=int(room.current_turn or 1),
        card_selection_complete=bool(room.card_selection_complete),
        shuffle_complete=bool(room.shuffle_complete),
        countdown_start_time=None,  # TODO: Implement countdown
        game_started=bool(room.game_started),
        last_play=(room.last_play or None),
        last_action=(room.last_action or None),
        last_update=last_update_value,
        game_completed=bool(room.game_completed),
        winner=room.winner,
        dealing_complete=bool(room.dealing_complete),
        player1_ready=bool(room.player1_ready),
        player2_ready=bool(room.player2_ready),
        countdown_remaining=None,  # TODO: Implement countdown
        version=int(room.version or 0),
        checksum=checksum
    )

# Helper functions to reduce duplication across endpoints

async def get_room_or_404(db: AsyncSession, room_id: str) -> Room:
    """
    Fetch a room from database or raise 404 error.
    
    Args:
        db (Session): Database session
        room_id (str): Room identifier
    
    Returns:
        Room: Room object if found
    
    Raises:
        HTTPException: 404 if room not found
    
    Example:
        >>> room = get_room_or_404(db, "ABC123")
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Room)
        .where(Room.id == room_id)
        .options(selectinload(Room.players))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


def get_sorted_players(room: Room) -> List[Player]:
    """
    Return players sorted by join time (player 1 first).
    
    Args:
        room (Room): Room object with players relationship
    
    Returns:
        list: Players sorted by joined_at timestamp
    
    Example:
        >>> players = get_sorted_players(room)
        >>> players[0]  # Player 1 (joined first)
        >>> players[1]  # Player 2 (joined second)
    """
    from datetime import datetime
    if not room.players:
        return []
    return sorted(room.players, key=lambda p: p.joined_at or datetime.min)


async def get_player_or_404(db: AsyncSession, room_id: str, player_id: int) -> Player:
    """
    Fetch a player in a specific room or raise 404 error.
    
    Args:
        db (AsyncSession): Database session
        room_id (str): Room identifier
        player_id (int): Player identifier
    
    Returns:
        Player: Player object if found
    
    Raises:
        HTTPException: 404 if player not found in room
    
    Example:
        >>> player = await get_player_or_404(db, "ABC123", 1)
    """
    from sqlalchemy import select
    result = await db.execute(
        select(Player).where(
            Player.id == player_id,
            Player.room_id == room_id
        )
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


def assert_players_turn(room: Room, player_id: int) -> None:
    """
    Validate it's the specified player's turn, raise 400 if not.
    
    Args:
        room (Room): Room object with game state
        player_id (int): Player identifier to validate
    
    Raises:
        HTTPException: 400 if not enough players or not player's turn
    
    Example:
        >>> assert_players_turn(room, 1)  # Raises if not player 1's turn
    """
    players_in_room = get_sorted_players(room)
    if len(players_in_room) < 2:
        raise HTTPException(status_code=400, detail="Not enough players")
    expected_player = players_in_room[room.current_turn - 1] if room.current_turn <= len(players_in_room) else None
    if not expected_player or expected_player.id != player_id:
        raise HTTPException(status_code=400, detail="Not your turn")


async def execute_ai_move(room_id: str, ai_player_id: int, db: AsyncSession) -> None:
    """
    Execute an AI player's move.
    
    This function is called when it's the AI's turn in a single-player game.
    It uses the AIPlayer class to determine the best move and executes it.
    
    Args:
        room_id: Room identifier
        ai_player_id: AI player's ID
        db: Database session
    """
    from action_logger import ActionLogger
    
    # Fetch room with players
    room = await get_room_or_404(db, room_id)
    
    if room.game_phase not in ["round1", "round2"]:
        return
    
    # Get AI difficulty
    difficulty = room.ai_difficulty or "medium"
    ai = AIPlayer(difficulty=difficulty)
    
    # Determine which player is AI
    players_in_room = get_sorted_players(room)
    is_ai_player1 = players_in_room[0].id == ai_player_id
    
    # Get AI's hand and opponent info
    ai_hand = room.player1_hand if is_ai_player1 else room.player2_hand
    opponent_hand = room.player2_hand if is_ai_player1 else room.player1_hand
    ai_captured = room.player1_captured if is_ai_player1 else room.player2_captured
    opponent_captured = room.player2_captured if is_ai_player1 else room.player1_captured
    
    if not ai_hand:
        return
    
    # Get AI's move decision
    move = ai.get_move(
        hand=ai_hand,
        table_cards=room.table_cards or [],
        builds=room.builds or [],
        opponent_hand_size=len(opponent_hand) if opponent_hand else 0,
        my_captured=ai_captured or [],
        opponent_captured=opponent_captured or []
    )
    
    # Log the AI action
    action_logger = ActionLogger(db)
    await action_logger.log_game_action(
        room_id=room_id,
        player_id=ai_player_id,
        action_type=move.action,
        action_data={
            "card_id": move.card_id,
            "target_cards": move.target_cards,
            "build_value": move.build_value,
            "is_ai": True
        }
    )
    
    # Convert to game objects
    player1_hand = convert_dict_to_game_cards(room.player1_hand or [])
    player2_hand = convert_dict_to_game_cards(room.player2_hand or [])
    table_cards = convert_dict_to_game_cards(room.table_cards or [])
    builds = convert_dict_to_builds(room.builds or [])
    player1_captured = convert_dict_to_game_cards(room.player1_captured or [])
    player2_captured = convert_dict_to_game_cards(room.player2_captured or [])
    
    ai_hand_cards = player1_hand if is_ai_player1 else player2_hand
    ai_captured_cards = player1_captured if is_ai_player1 else player2_captured
    
    # Find the card being played
    hand_card = next((c for c in ai_hand_cards if c.id == move.card_id), None)
    if not hand_card:
        logger.error(f"AI tried to play card {move.card_id} but it's not in hand")
        return
    
    # Execute the move
    if move.action == "capture":
        target_cards = [c for c in table_cards if c.id in move.target_cards]
        target_builds = [b for b in builds if b.id in move.target_cards]
        
        captured_cards, remaining_builds, _ = game_logic.execute_capture(
            hand_card, target_cards, target_builds, ai_player_id
        )
        
        ai_hand_cards.remove(hand_card)
        # Add captured cards with hand card on top (last in list = top of pile)
        ai_captured_cards.extend(captured_cards[1:])  # Add captured table cards/builds first
        ai_captured_cards.append(captured_cards[0])   # Hand card goes on top (end of list)
        table_cards = [c for c in table_cards if c not in target_cards]
        builds = remaining_builds
        
    elif move.action == "build":
        target_cards = [c for c in table_cards if c.id in move.target_cards]
        
        _, new_build = game_logic.execute_build(
            hand_card, target_cards, move.build_value or 0, ai_player_id
        )
        
        ai_hand_cards.remove(hand_card)
        table_cards = [c for c in table_cards if c not in target_cards]
        builds.append(new_build)
        
    elif move.action == "trail":
        new_table_cards = game_logic.execute_trail(hand_card)
        ai_hand_cards.remove(hand_card)
        table_cards.extend(new_table_cards)
    
    # Update room state
    if is_ai_player1:
        room.player1_hand = convert_game_cards_to_dict(ai_hand_cards)
        room.player1_captured = convert_game_cards_to_dict(ai_captured_cards)
        room.player2_hand = convert_game_cards_to_dict(player2_hand)
        room.player2_captured = convert_game_cards_to_dict(player2_captured)
    else:
        room.player2_hand = convert_game_cards_to_dict(ai_hand_cards)
        room.player2_captured = convert_game_cards_to_dict(ai_captured_cards)
        room.player1_hand = convert_game_cards_to_dict(player1_hand)
        room.player1_captured = convert_game_cards_to_dict(player1_captured)
    
    room.table_cards = convert_game_cards_to_dict(table_cards)
    room.builds = convert_builds_to_dict(builds)
    
    room.last_play = {
        "card_id": move.card_id,
        "action": move.action,
        "target_cards": move.target_cards,
        "build_value": move.build_value,
        "player_id": ai_player_id,
        "is_ai": True
    }
    room.last_action = move.action
    
    # Check if round is complete
    p1_hand = convert_dict_to_game_cards(room.player1_hand or [])
    p2_hand = convert_dict_to_game_cards(room.player2_hand or [])
    
    if game_logic.is_round_complete(p1_hand, p2_hand):
        remaining_deck = convert_dict_to_game_cards(room.deck or [])
        
        if len(remaining_deck) > 0 and room.round_number == 1:
            new_p1_hand, new_p2_hand, new_deck = game_logic.deal_round_cards(
                remaining_deck, p1_hand, p2_hand
            )
            room.player1_hand = convert_game_cards_to_dict(new_p1_hand)
            room.player2_hand = convert_game_cards_to_dict(new_p2_hand)
            room.deck = convert_game_cards_to_dict(new_deck)
            room.round_number = 2
            room.game_phase = "round2"
            room.current_turn = 1
        else:
            room.game_phase = "finished"
            room.game_completed = True
            
            p1_captured = convert_dict_to_game_cards(room.player1_captured or [])
            p2_captured = convert_dict_to_game_cards(room.player2_captured or [])
            
            p1_base = game_logic.calculate_score(p1_captured)
            p2_base = game_logic.calculate_score(p2_captured)
            p1_bonus, p2_bonus = game_logic.calculate_bonus_scores(p1_captured, p2_captured)
            
            room.player1_score = p1_base + p1_bonus
            room.player2_score = p2_base + p2_bonus
            room.winner = game_logic.determine_winner(
                room.player1_score, room.player2_score,
                len(p1_captured), len(p2_captured)
            )
    else:
        room.current_turn = 2 if room.current_turn == 1 else 1
    
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = ai_player_id
    
    await db.commit()

# API Endpoints
@app.post("/rooms/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest, http_request: Request, db: AsyncSession = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Create a new game room"""
    # Apply rate limiting
    await rate_limit_ip(http_request, "room_create")
    
    try:
        # Generate unique room ID (collision chance is negligible with 6 characters)
        room_id = generate_room_id()
        
        # Create room
        room = Room(id=room_id)
        # Ensure JSON fields are initialized for Python 3.6/Pydantic compatibility
        room.deck = []
        room.player1_hand = []
        room.player2_hand = []
        room.table_cards = []
        room.builds = []
        room.player1_captured = []
        room.player2_captured = []
        room.player1_score = 0
        room.player2_score = 0
        room.player1_ready = False
        room.player2_ready = False
        room.game_phase = "waiting"
        room.round_number = 0
        room.current_turn = 1
        db.add(room)
        await db.commit()
        await db.refresh(room)
        
        # Create first player with IP address
        player = Player(
            room_id=room_id, 
            name=request.player_name,
            ip_address=request.ip_address or client_ip
        )
        db.add(player)
        await db.commit()
        await db.refresh(player)
        
        # Create session for the player (with error handling)
        session_token = None
        try:
            from session_manager import get_session_manager
            session_manager = get_session_manager(db)
            session_token = await session_manager.create_session(
                room_id=room_id,
                player_id=player.id,
                player_name=player.name,
                ip_address=client_ip,
                user_agent=http_request.headers.get("user-agent")
            )
            logger.info(f"Session created successfully for player {player.id}")
        except Exception as e:
            logger.error(f"Failed to create session for player {player.id}: {e}")
            # Continue without session - use secure random token as fallback
            import secrets
            from datetime import datetime, timedelta
            session_token = SessionToken(
                token=secrets.token_urlsafe(32),
                room_id=room_id,
                player_id=player.id,
                player_name=player.name,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
        
        # Reload room with players eagerly loaded to avoid MissingGreenlet in game_state_to_response
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Room)
            .where(Room.id == room_id)
            .options(selectinload(Room.players))
        )
        room = result.scalar_one()
        
        return CreateRoomResponse(
            room_id=room_id,
            player_id=player.id,
            session_token=session_token.to_string() if hasattr(session_token, 'to_string') else str(session_token),
            game_state=await game_state_to_response(room)
        )
        
    except Exception as e:
        logger.error(f"Error creating room: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create room: {str(e)}"
        )


@app.post("/rooms/create-ai-game", response_model=CreateRoomResponse)
async def create_ai_game(request: CreateAIGameRequest, http_request: Request, db: AsyncSession = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Create a single-player game against AI opponent - auto-deals cards for immediate play"""
    try:
        # Generate unique room ID
        room_id = generate_room_id()
        
        # Create and deal cards immediately for AI games (no dealer animation needed)
        deck = game_logic.create_deck()
        table_cards, player1_hand, player2_hand, remaining_deck = game_logic.deal_initial_cards(deck)
        
        # Create room with AI flag - starts in round1 with cards already dealt
        room = Room(id=room_id)
        room.deck = convert_game_cards_to_dict(remaining_deck)
        room.player1_hand = convert_game_cards_to_dict(player1_hand)
        room.player2_hand = convert_game_cards_to_dict(player2_hand)
        room.table_cards = convert_game_cards_to_dict(table_cards)
        room.builds = []
        room.player1_captured = []
        room.player2_captured = []
        room.player1_score = 0
        room.player2_score = 0
        room.player1_ready = True  # Human is ready
        room.player2_ready = True  # AI is always ready
        room.game_phase = "round1"  # Start directly in round1 with cards dealt
        room.round_number = 1
        room.current_turn = 1
        room.is_ai_game = True
        room.ai_difficulty = request.difficulty
        room.shuffle_complete = True
        room.card_selection_complete = True
        room.dealing_complete = True
        room.game_started = True
        db.add(room)
        await db.commit()
        await db.refresh(room)
        
        # Create human player (player 1)
        player = Player(
            room_id=room_id,
            name=request.player_name,
            ip_address=request.ip_address or client_ip,
            ready=True
        )
        db.add(player)
        await db.commit()
        await db.refresh(player)
        
        # Create AI player (player 2)
        ai_player = Player(
            room_id=room_id,
            name=f"Computer ({request.difficulty.capitalize()})",
            ip_address="127.0.0.1",
            is_ai=True,
            ready=True
        )
        db.add(ai_player)
        await db.commit()
        await db.refresh(ai_player)
        
        # Create session for human player
        session_token = None
        try:
            from session_manager import get_session_manager
            session_manager = get_session_manager(db)
            session_token = await session_manager.create_session(
                room_id=room_id,
                player_id=player.id,
                player_name=player.name,
                ip_address=client_ip,
                user_agent=http_request.headers.get("user-agent")
            )
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            import secrets
            from datetime import datetime, timedelta
            session_token = SessionToken(
                token=secrets.token_urlsafe(32),
                room_id=room_id,
                player_id=player.id,
                player_name=player.name,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
        
        # Reload room with players
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Room)
            .where(Room.id == room_id)
            .options(selectinload(Room.players))
        )
        room = result.scalar_one()
        
        logger.info(f"AI game created: room={room_id}, difficulty={request.difficulty}, phase=round1, cards dealt")
        
        return CreateRoomResponse(
            room_id=room_id,
            player_id=player.id,
            session_token=session_token.to_string() if hasattr(session_token, 'to_string') else str(session_token),
            game_state=await game_state_to_response(room)
        )
        
    except Exception as e:
        logger.error(f"Error creating AI game: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create AI game: {str(e)}"
        )


@app.post("/rooms/join", response_model=JoinRoomResponse)
async def join_room(request: JoinRoomRequest, http_request: Request, db: AsyncSession = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Join an existing game room"""
    # Apply rate limiting
    await rate_limit_ip(http_request, "room_join")
    
    # Load room with players eagerly to avoid MissingGreenlet errors
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Room)
        .where(Room.id == request.room_id)
        .options(selectinload(Room.players))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if room is full
    if len(room.players) >= 2:
        raise HTTPException(status_code=400, detail="Room is full")
    
    # Check if player name already exists in room
    result = await db.execute(
        select(Player).where(
            Player.room_id == request.room_id,
            Player.name == request.player_name
        )
    )
    existing_player = result.scalar_one_or_none()
    if existing_player:
        raise HTTPException(status_code=400, detail="Player name already taken")
    
    # Create player with IP address
    player = Player(
        room_id=request.room_id, 
        name=request.player_name,
        ip_address=request.ip_address or client_ip
    )
    db.add(player)
    
    # Increment room version to trigger client updates
    from datetime import datetime
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = player.id

    await db.commit()
    await db.refresh(player)
    
    # Create session for the player
    from session_manager import get_session_manager
    session_manager = get_session_manager(db)
    session_token = await session_manager.create_session(
        room_id=request.room_id,
        player_id=player.id,
        player_name=player.name,
        ip_address=client_ip,
        user_agent=http_request.headers.get("user-agent")
    )
    
    # Refresh the room's players relationship to include the new player
    await db.refresh(room, ["players"])
    
    # Get full game state for broadcast
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    
    # Broadcast player joined event with full game state to all connected clients
    await manager.broadcast_to_room(
        {
            "type": "player_joined",
            "room_id": room.id,
            "player_id": player.id,
            "player_name": player.name,
            "player_count": len(room.players),
            "game_state": state_dict
        },
        room.id
    )
    
    return JoinRoomResponse(
        player_id=player.id,
        session_token=session_token.to_string() if hasattr(session_token, 'to_string') else str(session_token),
        game_state=game_state_response
    )

@app.post("/rooms/join-random", response_model=JoinRoomResponse)
async def join_random_room(request: JoinRandomRoomRequest, http_request: Request, db: AsyncSession = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Join a random available game room"""
    # Apply rate limiting
    await rate_limit_ip(http_request, "room_join")
    
    # Find rooms that are in waiting phase with space for another player
    from sqlalchemy import select, func
    from sqlalchemy.orm import selectinload
    
    logger.info(f"Quick match request from player: {request.player_name}")
    
    # Query for waiting rooms with exactly 1 player
    # Use a subquery to count players per room
    result = await db.execute(
        select(Room)
        .where(Room.game_phase == "waiting")
        .options(selectinload(Room.players))
    )
    waiting_rooms = result.scalars().all()
    
    logger.info(f"Found {len(waiting_rooms)} rooms in waiting phase")
    
    # Filter rooms that have exactly 1 player (space for one more)
    rooms_with_space = []
    for room in waiting_rooms:
        player_count = len(room.players) if room.players else 0
        logger.info(f"Room {room.id}: {player_count} players, phase={room.game_phase}")
        if player_count == 1:
            rooms_with_space.append(room)
    
    logger.info(f"Found {len(rooms_with_space)} rooms with space for another player")
    
    # If no rooms available, create a new one
    if not rooms_with_space:
        # Generate unique room ID
        room_id = generate_room_id()
        while True:
            result = await db.execute(select(Room).where(Room.id == room_id))
            if not result.scalar_one_or_none():
                break
            room_id = generate_room_id()
        
        # Create new room
        room = Room(id=room_id)
        room.deck = []
        room.player1_hand = []
        room.player2_hand = []
        room.table_cards = []
        room.builds = []
        room.player1_captured = []
        room.player2_captured = []
        room.player1_score = 0
        room.player2_score = 0
        room.player1_ready = False
        room.player2_ready = False
        room.game_phase = "waiting"
        room.round_number = 0
        room.current_turn = 1
        db.add(room)
        
        # Create player immediately (same transaction as room)
        # This ensures the room is never visible with 0 players
        player = Player(
            room_id=room_id, 
            name=request.player_name,
            ip_address=request.ip_address or client_ip
        )
        db.add(player)
        
        # Commit both room and player together
        await db.commit()
        await db.refresh(room)
        await db.refresh(player)
        
        logger.info(f"Created new room {room_id} with player {player.id}")
    else:
        # Pick a random room from available rooms
        room = random.choice(rooms_with_space)
        logger.info(f"Joining existing room {room.id}")
        
        # Check if player name already exists in room
        result = await db.execute(
            select(Player).where(
                Player.room_id == room.id,
                Player.name == request.player_name
            )
        )
        existing_player = result.scalar_one_or_none()
        if existing_player:
            raise HTTPException(status_code=400, detail="Player name already taken in this room")
        
        # Create player with IP address
        player = Player(
            room_id=room.id, 
            name=request.player_name,
            ip_address=request.ip_address or client_ip
        )
        db.add(player)
        
        # Increment room version to trigger client updates
        from datetime import datetime
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = player.id

        await db.commit()
        await db.refresh(player)
    
    # Create session for the player
    from session_manager import get_session_manager
    session_manager = get_session_manager(db)
    session_token = await session_manager.create_session(
        room_id=room.id,
        player_id=player.id,
        player_name=player.name,
        ip_address=client_ip,
        user_agent=http_request.headers.get("user-agent")
    )
    
    # Reload room with players eagerly loaded to avoid MissingGreenlet in game_state_to_response
    result = await db.execute(
        select(Room)
        .where(Room.id == room.id)
        .options(selectinload(Room.players))
    )
    room = result.scalar_one()
    
    # Get full game state for broadcast
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    
    # Broadcast player joined event with full game state to all connected clients
    await manager.broadcast_to_room(
        {
            "type": "player_joined",
            "room_id": room.id,
            "player_id": player.id,
            "player_name": player.name,
            "player_count": len(room.players),
            "game_state": state_dict
        },
        room.id
    )
    
    return JoinRoomResponse(
        player_id=player.id,
        session_token=session_token.to_string() if hasattr(session_token, 'to_string') else str(session_token),
        game_state=game_state_response
    )

@app.get("/rooms/{room_id}/state", response_model=GameStateResponse)
async def get_game_state(room_id: str, db: AsyncSession = Depends(get_db)):
    """Get current game state"""
    room = await get_room_or_404(db, room_id)
    
    return await game_state_to_response(room)

@app.post("/rooms/player-ready", response_model=StandardResponse)
async def set_player_ready(request: SetPlayerReadyRequest, db: AsyncSession = Depends(get_db)):
    """Set player ready status - Fixed async datetime issue"""
    try:
        from version_validator import validate_version
        from datetime import datetime
        
        logger.info(f"Player ready request: room_id={request.room_id}, player_id={request.player_id}, is_ready={request.is_ready}")
        
        room = await get_room_or_404(db, request.room_id)
        player = await get_player_or_404(db, request.room_id, request.player_id)
        
        logger.info(f"Found room {room.id} with {len(room.players)} players, phase={room.game_phase}")
        
        # Version conflict handling (Requirement 1.3)
        if request.client_version is not None:
            validation = validate_version(request.client_version, room.version)
            if not validation.valid:
                raise HTTPException(
                    status_code=409,  # Conflict status code
                    detail={
                        "error": "version_conflict",
                        "message": validation.message,
                        "client_version": request.client_version,
                        "server_version": room.version,
                        "requires_sync": validation.requires_sync
                    }
                )
        
        player.ready = request.is_ready
        
        # Get sorted players BEFORE any commits while relationship is still loaded
        players_in_room = get_sorted_players(room)
        
        # Update room ready status based on player position in room
        if len(players_in_room) >= 1 and player.id == players_in_room[0].id:
            room.player1_ready = request.is_ready
        elif len(players_in_room) >= 2 and player.id == players_in_room[1].id:
            room.player2_ready = request.is_ready
        
        # Increment version and update metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = request.player_id
        
        # Auto-transition to dealer phase when both players are ready
        if room.player1_ready and room.player2_ready and room.game_phase == "waiting":
            logger.info(f"Both players ready! Transitioning room {room.id} to dealer phase")
            room.game_phase = "dealer"
            # Increment version for phase change
            room.version += 1
            room.last_modified = datetime.utcnow()
            room.modified_by = request.player_id
        
        # Single commit for all changes
        await db.commit()
        
        logger.info(f"Room {room.id} ready status: player1={room.player1_ready}, player2={room.player2_ready}, phase={room.game_phase}")
        
        # Re-fetch room with all attributes loaded fresh (don't use refresh which can cause issues)
        room = await get_room_or_404(db, request.room_id)
        
        # Broadcast game state update to all connected clients with full state
        game_state_response = await game_state_to_response(room)
        # Verify response model structure before broadcast
        state_dict = game_state_response.model_dump()
        
        # Wrap broadcast in try/except to catch connection issues
        try:
            await manager.broadcast_json_to_room({
                "type": "game_state_update",
                "room_id": room.id,
                "game_state": state_dict
            }, room.id)
            logger.info(f"Broadcasted game state update for room {room.id}")
        except Exception as e:
            logger.error(f"Failed to broadcast game state: {e}")
            # Continue execution, don't fail the request just because broadcast failed
        
        return StandardResponse(
            success=True,
            message="Player ready status updated",
            game_state=game_state_response
        )
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logger.error(f"Error in set_player_ready: {error_msg}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/rooms/leave", response_model=StandardResponse)
async def leave_room(request: LeaveRoomRequest, db: AsyncSession = Depends(get_db)):
    """
    Leave a room and clean up player session.
    
    This endpoint allows a player to voluntarily leave a room:
    - Removes the player from the room
    - Clears their session
    - Notifies other players via WebSocket
    - If game was in progress, opponent wins by forfeit
    """
    from datetime import datetime
    from models import GameSession
    
    try:
        logger.info(f"Leave room request: room_id={request.room_id}, player_id={request.player_id}")
        
        room = await get_room_or_404(db, request.room_id)
        
        # Verify player is in the room
        players_in_room = get_sorted_players(room)
        player_ids = [p.id for p in players_in_room]
        
        if request.player_id not in player_ids:
            raise HTTPException(status_code=404, detail="Player not found in room")
        
        # Determine if this player is player 1 or 2
        is_player1 = len(players_in_room) >= 1 and players_in_room[0].id == request.player_id
        
        # If game is in progress (not waiting), opponent wins by forfeit
        if room.game_phase not in ["waiting", "finished"] and len(players_in_room) == 2:
            room.game_phase = "finished"
            room.game_completed = True
            room.winner = 2 if is_player1 else 1  # Other player wins
            logger.info(f"Player {request.player_id} forfeited. Winner: Player {room.winner}")
        
        # Delete any game sessions for this player first (to avoid FK constraint)
        result = await db.execute(
            select(GameSession).where(GameSession.player_id == request.player_id)
        )
        sessions_to_delete = result.scalars().all()
        for session in sessions_to_delete:
            await db.delete(session)
        
        # Remove the player from the room
        player_to_remove = None
        for p in players_in_room:
            if p.id == request.player_id:
                player_to_remove = p
                break
        
        if player_to_remove:
            await db.delete(player_to_remove)
        
        # Reset room ready status for the leaving player
        if is_player1:
            room.player1_ready = False
        else:
            room.player2_ready = False
        
        # Update room metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = request.player_id
        
        await db.commit()
        
        # Clear session from Redis
        try:
            from session_manager import SessionManager
            session_manager = SessionManager()
            session_manager.invalidate_player_sessions(request.room_id, request.player_id)
        except Exception as e:
            logger.warning(f"Failed to clear session: {e}")
        
        # Broadcast player left to remaining players
        try:
            await manager.broadcast_json_to_room({
                "type": "player_left",
                "room_id": room.id,
                "player_id": request.player_id,
                "message": "A player has left the room"
            }, room.id)
        except Exception as e:
            logger.warning(f"Failed to broadcast player left: {e}")
        
        logger.info(f"Player {request.player_id} left room {request.room_id}")
        
        return StandardResponse(
            success=True,
            message="Successfully left the room",
            game_state=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error in leave_room: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/game/start-shuffle", response_model=StandardResponse)
async def start_shuffle(request: StartShuffleRequest, db: AsyncSession = Depends(get_db)):
    """Start the shuffle phase"""
    room = await get_room_or_404(db, request.room_id)
    
    room.shuffle_complete = True
    room.game_phase = "dealer"
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = request.player_id
    
    await db.commit()
    
    # Re-fetch room with players loaded for response
    room = await get_room_or_404(db, request.room_id)
    
    # Broadcast game state update with full state
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    await manager.broadcast_json_to_room({
        "type": "game_state_update",
        "room_id": room.id,
        "game_state": state_dict
    }, room.id)
    
    return StandardResponse(
        success=True,
        message="Shuffle started",
        game_state=game_state_response
    )

@app.post("/game/select-face-up-cards", response_model=StandardResponse)
async def select_face_up_cards(request: SelectFaceUpCardsRequest, db: AsyncSession = Depends(get_db)):
    """Select face-up cards for the game and deal initial cards"""
    room = await get_room_or_404(db, request.room_id)
    
    # Check if it's the right player's turn (Player 1 should select face-up cards)
    players_in_room = get_sorted_players(room)
    if len(players_in_room) == 0 or request.player_id != players_in_room[0].id:
        raise HTTPException(status_code=400, detail="Only Player 1 can select face-up cards")
    
    room.card_selection_complete = True
    room.game_phase = "round1"
    room.game_started = True
    room.round_number = 1
    room.current_turn = 1
    
    # Create and deal cards using game logic
    deck = game_logic.create_deck()
    table_cards, player1_hand, player2_hand, remaining_deck = game_logic.deal_initial_cards(deck)
    
    # Store in database
    room.deck = convert_game_cards_to_dict(remaining_deck)
    room.table_cards = convert_game_cards_to_dict(table_cards)
    room.player1_hand = convert_game_cards_to_dict(player1_hand)
    room.player2_hand = convert_game_cards_to_dict(player2_hand)
    room.dealing_complete = True
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = request.player_id
    
    await db.commit()
    
    # Re-fetch room with players loaded for response
    room = await get_room_or_404(db, request.room_id)
    
    # Broadcast game state update with full state
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    await manager.broadcast_json_to_room({
        "type": "game_state_update",
        "room_id": room.id,
        "game_state": state_dict
    }, room.id)
    
    return StandardResponse(
        success=True,
        message="Cards dealt successfully",
        game_state=game_state_response
    )


@app.post("/game/start", response_model=StandardResponse)
async def start_game(request: StartGameRequest, db: AsyncSession = Depends(get_db)):
    """
    Start the game after dealer animation completes.
    
    This endpoint combines shuffle and deal into a single action:
    1. Creates and shuffles the deck
    2. Deals 12 cards to each player
    3. Places 4 cards face-up on the table
    4. Transitions game phase to round1
    
    Can be called by any player in the room once both are ready.
    """
    room = await get_room_or_404(db, request.room_id)
    
    # Verify game is in dealer phase (both players ready)
    if room.game_phase != "dealer":
        raise HTTPException(
            status_code=400, 
            detail=f"Game must be in dealer phase to start. Current phase: {room.game_phase}"
        )
    
    # Verify player is in the room - get players BEFORE any modifications
    players_in_room = get_sorted_players(room)
    player_ids = [p.id for p in players_in_room]
    if request.player_id not in player_ids:
        raise HTTPException(status_code=400, detail="Player not in room")
    
    # Set shuffle and card selection as complete
    room.shuffle_complete = True
    room.card_selection_complete = True
    room.game_phase = "round1"
    room.game_started = True
    room.round_number = 1
    room.current_turn = 1
    
    # Create and deal cards using game logic
    deck = game_logic.create_deck()
    table_cards, player1_hand, player2_hand, remaining_deck = game_logic.deal_initial_cards(deck)
    
    # Store in database
    room.deck = convert_game_cards_to_dict(remaining_deck)
    room.table_cards = convert_game_cards_to_dict(table_cards)
    room.player1_hand = convert_game_cards_to_dict(player1_hand)
    room.player2_hand = convert_game_cards_to_dict(player2_hand)
    room.dealing_complete = True
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = request.player_id
    
    await db.commit()
    
    # Refresh room to get updated state with relationships loaded
    await db.refresh(room)
    
    logger.info(f"Game started in room {room.id} by player {request.player_id}")
    
    # Re-fetch room with players loaded for response
    room = await get_room_or_404(db, request.room_id)
    
    # Broadcast game state update with full state
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    await manager.broadcast_json_to_room({
        "type": "game_state_update",
        "room_id": room.id,
        "game_state": state_dict
    }, room.id)
    
    return StandardResponse(
        success=True,
        message="Game started! Cards have been dealt.",
        game_state=game_state_response
    )


@app.post("/game/play-card", response_model=StandardResponse)
async def play_card(request: PlayCardRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    """Play a card (capture, build, or trail) with complete game logic"""
    # Apply rate limiting for game actions
    await rate_limit_ip(http_request, "game_action")
    
    from action_logger import ActionLogger
    from version_validator import validate_version
    
    room = await get_room_or_404(db, request.room_id)
    
    # Version conflict handling (Requirement 1.3)
    if request.client_version is not None:
        validation = validate_version(request.client_version, room.version)
        if not validation.valid:
            raise HTTPException(
                status_code=409,  # Conflict status code
                detail={
                    "error": "version_conflict",
                    "message": validation.message,
                    "client_version": request.client_version,
                    "server_version": room.version,
                    "requires_sync": validation.requires_sync,
                    "has_gap": validation.has_gap,
                    "gap_size": validation.gap_size
                }
            )
    
    # Log the action
    action_logger = ActionLogger(db)
    action_id = await action_logger.log_game_action(
        room_id=request.room_id,
        player_id=request.player_id,
        action_type=request.action,
        action_data={
            "card_id": request.card_id,
            "target_cards": request.target_cards,
            "build_value": request.build_value
        }
    )
    
    # Check if game is in progress
    if room.game_phase not in ["round1", "round2"]:
        raise HTTPException(status_code=400, detail="Game is not in progress")
    
    # Check if it's the player's turn
    assert_players_turn(room, request.player_id)
    
    # Convert database data to game objects
    player1_hand = convert_dict_to_game_cards(room.player1_hand or [])
    player2_hand = convert_dict_to_game_cards(room.player2_hand or [])
    table_cards = convert_dict_to_game_cards(room.table_cards or [])
    builds = convert_dict_to_builds(room.builds or [])
    player1_captured = convert_dict_to_game_cards(room.player1_captured or [])
    player2_captured = convert_dict_to_game_cards(room.player2_captured or [])
    
    # Determine which player is playing based on join order
    players_in_room = get_sorted_players(room)
    is_player1 = request.player_id == players_in_room[0].id
    player_hand = player1_hand if is_player1 else player2_hand
    player_captured = player1_captured if is_player1 else player2_captured
    opponent_captured = player2_captured if is_player1 else player1_captured
    
    # Find the card being played
    hand_card = None
    for card in player_hand:
        if card.id == request.card_id:
            hand_card = card
            break
    
    if not hand_card:
        raise HTTPException(status_code=400, detail="Card not found in player's hand")
    
    # Execute the action based on type
    if request.action == "capture":
        # Validate capture
        target_cards = [card for card in table_cards if card.id in (request.target_cards or [])]
        target_builds = [build for build in builds if build.id in (request.target_cards or [])]
        
        if not game_logic.validate_capture(hand_card, target_cards, target_builds):
            raise HTTPException(status_code=400, detail="Invalid capture")
        
        # Execute capture
        captured_cards, remaining_builds, remaining_table_cards = game_logic.execute_capture(
            hand_card, target_cards, target_builds, request.player_id
        )
        
        # Update game state
        player_hand.remove(hand_card)
        # Add captured cards with hand card on top (last in list = top of pile)
        # captured_cards has hand_card first, then target cards - we need hand_card last
        # So we add target/build cards first, then the hand card on top
        player_captured.extend(captured_cards[1:])  # Add captured table cards/builds first
        player_captured.append(captured_cards[0])   # Hand card goes on top (end of list)
        table_cards = [card for card in table_cards if card not in target_cards]
        builds = remaining_builds
        
    elif request.action == "build":
        target_cards = [card for card in table_cards if card.id in (request.target_cards or [])]
        
        # Check opponent's top captured card
        opponent_top_card = None
        if opponent_captured and opponent_captured[-1].id in (request.target_cards or []):
            opponent_top_card = opponent_captured[-1]
            target_cards.append(opponent_top_card)

        # Also extract builds from target_cards (for adding to existing builds)
        target_builds = [build for build in builds if build.id in (request.target_cards or [])]
        
        if not game_logic.validate_build(hand_card, target_cards, request.build_value or 0, player_hand, target_builds):
            raise HTTPException(status_code=400, detail="Invalid build")
        
        # Execute build
        remaining_table_cards, new_build = game_logic.execute_build(
            hand_card, target_cards, request.build_value or 0, request.player_id, target_builds
        )
        
        # Update game state
        # Update game state
        player_hand.remove(hand_card)
        table_cards = [card for card in table_cards if card not in target_cards]
        
        # Remove from opponent captured if used (check top card only)
        if opponent_top_card:
            opponent_captured.remove(opponent_top_card)

        # Remove the target builds that were incorporated into the new build
        builds = [b for b in builds if b.id not in [tb.id for tb in target_builds]]
        builds.append(new_build)
        
    elif request.action == "trail":
        # Execute trail
        new_table_cards = game_logic.execute_trail(hand_card)
        
        # Update game state
        player_hand.remove(hand_card)
        table_cards.extend(new_table_cards)
        
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Update database with new game state
    room.player1_hand = convert_game_cards_to_dict(player1_hand)
    room.player2_hand = convert_game_cards_to_dict(player2_hand)
    room.table_cards = convert_game_cards_to_dict(table_cards)
    room.builds = convert_builds_to_dict(builds)
    room.player1_captured = convert_game_cards_to_dict(player1_captured)
    room.player2_captured = convert_game_cards_to_dict(player2_captured)
    
    # Update last play information
    room.last_play = {
        "card_id": request.card_id,
        "action": request.action,
        "target_cards": request.target_cards,
        "build_value": request.build_value,
        "player_id": request.player_id
    }
    room.last_action = request.action
    
    # Check if round is complete
    if game_logic.is_round_complete(player1_hand, player2_hand):
        # Deal new cards for round 2 if available
        remaining_deck = convert_dict_to_game_cards(room.deck or [])
        
        if len(remaining_deck) > 0 and room.round_number == 1:
            # Deal round 2 cards
            new_player1_hand, new_player2_hand, new_deck = game_logic.deal_round_cards(
                remaining_deck, player1_hand, player2_hand
            )
            
            room.player1_hand = convert_game_cards_to_dict(new_player1_hand)
            room.player2_hand = convert_game_cards_to_dict(new_player2_hand)
            room.deck = convert_game_cards_to_dict(new_deck)
            room.round_number = 2
            room.game_phase = "round2"
            room.current_turn = 1  # Reset turn to player 1 for round 2
        else:
            # Game is complete
            room.game_phase = "finished"
            room.game_completed = True
            
            # Calculate final scores
            p1_base_score = game_logic.calculate_score(player1_captured)
            p2_base_score = game_logic.calculate_score(player2_captured)
            p1_bonus, p2_bonus = game_logic.calculate_bonus_scores(player1_captured, player2_captured)
            
            room.player1_score = p1_base_score + p1_bonus
            room.player2_score = p2_base_score + p2_bonus
            
            # Determine winner
            room.winner = game_logic.determine_winner(
                room.player1_score, room.player2_score,
                len(player1_captured), len(player2_captured)
            )
    else:
        # Switch turns
        room.current_turn = 2 if room.current_turn == 1 else 1
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = request.player_id
    
    await db.commit()
    
    # Re-fetch room with players loaded for response
    room = await get_room_or_404(db, request.room_id)
    
    # Broadcast game state update with full state
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    await manager.broadcast_json_to_room({
        "type": "game_state_update",
        "room_id": room.id,
        "game_state": state_dict
    }, room.id)
    
    # If this is an AI game and it's now AI's turn, execute AI move
    if room.is_ai_game and room.game_phase in ["round1", "round2"] and not room.game_completed:
        players_in_room = get_sorted_players(room)
        ai_player = next((p for p in players_in_room if p.is_ai), None)
        
        if ai_player:
            ai_player_num = 1 if players_in_room[0].is_ai else 2
            
            if room.current_turn == ai_player_num:
                # Execute AI move after a short delay (for UX)
                import asyncio
                await asyncio.sleep(1.0)  # 1 second delay for natural feel
                
                await execute_ai_move(room.id, ai_player.id, db)
                
                # Re-fetch and broadcast updated state
                room = await get_room_or_404(db, request.room_id)
                game_state_response = await game_state_to_response(room)
                state_dict = game_state_response.model_dump()
                await manager.broadcast_json_to_room({
                    "type": "game_state_update",
                    "room_id": room.id,
                    "game_state": state_dict
                }, room.id)
    
    return StandardResponse(
        success=True,
        message="Card played successfully",
        game_state=game_state_response
    )



@app.post("/game/table-build", response_model=StandardResponse)
async def table_build(request: TableBuildRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Create a build from table cards only (non-standard rule).
    
    This action does NOT consume a turn - it allows players to combine
    table cards into a build without playing a card from their hand.
    
    Rules:
    - Must select at least 2 table cards
    - Cards must sum to the declared build value
    - Player must have a card in hand that can capture the build
    """
    # Apply rate limiting for game actions
    await rate_limit_ip(http_request, "game_action")
    
    from action_logger import ActionLogger
    from schemas import TableBuildRequest
    
    room = await get_room_or_404(db, request.room_id)
    
    # Log the action
    action_logger = ActionLogger(db)
    action_id = await action_logger.log_game_action(
        room_id=request.room_id,
        player_id=request.player_id,
        action_type="table_build",
        action_data={
            "target_cards": request.target_cards,
            "build_value": request.build_value
        }
    )
    
    # Check if game is in progress
    if room.game_phase not in ["round1", "round2"]:
        raise HTTPException(status_code=400, detail="Game is not in progress")
    
    # Check if it's the player's turn (table builds can only be done on your turn)
    assert_players_turn(room, request.player_id)
    
    # Convert database data to game objects
    player1_hand = convert_dict_to_game_cards(room.player1_hand or [])
    player2_hand = convert_dict_to_game_cards(room.player2_hand or [])
    table_cards = convert_dict_to_game_cards(room.table_cards or [])
    builds = convert_dict_to_builds(room.builds or [])
    player1_captured = convert_dict_to_game_cards(room.player1_captured or [])
    player2_captured = convert_dict_to_game_cards(room.player2_captured or [])
    
    # Determine which player is playing
    players_in_room = get_sorted_players(room)
    is_player1 = request.player_id == players_in_room[0].id
    player_hand = player1_hand if is_player1 else player2_hand
    opponent_captured = player2_captured if is_player1 else player1_captured
    
    # Find target cards on table
    target_cards = [card for card in table_cards if card.id in request.target_cards]
    
    # Check opponent's top captured card
    opponent_top_card = None
    if opponent_captured and opponent_captured[-1].id in request.target_cards:
        opponent_top_card = opponent_captured[-1]
        target_cards.append(opponent_top_card)
    
    if len(target_cards) != len(request.target_cards):
        raise HTTPException(status_code=400, detail="Some target cards not found on table or opponent's pile")
    
    # Validate table build
    if not game_logic.validate_table_build(target_cards, request.build_value, player_hand):
        raise HTTPException(status_code=400, detail="Invalid table build. Cards must sum to build value and you need a card to capture it.")
    
    # Execute table build - use player number (1 or 2), not database ID
    player_num = 1 if is_player1 else 2
    new_build = game_logic.execute_table_build(target_cards, request.build_value, player_num)
    
    # Update game state - remove cards from table, add build
    table_cards = [card for card in table_cards if card.id not in request.target_cards]
    
    # Remove from opponent captured if used (check top card only)
    if opponent_top_card:
        opponent_captured.remove(opponent_top_card)
        
    builds.append(new_build)
    
    # Update database
    room.table_cards = convert_game_cards_to_dict(table_cards)
    room.builds = convert_builds_to_dict(builds)
    room.player1_captured = convert_game_cards_to_dict(player1_captured)
    room.player2_captured = convert_game_cards_to_dict(player2_captured)
    
    # Note: We do NOT switch turns for table-only builds
    # The player still needs to play a card from their hand
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = request.player_id
    
    await db.commit()
    
    # Re-fetch room with players loaded for response
    room = await get_room_or_404(db, request.room_id)
    
    # Broadcast game state update
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    await manager.broadcast_json_to_room({
        "type": "game_state_update",
        "room_id": room.id,
        "game_state": state_dict
    }, room.id)
    
    return StandardResponse(
        success=True,
        message="Table build created successfully",
        game_state=game_state_response
    )

@app.post("/game/reset", response_model=StandardResponse)
async def reset_game(room_id: str, db: AsyncSession = Depends(get_db)):
    """Reset the game"""
    room = await get_room_or_404(db, room_id)
    
    # Reset game state
    room.game_phase = "waiting"
    room.current_turn = 1
    room.round_number = 0
    room.deck = []
    room.player1_hand = []
    room.player2_hand = []
    room.table_cards = []
    room.builds = []
    room.player1_captured = []
    room.player2_captured = []
    room.player1_score = 0
    room.player2_score = 0
    room.shuffle_complete = False
    room.card_selection_complete = False
    room.dealing_complete = False
    room.game_started = False
    room.game_completed = False
    room.last_play = None
    room.last_action = None
    room.winner = None
    room.player1_ready = False
    room.player2_ready = False
    
    # Reset player ready status
    for player in room.players:
        player.ready = False
    
    # Increment version and update metadata (reset is a state change)
    from datetime import datetime
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = None  # Reset doesn't have a specific player
    
    await db.commit()
    
    return StandardResponse(
        success=True,
        message="Game reset successfully",
        game_state=await game_state_to_response(room)
    )

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str,
    session_token: str = None
):
    """
    WebSocket endpoint with session support and server-side keep-alive
    
    Query params:
        session_token: Optional session token for reconnection
    """
    import sys
    session_id = None
    game_session = None
    ping_task = None
    
    # Apply WebSocket rate limiting
    try:
        from rate_limiter import check_rate_limit, RATE_LIMITS
        client_ip = websocket.client.host if websocket.client else "127.0.0.1"
        # Check for forwarded headers
        forwarded_for = websocket.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        limit, window = RATE_LIMITS.get("websocket", (10, 60))
        allowed, _, _ = await check_rate_limit(f"websocket:{client_ip}", limit, window)
        
        if not allowed:
            logger.warning(f"WebSocket rate limit exceeded for IP {client_ip}")
            await websocket.close(code=1008, reason="Rate limit exceeded")
            return
    except Exception as e:
        logger.warning(f"WebSocket rate limit check failed: {e}")
        # Allow connection if rate limit check fails
    
    # Use print for guaranteed log output with flush
    logger.info(f"WebSocket connection attempt for room {room_id}")
    
    async def send_server_ping():
        """Send periodic pings to keep connection alive (Render has aggressive idle timeout)"""
        try:
            while True:
                try:
                    await websocket.send_json({
                        "type": "server_ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except Exception as e:
                    logger.debug(f"Server ping failed (connection likely closed): {e}")
                    break
                await asyncio.sleep(3)  # Send ping every 3 seconds (very aggressive for Render)
        except asyncio.CancelledError:
            pass
    
    try:
        # Create a fresh database session for the connection phase
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            # Connect with session validation
            success, error, game_session = await manager.connect(
                websocket, room_id, session_token, db
            )
            
            if not success:
                logger.warning(f"WebSocket connection failed for room {room_id}: {error}")
                return
            
            # Get session_id from the session data - use token as the identifier
            session_id = game_session.get("token") if game_session else None
            logger.info(f"WebSocket connected for room {room_id}")
        
        # Send immediate ping to establish keep-alive before any delay
        try:
            await websocket.send_json({
                "type": "server_ping",
                "timestamp": datetime.utcnow().isoformat()
            })
        except Exception as e:
            logger.debug(f"Failed to send immediate ping: {e}")
        
        # Start server-side ping task to keep connection alive
        ping_task = asyncio.create_task(send_server_ping())
        
        # Main message loop (no database session needed for most operations)
        while True:
            try:
                data = await websocket.receive_text()
            except Exception as recv_error:
                logger.debug(f"Error receiving message in room {room_id}: {recv_error}")
                break
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                # Handle different message types
                if message_type == "ping":
                    # Heartbeat ping from client - respond with pong and update session heartbeat
                    try:
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        
                        # Update session heartbeat in database to extend TTL
                        if session_id:
                            try:
                                async with AsyncSessionLocal() as heartbeat_db:
                                    session_manager = get_session_manager(heartbeat_db)
                                    await session_manager.update_heartbeat(session_id)
                            except Exception as hb_error:
                                logger.debug(f"Failed to update heartbeat: {hb_error}")
                    except Exception as ping_error:
                        logger.debug(f"Error handling ping: {ping_error}")
                
                elif message_type == "pong":
                    # Client responding to server ping - connection is alive
                    pass
                
                elif message_type == "state_update":
                    # Broadcast state update to room
                    await manager.broadcast_to_room(data, room_id)
                
                elif message_type == "takeover_session":
                    # Handle session takeover from another tab
                    if session_id:
                        # Close old connection if exists
                        await manager.broadcast_json_to_room({
                            "type": "session_taken_over",
                            "session_id": session_id
                        }, room_id)
                
                # Voice chat signaling messages (legacy)
                elif message_type in ["voice_offer", "voice_answer", "voice_ice_candidate", "voice_mute_status"]:
                    # Validate session for voice signaling
                    if not session_id:
                        await websocket.send_json({
                            "type": "error",
                            "code": "no_session",
                            "message": "Session required for voice signaling"
                        })
                        continue
                    
                    # Validate that session belongs to this room
                    if game_session and game_session.get("room_id") != room_id:
                        await websocket.send_json({
                            "type": "error",
                            "code": "wrong_room",
                            "message": "Session does not belong to this room"
                        })
                        continue
                    
                    # Relay signaling message to opponent (all players except sender)
                    relay_message = {
                        "type": message_type,
                        "data": message.get("data"),
                        "from_player": session_id
                    }
                    
                    # Send to all players in room except the sender
                    sent = await manager.send_to_room_except(
                        room_id=room_id,
                        exclude_session_id=session_id,
                        message=relay_message
                    )
                    
                    if not sent:
                        logger.warning(f"Voice signaling message not delivered: {message_type} from {session_id}")
                
                # Communication messages (chat, media status, WebRTC signaling)
                elif message_type == "chat_message":
                    # Relay chat message to opponent
                    if not session_id:
                        await websocket.send_json({
                            "type": "error",
                            "code": "no_session",
                            "message": "Session required for chat"
                        })
                        continue
                    
                    msg_data = message.get("data", {})
                    relay_message = {
                        "type": "chat_message",
                        "data": {
                            "id": msg_data.get("id"),
                            "content": msg_data.get("content"),
                            "sender_id": session_id,
                            "sender_name": msg_data.get("sender_name", "Player")
                        }
                    }
                    
                    sent = await manager.send_to_room_except(
                        room_id=room_id,
                        exclude_session_id=session_id,
                        message=relay_message
                    )
                    logger.debug(f"Chat message relayed: {sent}")
                
                elif message_type == "media_status":
                    # Relay media status (audio/video mute state) to opponent
                    if not session_id:
                        continue
                    
                    relay_message = {
                        "type": "media_status",
                        "data": message.get("data", {})
                    }
                    
                    await manager.send_to_room_except(
                        room_id=room_id,
                        exclude_session_id=session_id,
                        message=relay_message
                    )
                
                elif message_type in ["webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"]:
                    # WebRTC signaling for voice/video calls
                    if not session_id:
                        await websocket.send_json({
                            "type": "error",
                            "code": "no_session",
                            "message": "Session required for WebRTC signaling"
                        })
                        continue
                    
                    relay_message = {
                        "type": message_type,
                        "data": message.get("data", {}),
                        "from_player": session_id
                    }
                    
                    await manager.send_to_room_except(
                        room_id=room_id,
                        exclude_session_id=session_id,
                        message=relay_message
                    )
                
                else:
                    # Default: broadcast to room
                    await manager.broadcast_to_room(data, room_id)
                    
            except json.JSONDecodeError:
                # Not JSON, broadcast as-is
                await manager.broadcast_to_room(data, room_id)
                
    except WebSocketDisconnect:
        pass
    finally:
        # Cancel the ping task
        if ping_task:
            ping_task.cancel()
            try:
                await ping_task
            except asyncio.CancelledError:
                pass
        
        # Clean up on disconnect
        await manager.disconnect(websocket, room_id)
        
        # Broadcast updated connection status
        try:
            await manager.broadcast_to_room({
                "type": "player_disconnected",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            }, room_id)
        except Exception as e:
            logger.error(f"Failed to broadcast disconnect status: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
