import React from 'react'
import { Card } from './Card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'
import type { GameState } from '../apiClient'

interface PokerTableViewProps {
  gameState: GameState
  playerId: number
  onPlayCard: (cardId: string, action: string, targetCards?: string[], buildValue?: number) => void
  onLeave?: () => void
}

interface GameCard {
  id: string
  suit: string
  rank: string
}

export function PokerTableView({
  gameState,
  playerId,
  onPlayCard,
  onLeave
}: PokerTableViewProps) {
  // Validate we have required data
  if (!gameState || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950">
        <div className="text-white">Loading game state...</div>
      </div>
    )
  }

  // Ensure we have players
  if (!gameState.players || gameState.players.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950">
        <div className="text-white">Waiting for players...</div>
      </div>
    )
  }

  // Determine which player we are - sort players by joined_at to get consistent player1/player2
  const sortedPlayers = [...(gameState.players || [])].sort((a, b) => {
    const aTime = a.joined_at ? new Date(a.joined_at).getTime() : 0
    const bTime = b.joined_at ? new Date(b.joined_at).getTime() : 0
    return aTime - bTime
  })
  const player1Model = sortedPlayers[0]
  const player2Model = sortedPlayers[1]
  
  // Player 1 is the first to join (sorted by joined_at)
  const isPlayer1 = player1Model?.id === playerId
  
  // Get player hands - always show player 1 on left, player 2 on right
  const player1Hand = gameState.player1Hand || []
  const player2Hand = gameState.player2Hand || []
  const tableCards = gameState.tableCards || []
  
  // Determine if it's our turn - compare with actual player IDs
  const currentTurnPlayerId = gameState.currentTurn
  const isMyTurn = currentTurnPlayerId === playerId
  
  // Get player names - use sorted players for consistency
  const player1Name = player1Model?.name || 'Player 1'
  const player2Name = player2Model?.name || 'Player 2'
  
  // Get scores - consistent for both players
  const player1Score = gameState.player1Score || 0
  const player2Score = gameState.player2Score || 0
  
  // Our score and opponent score
  const myScore = isPlayer1 ? player1Score : player2Score
  const opponentScore = isPlayer1 ? player2Score : player1Score
  
  // Handle card click for playing cards
  const handleCardClick = (cardId: string) => {
    if (isMyTurn && onPlayCard) {
      // For now, just play the card with a trail action
      // In a real implementation, this would open an action menu
      onPlayCard(cardId, 'trail')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 relative overflow-hidden" data-testid="poker-table-view">
      {/* Leave Button - Top Right */}
      {onLeave && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={onLeave}
            variant="outline"
            size="sm"
            className="bg-red-900/50 border-red-500 text-white hover:bg-red-800/70"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Game
          </Button>
        </div>
      )}
      
      {/* Room Background - Classic Casino */}
      <div className="absolute inset-0">
        {/* Dark Wood Paneling */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 opacity-90"></div>
        
        {/* Red Velvet Curtains - Background */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-red-900 via-red-800 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-red-900 via-red-800 to-transparent opacity-50"></div>
        
        {/* Red Velvet Curtains - Left */}
        <div className="absolute left-0 top-0 w-40 h-full bg-gradient-to-r from-red-900 via-red-800 to-transparent opacity-40"></div>
        
        {/* Red Velvet Curtains - Right */}
        <div className="absolute right-0 top-0 w-40 h-full bg-gradient-to-l from-red-900 via-red-800 to-transparent opacity-40"></div>
        
        {/* Gold Wall Sconces - Left */}
        <div className="absolute left-12 top-24 w-16 h-24 z-10">
          <div className="w-full h-full bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-400 rounded-lg opacity-40 blur-sm shadow-lg"></div>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Gold Wall Sconces - Right */}
        <div className="absolute right-12 top-24 w-16 h-24 z-10">
          <div className="w-full h-full bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-400 rounded-lg opacity-40 blur-sm shadow-lg"></div>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Poker Table */}
        <div className="relative w-full max-w-6xl mb-8">
          {/* Table Surface - Green Felt */}
          <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 rounded-3xl p-16 border-8 border-amber-800 shadow-2xl min-h-[600px]">
            {/* Felt Texture Pattern */}
            <div className="absolute inset-0 opacity-20 rounded-3xl">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)'
              }} />
            </div>

            {/* DEALER Label - Top Center */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30" data-testid="dealer-label">
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 px-8 py-3 rounded-lg shadow-lg border-2 border-yellow-300">
                <div className="text-amber-900 font-black text-xl tracking-wider">DEALER</div>
              </div>
            </div>

            {/* Dealer Deck Position - Top Center */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20">
              <div className="relative">
                {/* Dealer's Deck */}
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-14 h-20 bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-700 rounded-lg shadow-lg"
                      style={{ transform: `translateX(${i * 2}px) translateY(${i * 2}px)` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* COMMUNITY CARDS Label and Area - Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" data-testid="community-cards-area">
              <div className="text-center mb-4">
                <div className="inline-block bg-gradient-to-br from-yellow-400/90 via-yellow-500/90 to-yellow-600/90 px-6 py-2 rounded-lg backdrop-blur-sm border border-yellow-300/50 shadow-lg" data-testid="community-cards-label">
                  <div className="text-amber-900 font-black text-base tracking-wider">COMMUNITY CARDS</div>
                </div>
              </div>
              
              {/* Community Cards Display */}
              <div className="flex gap-2 justify-center items-center mt-4">
                {tableCards.length > 0 ? (
                  tableCards.map((card: GameCard) => (
                    <div
                      key={card.id}
                      className="transform hover:scale-110 transition-transform duration-200"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                      }}
                    >
                      <Card
                        suit={card.suit}
                        rank={card.rank}
                        id={card.id}
                        size="medium"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-white/40 text-sm">No cards on table</div>
                )}
              </div>
            </div>

            {/* BURN PILE Area - Left of Community Cards */}
            <div className="absolute top-1/2 left-24 -translate-y-1/2 z-20">
              <div className="text-center mb-2">
                <div className="inline-block bg-gradient-to-br from-yellow-400/80 via-yellow-500/80 to-yellow-600/80 px-4 py-1 rounded-lg backdrop-blur-sm border border-yellow-300/50">
                  <div className="text-amber-900 font-bold text-xs tracking-wider">BURN PILE</div>
                </div>
              </div>
              <div className="flex gap-1 justify-center mt-2">
                {/* Burn cards would go here - typically face down */}
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-16 bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-700 rounded-lg shadow-lg"
                    style={{ transform: `translateX(${i * 2}px) translateY(${i * 2}px)` }}
                  />
                ))}
              </div>
            </div>

            {/* Player 1 - Left Side */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-30">
              <div className="relative">
                {/* Holographic UI - Above Player */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-56 bg-gradient-to-br from-blue-500/30 to-blue-600/30 backdrop-blur-md rounded-xl p-4 border-2 border-blue-400/60 shadow-2xl">
                  <div className="text-white font-bold text-base text-center mb-2">{player1Name}</div>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="text-3xl">♠️</div>
                    <Badge className={isPlayer1 && isMyTurn ? 'bg-green-500' : player1Model?.id === currentTurnPlayerId ? 'bg-yellow-500' : 'bg-gray-600'}>
                      Score: {player1Score}
                    </Badge>
                  </div>
                  {isMyTurn && isPlayer1 && (
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Bet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-400 hover:bg-red-500/20"
                      >
                        Fold
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Player Hand - Always show player1Hand on left, but visible only if we are player 1 */}
                <div className="flex gap-2 justify-center items-center">
                  {player1Hand.map((card: GameCard, index: number) => (
                    <div
                      key={card.id}
                      className={`transform transition-all duration-200 ${
                        isPlayer1 && isMyTurn ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer' : ''
                      }`}
                      style={{
                        filter: isPlayer1 ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))' : 'none',
                        zIndex: player1Hand.length - index
                      }}
                      onClick={isPlayer1 && isMyTurn ? () => handleCardClick(card.id) : undefined}
                    >
                      <Card
                        suit={card.suit}
                        rank={card.rank}
                        id={card.id}
                        isHidden={!isPlayer1}
                        size="medium"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Poker Chips - Below Player */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-yellow-400 shadow-lg"
                      style={{
                        background: i === 0 ? 'radial-gradient(circle, #22c55e 0%, #16a34a 100%)' :
                                   i === 1 ? 'radial-gradient(circle, #ffffff 0%, #e5e7eb 100%)' :
                                   'radial-gradient(circle, #3b82f6 0%, #2563eb 100%)',
                        transform: `translateX(${i * 2}px) translateY(${i * 2}px)`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Player 2 - Right Side */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30">
              <div className="relative">
                {/* Holographic UI - Above Player */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-56 bg-gradient-to-br from-blue-500/30 to-blue-600/30 backdrop-blur-md rounded-xl p-4 border-2 border-blue-400/60 shadow-2xl">
                  <div className="text-white font-bold text-base text-center mb-2">{player2Name}</div>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="text-3xl">♣️</div>
                    <Badge className={!isPlayer1 && isMyTurn ? 'bg-green-500' : player2Model?.id === currentTurnPlayerId ? 'bg-yellow-500' : 'bg-gray-600'}>
                      Score: {player2Score}
                    </Badge>
                  </div>
                  {isMyTurn && !isPlayer1 && (
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Bet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-400 hover:bg-red-500/20"
                      >
                        Fold
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Player Hand - Always show player2Hand on right, but visible only if we are player 2 */}
                <div className="flex gap-2 justify-center items-center">
                  {player2Hand.map((card: GameCard, index: number) => (
                    <div
                      key={card.id}
                      className={`transform transition-all duration-200 ${
                        !isPlayer1 && isMyTurn ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer' : ''
                      }`}
                      style={{
                        filter: !isPlayer1 ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))' : 'none',
                        zIndex: player2Hand.length - index
                      }}
                      onClick={!isPlayer1 && isMyTurn ? () => handleCardClick(card.id) : undefined}
                    >
                      <Card
                        suit={card.suit}
                        rank={card.rank}
                        id={card.id}
                        isHidden={isPlayer1}
                        size="medium"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Poker Chips - Below Player */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-yellow-400 shadow-lg"
                      style={{
                        background: i === 0 ? 'radial-gradient(circle, #22c55e 0%, #16a34a 100%)' :
                                   i === 1 ? 'radial-gradient(circle, #ffffff 0%, #e5e7eb 100%)' :
                                   'radial-gradient(circle, #3b82f6 0%, #2563eb 100%)',
                        transform: `translateX(${i * 2}px) translateY(${i * 2}px)`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Poker Chips - Near Dealer */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-yellow-400 shadow-lg"
                  style={{
                    background: i === 0 ? 'radial-gradient(circle, #ef4444 0%, #dc2626 100%)' :
                                 i === 1 ? 'radial-gradient(circle, #3b82f6 0%, #2563eb 100%)' :
                                 'radial-gradient(circle, #ffffff 0%, #e5e7eb 100%)',
                    transform: `translateX(${i * 3}px) translateY(${i * 2}px)`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Game Info - Bottom */}
        <div className="mt-6 flex items-center gap-4 text-white/80 text-sm">
          <Badge className="bg-blue-500/50">
            Round {gameState.round || 1}
          </Badge>
          <span>•</span>
          <span>{isMyTurn ? 'Your Turn' : `${isPlayer1 ? player2Name : player1Name}'s Turn`}</span>
          <span>•</span>
          <span>Your Score: {myScore} | Opponent: {opponentScore}</span>
        </div>
      </div>
    </div>
  )
}

