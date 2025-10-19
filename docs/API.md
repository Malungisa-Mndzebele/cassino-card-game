## API Reference

Base URL
- Local: `http://localhost:8000`
- Production: configured via `VITE_API_URL` or reverse proxy

Authentication
- None (room/player identity tracked by IDs returned from create/join)

### Health
- GET `/health` → `{ status, message }`

### Rooms
- POST `/rooms/create`
  - Body: `{ player_name: string, ip_address?: string }`
  - Returns: `{ room_id: string, player_id: number, game_state: GameState }`

- POST `/rooms/join`
  - Body: `{ room_id: string, player_name: string, ip_address?: string }`
  - Returns: `{ player_id: number, game_state: GameState }`

- GET `/rooms/{room_id}/state`
  - Returns: `{ room_id, players, ... }` (GameState)

- POST `/rooms/player-ready`
  - Body: `{ room_id: string, player_id: number, is_ready: boolean }`
  - Returns: `{ success, message, game_state }`

### Game
- POST `/game/start-shuffle`
  - Body: `{ room_id: string, player_id: number }`
  - Returns: `{ success, message, game_state }`

- POST `/game/select-face-up-cards`
  - Body: `{ room_id: string, player_id: number, card_ids: string[] }`
  - Returns: `{ success, message, game_state }`

- POST `/game/play-card`
  - Body: `{ room_id: string, player_id: number, card_id: string, action: 'capture'|'build'|'trail', target_cards?: string[], build_value?: number }`
  - Returns: `{ success, message, game_state }`

- POST `/game/reset`
  - Params: `room_id` (query)
  - Returns: `{ success, message, game_state }`

### Realtime
- WS `/ws/{room_id}`: broadcast-only channel. Clients refetch state on message.

### GameState (response)
- Fields:
  - `room_id: string`
  - `players: Array<{ id, name, ready, joined_at, ip_address? }>`
  - `phase: 'waiting'|'dealer'|'round1'|'round2'|'finished'`
  - `round: number`
  - `deck`, `player1_hand`, `player2_hand`, `table_cards`, `builds`, captured piles
  - `player1_score`, `player2_score`, `current_turn`
  - Flags: `card_selection_complete`, `shuffle_complete`, `dealing_complete`, `game_started`, `game_completed`
  - `last_play`, `last_action`, `last_update`, `winner`, `player1_ready`, `player2_ready`

Notes
- Player 1 is the earliest `joined_at` player in a room.
- Build rules enforce that a player must hold a capturing card for the build value.


