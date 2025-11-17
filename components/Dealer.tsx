import React, { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Crown, Users, Clock, CheckCircle, XCircle, Sparkles, PlayCircle, Shuffle } from 'lucide-react'

/**
 * Props for the Dealer component
 * @interface DealerProps
 */
interface DealerProps {
  /** Complete game state object containing players, ready status, and room info */
  gameState: any
  /** Current player's ID (1 or 2) */
  playerId: number
  /** Callback when player clicks "I'm Ready" button */
  onPlayerReady: () => void
  /** Callback when player clicks "Not Ready" button */
  onPlayerNotReady: () => void
  /** Callback when Player 1 clicks "Shuffle the Deck" (only shown when both ready) */
  onStartShuffle?: () => void
}

/**
 * Dealer Component
 * 
 * Displays a modal overlay with the dealer character and player ready status.
 * Manages the pre-game phase where players confirm they're ready to begin.
 * 
 * @component
 * @example
 * ```tsx
 * <Dealer
 *   gameState={gameState}
 *   playerId={1}
 *   onPlayerReady={() => setPlayerReady(true)}
 *   onPlayerNotReady={() => setPlayerReady(false)}
 *   onStartShuffle={() => initializeGame()}
 * />
 * ```
 * 
 * @param {DealerProps} props - Component props
 * @returns {JSX.Element} Rendered dealer modal
 */
export function Dealer({ gameState, playerId, onPlayerReady, onPlayerNotReady, onStartShuffle }: DealerProps) {
  const isPlayer1Ready = gameState.player1Ready
  const isPlayer2Ready = gameState.player2Ready
  const currentPlayerReady = playerId === 1 ? isPlayer1Ready : isPlayer2Ready
  const otherPlayerReady = playerId === 1 ? isPlayer2Ready : isPlayer1Ready
  const otherPlayerName = playerId === 1 
    ? gameState.players.find((p: any) => p.id === 2)?.name || 'Player 2'
    : gameState.players.find((p: any) => p.id === 1)?.name || 'Player 1'
  const player1Name = gameState.players.find((p: any) => p.id === 1)?.name || 'Player 1'
  const isPlayer1 = playerId === 1

  // Show dealer asking player 1 to shuffle when both are ready
  const bothReady = isPlayer1Ready && isPlayer2Ready

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-casino-dark via-casino-dark to-casino-purple/20 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="backdrop-casino border-2 border-casino-gold/50 shadow-casino-lg max-w-4xl w-full mx-4 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="dealer-title">
        <CardContent className="p-0">
          {/* Dealer Character Section */}
          <div className="bg-gradient-to-r from-casino-gold to-casino-gold-dark p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-casino-gold/20 to-casino-gold-dark/20 animate-pulse"></div>
            <div className="relative z-10">
              {/* Dealer Avatar */}
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-2xl opacity-70 animate-pulse-slow"></div>
                  <div className="relative backdrop-casino-dark rounded-full p-6 shadow-glow-gold border-4 border-casino-gold/50">
                    <div className="text-6xl mb-2">🎰</div>
                    <Crown className="w-8 h-8 text-casino-gold glow-gold mx-auto" />
                  </div>
                </div>
              </div>
              <h1 id="dealer-title" className="text-4xl font-black text-white mb-3 drop-shadow-lg">The Dealer</h1>
              <p className="text-white/90 font-semibold text-lg">Welcome to the Casino!</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 bg-gradient-to-b from-casino-dark/95 to-casino-dark">
            {/* Dealer Speech Bubble */}
            {!bothReady ? (
              <div className="mb-8">
                <div className="backdrop-casino-dark rounded-2xl p-6 border-2 border-casino-blue/50 relative">
                  <div className="absolute -left-4 top-8 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-casino-blue/50 border-b-8 border-b-transparent"></div>
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl flex-shrink-0">💬</div>
                    <div className="flex-1">
                      <p className="text-white text-lg font-medium leading-relaxed">
                        Welcome, <span className="text-casino-green-light font-bold">{player1Name}</span> and <span className="text-casino-blue-light font-bold">{otherPlayerName}</span>!
                      </p>
                      <p className="text-white/80 mt-3 text-base">
                        Both players must confirm you're ready to begin. Once everyone is ready, <span className="text-casino-gold font-semibold">{player1Name}</span> will shuffle the deck to start the game.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="backdrop-casino-dark rounded-2xl p-6 border-2 border-casino-green/50 relative animate-pulse-slow">
                  <div className="absolute -left-4 top-8 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-casino-green/50 border-b-8 border-b-transparent"></div>
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl flex-shrink-0 animate-bounce">🎴</div>
                    <div className="flex-1">
                      <p className="text-casino-green-light text-xl font-bold mb-2">
                        Excellent! Both players are ready!
                      </p>
                      <p className="text-white text-lg leading-relaxed">
                        <span className="text-casino-gold font-bold">{player1Name}</span>, please shuffle the deck to begin the game. 
                        {!isPlayer1 && (
                          <span className="block mt-2 text-white/70">Waiting for {player1Name} to shuffle...</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Players in Room */}
            <div className="mb-8">
              <div className="backdrop-casino-dark rounded-xl p-6 border border-casino-blue/30">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-casino-blue" />
                  <span className="text-casino-blue-light font-medium">Room: {gameState.roomId}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-4 rounded-lg border-2 transition-all duration-300 ${
                    isPlayer1Ready 
                      ? 'border-casino-green/50 bg-casino-green/10' 
                      : 'border-casino-gold/30 bg-casino-gold/5'
                  }`}>
                    <div className="text-casino-green-light font-bold text-lg mb-1">{player1Name}</div>
                    <div className="text-white/60 text-sm mb-2">Player 1</div>
                    {isPlayer1Ready ? (
                      <Badge className="bg-casino-green text-white border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-casino-gold text-casino-gold">
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting
                      </Badge>
                    )}
                  </div>
                  <div className={`text-center p-4 rounded-lg border-2 transition-all duration-300 ${
                    isPlayer2Ready 
                      ? 'border-casino-green/50 bg-casino-green/10' 
                      : 'border-casino-gold/30 bg-casino-gold/5'
                  }`}>
                    <div className="text-casino-blue-light font-bold text-lg mb-1">{otherPlayerName}</div>
                    <div className="text-white/60 text-sm mb-2">Player 2</div>
                    {isPlayer2Ready ? (
                      <Badge className="bg-casino-green text-white border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-casino-gold text-casino-gold">
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!bothReady ? (
              <div className="space-y-4">
                {!currentPlayerReady ? (
                  <div className="flex space-x-4">
                    <Button
                      onClick={onPlayerReady}
                      className="flex-1 h-14 bg-gradient-to-r from-casino-green to-casino-green-light hover:from-casino-green-light hover:to-casino-green text-white shadow-casino border-0 rounded-xl transition-all duration-300 text-lg font-semibold"
                      aria-label="I'm ready"
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      I'm Ready!
                    </Button>
                    <Button
                      onClick={onPlayerNotReady}
                      variant="outline"
                      className="flex-1 h-14 border-casino-red text-casino-red hover:bg-casino-red/10 hover:border-casino-red-light backdrop-casino-dark rounded-xl transition-all duration-300 text-lg"
                      aria-label="I'm not ready"
                    >
                      <XCircle className="w-6 h-6 mr-2" />
                      Not Ready
                    </Button>
                  </div>
                ) : (
                  <div className="text-center backdrop-casino-dark rounded-xl p-6 border border-casino-green/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CheckCircle className="w-6 h-6 text-casino-green-light" />
                      <span className="text-casino-green-light font-bold text-lg">You're Ready!</span>
                    </div>
                    <p className="text-white/70">
                      {otherPlayerReady 
                        ? "Both players are ready!" 
                        : `Waiting for ${otherPlayerName} to confirm they're ready...`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {isPlayer1 ? (
                  <div className="text-center">
                    <p className="text-white/80 mb-4 text-lg">
                      The dealer is asking you to shuffle the deck.
                    </p>
                    <Button
                      onClick={onStartShuffle}
                      className="h-16 w-full bg-gradient-to-r from-casino-gold to-casino-gold-dark hover:from-casino-gold-dark hover:to-casino-gold text-white shadow-casino-lg border-0 rounded-xl transition-all duration-300 text-xl font-bold"
                      aria-label="Shuffle the deck"
                    >
                      <Shuffle className="w-7 h-7 mr-3" />
                      Shuffle the Deck
                    </Button>
                  </div>
                ) : (
                  <div className="text-center backdrop-casino-dark rounded-xl p-6 border border-casino-gold/30">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <Sparkles className="w-8 h-8 text-casino-gold glow-gold animate-pulse" />
                      <span className="text-casino-gold font-bold text-xl">Waiting for Shuffle</span>
                      <Sparkles className="w-8 h-8 text-casino-gold glow-gold animate-pulse" />
                    </div>
                    <p className="text-white/80 text-lg">
                      {player1Name} is shuffling the deck. The game will begin shortly...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
