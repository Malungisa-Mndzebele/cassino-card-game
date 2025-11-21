// Game types
export interface Card {
    rank: string;
    suit: string;
    value: number;
}

export interface Player {
    id: string;
    name: string;
    score: number;
    hand: Card[];
    captured: Card[];
}

export interface GameState {
    roomId: string;
    phase: GamePhase;
    round: number;
    players: Player[];
    tableCards: Card[];
    currentPlayer: string;
    deck: Card[];
    player1Hand: Card[];
    player2Hand: Card[];
    player1Captured: Card[];
    player2Captured: Card[];
    player1Score: number;
    player2Score: number;
    player1Ready: boolean;
    player2Ready: boolean;
    winner: string | null;
    lastAction: GameAction | null;
}

export type GamePhase =
    | 'waiting'
    | 'dealer'
    | 'cardSelection'
    | 'dealing'
    | 'round1'
    | 'round2'
    | 'finished';

export interface GameAction {
    type: 'capture' | 'build' | 'trail';
    playerId: string;
    card: Card;
    targetCards?: Card[];
    buildValue?: number;
    timestamp: number;
}

// API types
export interface CreateRoomResponse {
    room_id: string;
    player_id: string;
    player_name: string;
}

export interface JoinRoomResponse {
    room_id: string;
    player_id: string;
    player_name: string;
}

export interface GameStateResponse {
    game_state: GameState;
}

export interface ErrorResponse {
    detail: string;
}
