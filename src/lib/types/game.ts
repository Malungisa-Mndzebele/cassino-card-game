// Game types
export interface Card {
    id: string;
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
    currentTurn: number;
    deck: Card[];
    player1Hand: Card[];
    player2Hand: Card[];
    player1Captured: Card[];
    player2Captured: Card[];
    player1Score: number;
    player2Score: number;
    player1Ready: boolean;
    player2Ready: boolean;
    winner: string | number | null;
    lastAction: GameAction | null;
    lastUpdate?: string;
    builds?: any[];
    shuffleComplete?: boolean;
    cardSelectionComplete?: boolean;
    // State synchronization fields
    version?: number;
    checksum?: string;
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
    game_state: GameState;
}

export interface JoinRoomResponse {
    room_id: string;
    player_id: string;
    player_name: string;
    game_state: GameState;
}

export interface GameStateResponse {
    game_state: GameState;
}

export interface ErrorResponse {
    detail: string;
}
