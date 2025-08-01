import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface GameCard {
  suit: string
  rank: string
  id: string
}

interface GameState {
  id: string
  players: string[]
  playerHands: { [playerId: string]: GameCard[] }
  currentTurn: number
  currentTrick: GameCard[]
  scores: { [playerId: string]: number }
  status: 'waiting' | 'playing' | 'finished'
  winner?: string
}

export function CardGame() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Generate unique player ID
    const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setPlayerId(id)
  }, [])

  useEffect(() => {
    if (gameId) {
      const interval = setInterval(pollGameState, 2000)
      return () => clearInterval(interval)
    }
  }, [gameId, playerId])

  const pollGameState = async () => {
    if (!gameId || !playerId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/game/${gameId}?playerId=${playerId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setGameState(data.gameState)
      }
    } catch (error) {
      console.log('Error polling game state:', error)
    }
  }

  const joinGame = async () => {
    if (!playerId || isJoining) return

    setIsJoining(true)
    setError('')

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/join-game`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ playerId }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setGameId(data.gameId)
        setGameState(data.gameState)
      } else {
        setError(data.error || 'Failed to join game')
      }
    } catch (error) {
      console.log('Error joining game:', error)
      setError('Connection error. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const playCard = async (cardId: string) => {
    if (!gameId || !playerId || !gameState) return

    const currentPlayerIndex = gameState.currentTurn % gameState.players.length
    const currentPlayerId = gameState.players[currentPlayerIndex]
    
    if (playerId !== currentPlayerId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/play-card`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ gameId, playerId, cardId }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setGameState(data.gameState)
      } else {
        setError(data.error || 'Failed to play card')
      }
    } catch (error) {
      console.log('Error playing card:', error)
      setError('Failed to play card')
    }
  }

  const resetGame = async () => {
    if (!gameId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/reset-game`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ gameId }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setGameState(data.gameState)
        setError('')
      } else {
        setError(data.error || 'Failed to reset game')
      }
    } catch (error) {
      console.log('Error resetting game:', error)
      setError('Failed to reset game')
    }
  }

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥'
      case 'diamonds': return '♦'
      case 'clubs': return '♣'
      case 'spades': return '♠'
      default: return suit
    }
  }

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black'
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Card Game</h1>
            <p className="text-gray-600">
              Join a game to play against another player online!
            </p>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <Button 
              onClick={joinGame} 
              disabled={isJoining}
              className="w-full"
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Waiting for Player</h1>
            <p className="text-gray-600">
              Game ID: {gameId}
            </p>
            <p className="text-sm text-gray-500">
              Share this URL with another player to start the game.
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const playerHand = gameState.playerHands[playerId] || []
  const currentPlayerIndex = gameState.currentTurn % gameState.players.length
  const currentPlayerId = gameState.players[currentPlayerIndex]
  const isMyTurn = playerId === currentPlayerId
  const opponentId = gameState.players.find(p => p !== playerId) || ''
  const opponentHandSize = gameState.playerHands[opponentId]?.length || 0

  return (
    <div className="min-h-screen bg-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Card Game</h1>
              <p className="text-sm text-gray-600">Game ID: {gameId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Your Score</p>
                <Badge variant="secondary" className="text-lg">
                  {gameState.scores[playerId] || 0}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Opponent Score</p>
                <Badge variant="secondary" className="text-lg">
                  {gameState.scores[opponentId] || 0}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow">
          {gameState.status === 'finished' ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-green-600">
                Game Over!
              </h2>
              <p className="text-lg">
                {gameState.winner === playerId 
                  ? 'You Won!' 
                  : gameState.winner === 'tie' 
                    ? "It's a Tie!" 
                    : 'You Lost!'}
              </p>
              <Button onClick={resetGame}>Play Again</Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg">
                {isMyTurn ? "Your Turn" : "Opponent's Turn"}
              </p>
              {gameState.currentTrick.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Cards in play: {gameState.currentTrick.length}/2
                </p>
              )}
            </div>
          )}
        </div>

        {/* Current Trick */}
        {gameState.currentTrick.length > 0 && (
          <div className="bg-white rounded-lg p-4 mb-4 shadow">
            <h3 className="text-lg font-semibold mb-2 text-center">Current Trick</h3>
            <div className="flex justify-center space-x-4">
              {gameState.currentTrick.map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className="bg-white border-2 border-gray-300 rounded-lg p-3 shadow-sm"
                >
                  <div className={`text-center ${getSuitColor(card.suit)}`}>
                    <div className="text-lg font-bold">{card.rank}</div>
                    <div className="text-2xl">{getSuitSymbol(card.suit)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opponent Info */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow">
          <div className="text-center">
            <p className="text-sm text-gray-600">Opponent Cards</p>
            <div className="flex justify-center mt-2">
              {Array.from({ length: Math.min(opponentHandSize, 10) }).map((_, index) => (
                <div
                  key={index}
                  className="w-8 h-12 bg-blue-600 border border-blue-700 rounded-sm -ml-2 first:ml-0"
                />
              ))}
              {opponentHandSize > 10 && (
                <span className="ml-2 text-sm text-gray-600">
                  +{opponentHandSize - 10} more
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Player Hand */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-4 text-center">Your Cards ({playerHand.length})</h3>
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {playerHand.map((card) => (
              <button
                key={card.id}
                onClick={() => playCard(card.id)}
                disabled={!isMyTurn || gameState.status !== 'playing'}
                className={`
                  bg-white border-2 rounded-lg p-3 shadow-sm transition-all
                  ${isMyTurn && gameState.status === 'playing'
                    ? 'border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer'
                    : 'border-gray-300 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className={`text-center ${getSuitColor(card.suit)}`}>
                  <div className="text-lg font-bold">{card.rank}</div>
                  <div className="text-2xl">{getSuitSymbol(card.suit)}</div>
                </div>
              </button>
            ))}
          </div>
          {playerHand.length === 0 && gameState.status === 'playing' && (
            <p className="text-center text-gray-500">No cards left</p>
          )}
        </div>
      </div>
    </div>
  )
}