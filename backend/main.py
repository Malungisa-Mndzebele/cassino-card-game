from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
import os
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random
import string
import json
from datetime import datetime

from database import get_db, engine
from models import Base, Room, Player, GameSession
from schemas import (
    CreateRoomRequest, JoinRoomRequest, JoinRandomRoomRequest, SetPlayerReadyRequest,
    PlayCardRequest, StartShuffleRequest, SelectFaceUpCardsRequest,
    CreateRoomResponse, JoinRoomResponse, StandardResponse, GameStateResponse, PlayerResponse
)
from fastapi import Request
from game_logic import CasinoGameLogic, GameCard, Build

# Note: Database tables are now managed by Alembic migrations
# Run migrations with: alembic upgrade head

# Dependency to get client IP address
def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
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

# Support mounting behind a path prefix (e.g., /cassino-api on shared hosting)
ROOT_PATH = os.getenv("ROOT_PATH", "")
app = FastAPI(title="Casino Card Game API", version="1.0.0", root_path=ROOT_PATH)

# Add CORS middleware
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
if cors_origins_str == "*":
    # For local development, allow common localhost ports
    if os.getenv("ENVIRONMENT") != "production" or os.getenv("FLY_APP_NAME") is None:
        cors_origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://localhost:5173/cassino",
            "http://127.0.0.1:5173/cassino",
        ]
    else:
        cors_origins = ["*"]
else:
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False if "*" in cors_origins else True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check that doesn't require database connection"""
    # Try to check database connection without failing
    db_healthy = True
    try:
        from database import engine
        with engine.connect() as conn:
            pass
    except Exception as e:
        db_healthy = False
    
    return {
        "status": "healthy" if db_healthy else "degraded",
        "message": "Casino Card Game Backend is running",
        "database": "connected" if db_healthy else "disconnected"
    }

# Root endpoint for API
@app.get("/")
async def root():
    return {"message": "Casino Card Game API", "version": "1.0.0"}

# Add explicit CORS preflight handler
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        }
    )

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

manager = ConnectionManager()

# Initialize game logic
game_logic = CasinoGameLogic()

# Utility functions
def generate_room_id() -> str:
    """Generate a 6-character room ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def convert_game_cards_to_dict(cards: List[GameCard]) -> List[Dict[str, Any]]:
    """Convert GameCard objects to dictionary format for JSON storage"""
    return [{"id": card.id, "suit": card.suit, "rank": card.rank, "value": card.value} for card in cards]

def convert_dict_to_game_cards(cards_dict: List[Dict[str, Any]]) -> List[GameCard]:
    """Convert dictionary format to GameCard objects"""
    return [GameCard(id=card["id"], suit=card["suit"], rank=card["rank"], value=card["value"]) for card in cards_dict]

def convert_builds_to_dict(builds: List[Build]) -> List[Dict[str, Any]]:
    """Convert Build objects to dictionary format for JSON storage"""
    return [{"id": build.id, "cards": convert_game_cards_to_dict(build.cards), "value": build.value, "owner": build.owner} for build in builds]

def convert_dict_to_builds(builds_dict: List[Dict[str, Any]]) -> List[Build]:
    """Convert dictionary format to Build objects"""
    return [Build(id=build["id"], cards=convert_dict_to_game_cards(build["cards"]), value=build["value"], owner=build["owner"]) for build in builds_dict]

def game_state_to_response(room: Room) -> GameStateResponse:
    """Convert room model to game state response"""
    return GameStateResponse(
        room_id=room.id,
        players=[PlayerResponse(
            id=p.id,
            name=p.name,
            ready=bool(p.ready),
            joined_at=p.joined_at,
            ip_address=p.ip_address
        ) for p in (room.players or [])],
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
        last_update=room.last_update,
        game_completed=bool(room.game_completed),
        winner=room.winner,
        dealing_complete=bool(room.dealing_complete),
        player1_ready=bool(room.player1_ready),
        player2_ready=bool(room.player2_ready),
        countdown_remaining=None  # TODO: Implement countdown
    )

# Helper functions to reduce duplication across endpoints
def get_room_or_404(db: Session, room_id: str) -> Room:
    """Fetch a room or raise 404 if not found."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

def get_sorted_players(room: Room) -> List[Player]:
    """Return players sorted by joined time (player 1 first)."""
    return sorted(room.players, key=lambda p: p.joined_at)

def get_player_or_404(db: Session, room_id: str, player_id: int) -> Player:
    """Fetch a player in a room or raise 404 if not found."""
    player = db.query(Player).filter(
        Player.id == player_id,
        Player.room_id == room_id,
    ).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

def assert_players_turn(room: Room, player_id: int) -> None:
    """Validate it's the given player's turn, else 400."""
    players_in_room = get_sorted_players(room)
    if len(players_in_room) < 2:
        raise HTTPException(status_code=400, detail="Not enough players")
    expected_player = players_in_room[room.current_turn - 1] if room.current_turn <= len(players_in_room) else None
    if not expected_player or expected_player.id != player_id:
        raise HTTPException(status_code=400, detail="Not your turn")

# API Endpoints
@app.post("/rooms/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest, db: Session = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Create a new game room"""
    try:
        # Generate unique room ID
        room_id = generate_room_id()
        # Check if room exists (may fail if tables don't exist - migrations needed)
        while db.query(Room).filter(Room.id == room_id).first():
            room_id = generate_room_id()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}. Please run migrations: flyctl ssh console -C 'cd /app && python -m alembic upgrade head'"
        )
    
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
    db.commit()
    db.refresh(room)
    
    # Create first player with IP address
    player = Player(
        room_id=room_id, 
        name=request.player_name,
        ip_address=request.ip_address or client_ip
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    
    return CreateRoomResponse(
        room_id=room_id,
        player_id=player.id,
        game_state=game_state_to_response(room)
    )

@app.post("/rooms/join", response_model=JoinRoomResponse)
async def join_room(request: JoinRoomRequest, db: Session = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Join an existing game room"""
    room = get_room_or_404(db, request.room_id)
    
    # Check if room is full
    if len(room.players) >= 2:
        raise HTTPException(status_code=400, detail="Room is full")
    
    # Check if player name already exists in room
    existing_player = db.query(Player).filter(
        Player.room_id == request.room_id,
        Player.name == request.player_name
    ).first()
    if existing_player:
        raise HTTPException(status_code=400, detail="Player name already taken")
    
    # Create player with IP address
    player = Player(
        room_id=request.room_id, 
        name=request.player_name,
        ip_address=request.ip_address or client_ip
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    
    return JoinRoomResponse(
        player_id=player.id,
        game_state=game_state_to_response(room)
    )

@app.post("/rooms/join-random", response_model=JoinRoomResponse)
async def join_random_room(request: JoinRandomRoomRequest, db: Session = Depends(get_db), client_ip: str = Depends(get_client_ip)):
    """Join a random available game room"""
    # Find rooms that are in waiting phase and have space (less than 2 players)
    available_rooms = db.query(Room).filter(
        Room.game_phase == "waiting"
    ).all()
    
    # Filter rooms that have space (less than 2 players)
    rooms_with_space = [room for room in available_rooms if len(room.players) < 2]
    
    # If no rooms available, create a new one
    if not rooms_with_space:
        # Generate unique room ID
        room_id = generate_room_id()
        while db.query(Room).filter(Room.id == room_id).first():
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
        db.commit()
        db.refresh(room)
    else:
        # Pick a random room from available rooms
        room = random.choice(rooms_with_space)
    
    # Check if player name already exists in room
    existing_player = db.query(Player).filter(
        Player.room_id == room.id,
        Player.name == request.player_name
    ).first()
    if existing_player:
        raise HTTPException(status_code=400, detail="Player name already taken in this room")
    
    # Create player with IP address
    player = Player(
        room_id=room.id, 
        name=request.player_name,
        ip_address=request.ip_address or client_ip
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    
    return JoinRoomResponse(
        player_id=player.id,
        game_state=game_state_to_response(room)
    )

@app.get("/rooms/{room_id}/state", response_model=GameStateResponse)
async def get_game_state(room_id: str, db: Session = Depends(get_db)):
    """Get current game state"""
    room = get_room_or_404(db, room_id)
    
    return game_state_to_response(room)

@app.post("/rooms/player-ready", response_model=StandardResponse)
async def set_player_ready(request: SetPlayerReadyRequest, db: Session = Depends(get_db)):
    """Set player ready status"""
    room = get_room_or_404(db, request.room_id)
    player = get_player_or_404(db, request.room_id, request.player_id)
    
    player.ready = request.is_ready
    db.commit()
    
    # Update room ready status based on player position in room
    players_in_room = get_sorted_players(room)
    if len(players_in_room) >= 1 and player.id == players_in_room[0].id:
        room.player1_ready = request.is_ready
    elif len(players_in_room) >= 2 and player.id == players_in_room[1].id:
        room.player2_ready = request.is_ready
    
    db.commit()
    
    # Auto-transition to dealer phase when both players are ready
    if room.player1_ready and room.player2_ready and room.game_phase == "waiting":
        room.game_phase = "dealer"
        db.commit()
    
    return StandardResponse(
        success=True,
        message="Player ready status updated",
        game_state=game_state_to_response(room)
    )

@app.post("/game/start-shuffle", response_model=StandardResponse)
async def start_shuffle(request: StartShuffleRequest, db: Session = Depends(get_db)):
    """Start the shuffle phase"""
    room = get_room_or_404(db, request.room_id)
    
    room.shuffle_complete = True
    room.game_phase = "dealer"
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Shuffle started",
        game_state=game_state_to_response(room)
    )

@app.post("/game/select-face-up-cards", response_model=StandardResponse)
async def select_face_up_cards(request: SelectFaceUpCardsRequest, db: Session = Depends(get_db)):
    """Select face-up cards for the game and deal initial cards"""
    room = get_room_or_404(db, request.room_id)
    
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
    
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Cards dealt successfully",
        game_state=game_state_to_response(room)
    )

@app.post("/game/play-card", response_model=StandardResponse)
async def play_card(request: PlayCardRequest, db: Session = Depends(get_db)):
    """Play a card (capture, build, or trail) with complete game logic"""
    room = get_room_or_404(db, request.room_id)
    
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
        player_captured.extend(captured_cards)
        table_cards = [card for card in table_cards if card not in target_cards]
        builds = remaining_builds
        
    elif request.action == "build":
        # Validate build
        target_cards = [card for card in table_cards if card.id in (request.target_cards or [])]
        
        if not game_logic.validate_build(hand_card, target_cards, request.build_value or 0, player_hand):
            raise HTTPException(status_code=400, detail="Invalid build")
        
        # Execute build
        remaining_table_cards, new_build = game_logic.execute_build(
            hand_card, target_cards, request.build_value or 0, request.player_id
        )
        
        # Update game state
        player_hand.remove(hand_card)
        table_cards = [card for card in table_cards if card not in target_cards]
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
    
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Card played successfully",
        game_state=game_state_to_response(room)
    )

@app.post("/game/reset", response_model=StandardResponse)
async def reset_game(room_id: str, db: Session = Depends(get_db)):
    """Reset the game"""
    room = get_room_or_404(db, room_id)
    
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
    
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Game reset successfully",
        game_state=game_state_to_response(room)
    )

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle real-time messages here
            await manager.broadcast_to_room(data, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
