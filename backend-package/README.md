# Casino Backend Package

## Manual Deployment Instructions

1. Upload this entire folder to your hosting server
2. SSH into your server
3. Navigate to this directory
4. Run: `python3 start.py`

## Requirements
- Python 3.11+
- pip

## Files
- `main.py` - FastAPI application
- `models.py` - Database models
- `schemas.py` - Pydantic schemas
- `database.py` - Database configuration
- `requirements.txt` - Python dependencies
- `start.py` - Startup script

## API Endpoints
- Health: GET /health
- Create Room: POST /rooms/create
- Join Room: POST /rooms/join
- Get Game State: GET /rooms/{room_id}/state
- Set Player Ready: POST /rooms/player-ready
- Play Card: POST /game/play-card
- Start Shuffle: POST /game/start-shuffle
- Select Face-up Cards: POST /game/select-face-up-cards
- Reset Game: POST /game/reset
