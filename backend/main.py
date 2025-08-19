from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random
import string
import json
from datetime import datetime

from .database import get_db, engine
from .models import Base, Room, Player, GameSession
from .schemas import (
    CreateRoomRequest, JoinRoomRequest, SetPlayerReadyRequest,
    PlayCardRequest, StartShuffleRequest, SelectFaceUpCardsRequest,
    CreateRoomResponse, JoinRoomResponse, StandardResponse, GameStateResponse, PlayerResponse
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Casino Card Game API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "https://khasinogaming.com",
        "https://www.khasinogaming.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Casino Card Game Backend is running - Railway deployment test"}

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

# Utility functions
def generate_room_id() -> str:
    """Generate a 6-character room ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_deck() -> List[Dict[str, Any]]:
    """Create a standard deck of cards"""
    suits = ['hearts', 'diamonds', 'clubs', 'spades']
    ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    deck = []
    
    for suit in suits:
        for rank in ranks:
            deck.append({
                'id': f"{rank}_{suit}",
                'suit': suit,
                'rank': rank,
                'value': 1 if rank == 'A' else min(10, int(rank)) if rank.isdigit() else 10
            })
    
    random.shuffle(deck)
    return deck

def game_state_to_response(room: Room) -> GameStateResponse:
    """Convert room model to game state response"""
    return GameStateResponse(
        room_id=room.id,
        players=[PlayerResponse(
            id=p.id,
            name=p.name,
            ready=p.ready,
            joined_at=p.joined_at
        ) for p in room.players],
        phase=room.game_phase,
        round=room.round_number,
        deck=room.deck,
        player1_hand=room.player1_hand,
        player2_hand=room.player2_hand,
        table_cards=room.table_cards,
        builds=room.builds,
        player1_captured=room.player1_captured,
        player2_captured=room.player2_captured,
        player1_score=room.player1_score,
        player2_score=room.player2_score,
        current_turn=room.current_turn,
        card_selection_complete=room.card_selection_complete,
        shuffle_complete=room.shuffle_complete,
        countdown_start_time=None,  # TODO: Implement countdown
        game_started=room.game_started,
        last_play=room.last_play,
        last_action=room.last_action,
        last_update=room.last_update,
        game_completed=room.game_completed,
        winner=room.winner,
        dealing_complete=room.dealing_complete,
        player1_ready=room.player1_ready,
        player2_ready=room.player2_ready,
        countdown_remaining=None  # TODO: Implement countdown
    )

# API Endpoints
@app.post("/rooms/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest, db: Session = Depends(get_db)):
    """Create a new game room"""
    # Generate unique room ID
    room_id = generate_room_id()
    while db.query(Room).filter(Room.id == room_id).first():
        room_id = generate_room_id()
    
    # Create room
    room = Room(id=room_id)
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Create first player
    player = Player(room_id=room_id, name=request.player_name)
    db.add(player)
    db.commit()
    db.refresh(player)
    
    return CreateRoomResponse(
        room_id=room_id,
        player_id=player.id,
        game_state=game_state_to_response(room)
    )

@app.post("/rooms/join", response_model=JoinRoomResponse)
async def join_room(request: JoinRoomRequest, db: Session = Depends(get_db)):
    """Join an existing game room"""
    # Check if room exists
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
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
    
    # Create player
    player = Player(room_id=request.room_id, name=request.player_name)
    db.add(player)
    db.commit()
    db.refresh(player)
    
    return JoinRoomResponse(
        player_id=player.id,
        game_state=game_state_to_response(room)
    )

@app.get("/rooms/{room_id}/state", response_model=Dict[str, GameStateResponse])
async def get_game_state(room_id: str, db: Session = Depends(get_db)):
    """Get current game state"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {"game_state": game_state_to_response(room)}

@app.post("/rooms/player-ready", response_model=StandardResponse)
async def set_player_ready(request: SetPlayerReadyRequest, db: Session = Depends(get_db)):
    """Set player ready status"""
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    player = db.query(Player).filter(
        Player.id == request.player_id,
        Player.room_id == request.room_id
    ).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player.ready = request.is_ready
    db.commit()
    
    # Update room ready status
    if request.player_id == 1:
        room.player1_ready = request.is_ready
    else:
        room.player2_ready = request.is_ready
    
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Player ready status updated",
        game_state=game_state_to_response(room)
    )

@app.post("/game/start-shuffle", response_model=StandardResponse)
async def start_shuffle(request: StartShuffleRequest, db: Session = Depends(get_db)):
    """Start the shuffle phase"""
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
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
    """Select face-up cards for the game"""
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.card_selection_complete = True
    room.game_phase = "round1"
    room.game_started = True
    
    # Deal cards (simplified for now)
    deck = create_deck()
    room.deck = deck[4:]  # Remove 4 cards for table
    room.table_cards = deck[:4]  # First 4 cards on table
    room.player1_hand = deck[4:8]  # Next 4 cards to player 1
    room.player2_hand = deck[8:12]  # Next 4 cards to player 2
    
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Face-up cards selected",
        game_state=game_state_to_response(room)
    )

@app.post("/game/play-card", response_model=StandardResponse)
async def play_card(request: PlayCardRequest, db: Session = Depends(get_db)):
    """Play a card (capture, build, or trail)"""
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # TODO: Implement actual game logic
    room.last_play = {
        "card_id": request.card_id,
        "action": request.action,
        "target_cards": request.target_cards,
        "build_value": request.build_value
    }
    room.last_action = request.action
    
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
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
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
