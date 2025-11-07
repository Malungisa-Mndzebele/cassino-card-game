/**
 * Centralized type definitions for the game
 */

export interface Player {
  id: number
  name: string
  ready: boolean
  joined_at: string
}

export interface Card {
  id: string
  suit: string
  rank: string
  value: number
}

export interface Build {
  id: string
  cards: Card[]
  value: number
  owner: number
}

export interface GameState {
  roomId: string
  players: Player[]
  phase: string
  round: number
  deck: Card[]
  player1Hand: Card[]
  player2Hand: Card[]
  tableCards: Card[]
  builds: Build[]
  player1Captured: Card[]
  player2Captured: Card[]
  player1Score: number
  player2Score: number
  currentTurn: number
  cardSelectionComplete: boolean
  shuffleComplete: boolean
  countdownStartTime: string | null
  gameStarted: boolean
  lastPlay: any | null
  lastAction: string | null
  lastUpdate: string
  gameCompleted: boolean
  winner: number | null
  dealingComplete: boolean
  player1Ready: boolean
  player2Ready: boolean
  countdownRemaining: number | null
}

export interface GamePreferences {
  soundEnabled: boolean
  soundVolume: number
  hintsEnabled: boolean
  statisticsEnabled: boolean
}

export interface GameStatistics {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  totalScore: number
  bestScore: number
  currentWinStreak: number
  longestWinStreak: number
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export type GamePhase = 'waiting' | 'dealer' | 'cardSelection' | 'dealing' | 'round1' | 'round2' | 'finished'