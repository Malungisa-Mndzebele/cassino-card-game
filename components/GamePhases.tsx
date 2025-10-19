import React, { useState, useEffect } from 'react'
import { Card } from './Card'
import { GameActions } from './GameActions'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { GamePreferences } from './GameSettings'
import { Dealer } from './Dealer'

interface GameCard {
  id: string
  suit: string
  rank: string
}

interface GamePhasesProps {
  gameState: any
  playerId: number
  onSelectFaceUpCards: (cardIds: string[]) => void
  onPlayCard: (cardId: string, action: string, targetCards?: string[], buildValue?: number) => void
  onResetGame: () => void
  onPlayerReady: () => void
  onPlayerNotReady: () => void
  preferences: GamePreferences
}

export function GamePhases({ 
  gameState, 
  playerId, 
  onSelectFaceUpCards, 
  onPlayCard,
  onResetGame,
  onPlayerReady,
  onPlayerNotReady,
  preferences
}: GamePhasesProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [isShuffling, setIsShuffling] = useState(false)

  // Hooks must always run in consistent order
  // no-op for legacy countdownRemaining

  // Auto-transition from dealer to countdown when both players are ready
  useEffect(() => {
    if (gameState.phase === 'dealer' && gameState.player1Ready && gameState.player2Ready) {
      // The transition will be handled by the setPlayerReady mutation
      // This effect just ensures the UI updates properly
    }
  }, [gameState.phase, gameState.player1Ready, gameState.player2Ready])

  // Countdown UI not used by backend flow

  useEffect(() => {
    if (gameState.phase === 'shuffling') {
      setIsShuffling(true)
      const timer = setTimeout(() => setIsShuffling(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState.phase])

  // Early return after hooks are registered
  if (!gameState) return null;

  const handleCardSelection = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId))
    } else if (selectedCards.length < 4) {
      setSelectedCards([...selectedCards, cardId])
    }
  }

  const confirmCardSelection = () => {
    if (selectedCards.length === 4) {
      onSelectFaceUpCards(selectedCards)
      setSelectedCards([])
    }
  }

  const getScoreBreakdown = (capturedCards: GameCard[]) => {
    const breakdown = {
      aces: 0,
      twoOfSpades: 0,
      tenOfDiamonds: 0,
      totalCards: capturedCards.length,
      spades: capturedCards.filter(card => card.suit === 'spades').length
    }
    
    breakdown.aces = capturedCards.filter(card => card.rank === 'A').length
    breakdown.twoOfSpades = capturedCards.some(card => card.rank === '2' && card.suit === 'spades') ? 1 : 0
    breakdown.tenOfDiamonds = capturedCards.some(card => card.rank === '10' && card.suit === 'diamonds') ? 2 : 0
    
    return breakdown
  }

  if (gameState.phase === 'dealer') {
    return (
      <Dealer
        gameState={gameState}
        playerId={playerId}
        onPlayerReady={onPlayerReady}
        onPlayerNotReady={onPlayerNotReady}
      />
    )
  }

  // No separate countdown phase in backend; omit dedicated view

  // No separate readyToShuffle phase in backend; handled via dealer/round1

  if (gameState.phase === 'shuffling' || isShuffling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Shuffling Cards</h2>
        <div className="relative mb-6">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-16 h-24 bg-blue-800 border-2 border-blue-900 rounded-lg transition-all duration-500 ${
                  isShuffling ? 'animate-bounce' : ''
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  transform: isShuffling ? `translateY(-${Math.sin(Date.now() / 200 + i) * 10}px)` : 'none'
                }}
              >
                <div className="text-white text-center mt-8">🂠</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-center">
          The dealer is shuffling the deck...
        </p>
      </div>
    )
  }

  if (gameState.phase === 'cardSelection') {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Card Selection Phase</h2>
        <p className="text-gray-600 mb-6 text-center">
          {playerId === 1 
            ? "Select 4 cards to place face up on the table" 
            : "Player 1 is selecting 4 cards to place face up on the table"}
        </p>
        
        {playerId === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant={selectedCards.length === 4 ? "default" : "secondary"}>
                {selectedCards.length}/4 cards selected
              </Badge>
            </div>
            
            <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto p-4 border rounded-lg">
              {gameState.deck.slice(0, 20).map((card: GameCard) => (
                <Card
                  key={card.id}
                  suit={card.suit}
                  rank={card.rank}
                  id={card.id}
                  onClick={() => handleCardSelection(card.id)}
                  isPlayable={true}
                  size="small"
                />
              ))}
            </div>
            
            <div className="text-center">
              <Button 
                onClick={confirmCardSelection}
                disabled={selectedCards.length !== 4}
                size="lg"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (gameState.phase === 'dealing' || gameState.phase === 'dealingRound2') {
    const isRound2 = gameState.phase === 'dealingRound2'
    
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">
          {isRound2 ? 'Dealing Cards for Round 2' : 'Dealing Cards'}
        </h2>
        <div className="mb-6">
          <div className="flex space-x-8">
            <div className="text-center">
              <div className="w-20 h-28 bg-green-600 border-2 border-green-700 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white">P1</span>
              </div>
              <p className="text-sm">Player 1</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-24 bg-blue-800 border-2 border-blue-900 rounded-lg flex items-center justify-center animate-pulse">
                <div className="text-white">🂠</div>
              </div>
              <p className="text-sm mt-2">Dealer</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-28 bg-red-600 border-2 border-red-700 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white">P2</span>
              </div>
              <p className="text-sm">Player 2</p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-center">
          {isRound2 
            ? "The dealer is distributing 4 more cards to each player..."
            : "The dealer is distributing 4 cards to each player alternately..."
          }
        </p>
      </div>
    )
  }

  if (gameState.phase === 'round1' || gameState.phase === 'round2') {
    const currentPlayerHand = playerId === 1 ? gameState.player1Hand : gameState.player2Hand
    const myCaptures = playerId === 1 ? gameState.player1Captured : gameState.player2Captured
    const opponentCaptures = playerId === 1 ? gameState.player2Captured : gameState.player1Captured
    const isMyTurn = gameState.currentTurn === playerId
    const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score
    const opponentScore = playerId === 1 ? gameState.player2Score : gameState.player1Score

    const myBreakdown = getScoreBreakdown(myCaptures || [])
    const opponentBreakdown = getScoreBreakdown(opponentCaptures || [])

    return (
      <div className="space-y-6">
        {/* Score Header */}
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                Cassino - Round {gameState.round}
                {gameState.phase === 'round2' && gameState.round === 2 && " (Final Round)"}
              </h2>
              <p className="text-sm text-gray-600">
                {isMyTurn ? "Your turn" : `Player ${gameState.currentTurn}'s turn`}
              </p>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Your Score</p>
                <Badge variant="default" className="text-lg">
                  {myScore}/11
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Opponent</p>
                <Badge variant="secondary" className="text-lg">
                  {opponentScore}/11
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Captured Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Your Captures */}
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold mb-3">Your Captured Cards ({myCaptures?.length || 0})</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Aces:</span>
                <Badge variant="secondary">{myBreakdown.aces} pts</Badge>
              </div>
              <div className="flex justify-between">
                <span>2♠:</span>
                <Badge variant="secondary">{myBreakdown.twoOfSpades} pts</Badge>
              </div>
              <div className="flex justify-between">
                <span>10♦:</span>
                <Badge variant="secondary">{myBreakdown.tenOfDiamonds} pts</Badge>
              </div>
              <div className="flex justify-between">
                <span>Spades:</span>
                <span>{myBreakdown.spades}</span>
              </div>
            </div>
            {myCaptures && myCaptures.length > 0 && (
              <div className="mt-3 max-h-20 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {myCaptures.slice(-10).map((card: GameCard, index: number) => (
                    <Card
                      key={`${card.id}-${index}`}
                      suit={card.suit}
                      rank={card.rank}
                      id={card.id}
                      size="small"
                    />
                  ))}
                  {myCaptures.length > 10 && (
                    <span className="text-xs text-gray-500 self-center ml-2">
                      +{myCaptures.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Opponent Captures */}
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold mb-3">Opponent Captured ({opponentCaptures?.length || 0})</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Aces:</span>
                <Badge variant="outline">{opponentBreakdown.aces} pts</Badge>
              </div>
              <div className="flex justify-between">
                <span>2♠:</span>
                <Badge variant="outline">{opponentBreakdown.twoOfSpades} pts</Badge>
              </div>
              <div className="flex justify-between">
                <span>10♦:</span>
                <Badge variant="outline">{opponentBreakdown.tenOfDiamonds} pts</Badge>
              </div>
              <div className="flex justify-between">
                <span>Spades:</span>
                <span>{opponentBreakdown.spades}</span>
              </div>
            </div>
            <div className="mt-3 text-center text-gray-500">
              <div className="w-12 h-16 bg-gray-200 rounded mx-auto"></div>
              <p className="text-xs mt-1">Hidden cards</p>
            </div>
          </div>
        </div>

        {/* Last Play */}
        {gameState.lastPlay && (
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold mb-2">Last Play</h3>
            <p className="text-sm text-gray-600">
              Player {gameState.lastPlay.playerId} {gameState.lastPlay.action}ed {gameState.lastPlay.card.rank}♦
              {gameState.lastPlay.action === 'capture' && ` (${gameState.lastPlay.capturedCards?.length || 0} cards)`}
              {gameState.lastPlay.action === 'build' && ` (value ${gameState.lastPlay.buildValue})`}
            </p>
          </div>
        )}

        {/* Game Actions */}
        <GameActions
          playerHand={currentPlayerHand || []}
          tableCards={gameState.tableCards || []}
          builds={gameState.builds || []}
          onPlayCard={onPlayCard}
          isMyTurn={isMyTurn}
          hintsEnabled={preferences.hintsEnabled}
          soundEnabled={preferences.soundEnabled}
          playerId={playerId}
        />
      </div>
    )
  }

  if (gameState.phase === 'finished') {
    const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score
    const opponentScore = playerId === 1 ? gameState.player2Score : gameState.player1Score
    const isWinner = gameState.winner === playerId
    const isTie = gameState.winner === 'tie'

    const myCaptures = playerId === 1 ? gameState.player1Captured : gameState.player2Captured
    const opponentCaptures = playerId === 1 ? gameState.player2Captured : gameState.player1Captured
    const myBreakdown = getScoreBreakdown(myCaptures || [])
    const opponentBreakdown = getScoreBreakdown(opponentCaptures || [])

    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className={`text-3xl font-bold mb-4 ${
            isTie ? 'text-yellow-600' : isWinner ? 'text-green-600' : 'text-red-600'
          }`}>
            {isTie ? "It's a Tie!" : isWinner ? "You Won!" : "You Lost!"}
          </h2>
          
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Final Scores</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="font-medium text-gray-600">Your Score</p>
                <div className={`text-3xl font-bold ${isWinner ? 'text-green-600' : 'text-gray-800'}`}>
                  {myScore}/11
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <div>Aces: {myBreakdown.aces}</div>
                  <div>2♠: {myBreakdown.twoOfSpades}</div>
                  <div>10♦: {myBreakdown.tenOfDiamonds}</div>
                  <div>Cards: {myBreakdown.totalCards}</div>
                  <div>Spades: {myBreakdown.spades}</div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-600">Opponent</p>
                <div className={`text-3xl font-bold ${!isWinner && !isTie ? 'text-green-600' : 'text-gray-800'}`}>
                  {opponentScore}/11
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <div>Aces: {opponentBreakdown.aces}</div>
                  <div>2♠: {opponentBreakdown.twoOfSpades}</div>
                  <div>10♦: {opponentBreakdown.tenOfDiamonds}</div>
                  <div>Cards: {opponentBreakdown.totalCards}</div>
                  <div>Spades: {opponentBreakdown.spades}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-6">
            <p>Game completed after 2 rounds</p>
            <p>Total cards captured: {(myCaptures?.length || 0) + (opponentCaptures?.length || 0)}</p>
          </div>
        </div>

        <Button onClick={onResetGame} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Play Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-96">
      <p>Loading game phase...</p>
    </div>
  )
}