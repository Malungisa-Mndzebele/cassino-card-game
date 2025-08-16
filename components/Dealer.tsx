import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Crown, Users, Clock, CheckCircle, XCircle, Sparkles } from 'lucide-react'

interface DealerProps {
  gameState: any
  playerId: number
  onPlayerReady: () => void
  onPlayerNotReady: () => void
}

export function Dealer({ gameState, playerId, onPlayerReady, onPlayerNotReady }: DealerProps) {
  const isPlayer1Ready = gameState.player1Ready
  const isPlayer2Ready = gameState.player2Ready
  const currentPlayerReady = playerId === 1 ? isPlayer1Ready : isPlayer2Ready
  const otherPlayerReady = playerId === 1 ? isPlayer2Ready : isPlayer1Ready
  const otherPlayerName = playerId === 1 
    ? gameState.players.find((p: any) => p.id === 2)?.name || 'Player 2'
    : gameState.players.find((p: any) => p.id === 1)?.name || 'Player 1'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="backdrop-casino border-0 shadow-casino-lg max-w-2xl w-full mx-4 overflow-hidden">
        <CardContent className="p-0">
          {/* Dealer Header */}
          <div className="bg-gradient-to-r from-casino-gold to-casino-gold-dark p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-casino-gold/20 to-casino-gold-dark/20 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex justify-center items-center mb-4">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-lg opacity-60 animate-pulse-slow"></div>
                  <div className="relative backdrop-casino-dark rounded-full p-4 shadow-glow-gold border border-casino-gold/30">
                    <Crown className="w-12 h-12 text-casino-gold glow-gold" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">The Dealer</h1>
              <p className="text-white/80 font-medium">Ready to deal the cards?</p>
            </div>
          </div>

          {/* Dealer Content */}
          <div className="p-8">
            {/* Room Info */}
            <div className="text-center mb-8">
              <div className="backdrop-casino-dark rounded-xl p-4 mb-4 border border-casino-blue/30">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-casino-blue" />
                  <span className="text-casino-blue-light font-medium">Room: {gameState.roomId}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-casino-green-light font-bold">{gameState.players[0]?.name || 'Player 1'}</div>
                    <div className="text-white/60">Player 1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-casino-blue-light font-bold">{gameState.players[1]?.name || 'Player 2'}</div>
                    <div className="text-white/60">Player 2</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready Status */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-4">Are you ready to play?</h2>
                <p className="text-white/70 mb-6">
                  Both players must confirm they're ready before the game can begin.
                </p>
              </div>

              {/* Player Status */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Player 1 Status */}
                <div className={`backdrop-casino-dark rounded-xl p-4 border transition-all duration-300 ${
                  isPlayer1Ready 
                    ? 'border-casino-green/50 bg-casino-green/10' 
                    : 'border-casino-gold/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-casino-green-light font-medium">Player 1</span>
                    {isPlayer1Ready ? (
                      <CheckCircle className="w-5 h-5 text-casino-green-light" />
                    ) : (
                      <Clock className="w-5 h-5 text-casino-gold" />
                    )}
                  </div>
                  <div className="text-white/80 text-sm">{gameState.players[0]?.name || 'Player 1'}</div>
                  <div className="mt-2">
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
                </div>

                {/* Player 2 Status */}
                <div className={`backdrop-casino-dark rounded-xl p-4 border transition-all duration-300 ${
                  isPlayer2Ready 
                    ? 'border-casino-green/50 bg-casino-green/10' 
                    : 'border-casino-gold/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-casino-blue-light font-medium">Player 2</span>
                    {isPlayer2Ready ? (
                      <CheckCircle className="w-5 h-5 text-casino-green-light" />
                    ) : (
                      <Clock className="w-5 h-5 text-casino-gold" />
                    )}
                  </div>
                  <div className="text-white/80 text-sm">{gameState.players[1]?.name || 'Player 2'}</div>
                  <div className="mt-2">
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

              {/* Action Buttons */}
              {!currentPlayerReady && (
                <div className="flex space-x-4">
                  <Button
                    onClick={onPlayerReady}
                    className="flex-1 h-12 bg-gradient-to-r from-casino-green to-casino-green-light hover:from-casino-green-light hover:to-casino-green text-white shadow-casino border-0 rounded-xl transition-all duration-300"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    I'm Ready!
                  </Button>
                  <Button
                    onClick={onPlayerNotReady}
                    variant="outline"
                    className="flex-1 h-12 border-casino-red text-casino-red hover:bg-casino-red/10 hover:border-casino-red-light backdrop-casino-dark rounded-xl transition-all duration-300"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Not Ready
                  </Button>
                </div>
              )}

              {currentPlayerReady && (
                <div className="text-center">
                  <div className="backdrop-casino-dark rounded-xl p-4 border border-casino-green/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CheckCircle className="w-6 h-6 text-casino-green-light" />
                      <span className="text-casino-green-light font-bold">You're Ready!</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {otherPlayerReady 
                        ? "Both players are ready! The game will begin shortly..." 
                        : `Waiting for ${otherPlayerName} to confirm they're ready...`}
                    </p>
                  </div>
                </div>
              )}

              {/* Both Ready Status */}
              {isPlayer1Ready && isPlayer2Ready && (
                <div className="text-center">
                  <div className="backdrop-casino-dark rounded-xl p-6 border border-casino-green/50 bg-casino-green/10">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Sparkles className="w-8 h-8 text-casino-gold glow-gold" />
                      <span className="text-casino-green-light font-bold text-xl">Both Players Ready!</span>
                      <Sparkles className="w-8 h-8 text-casino-gold glow-gold" />
                    </div>
                    <p className="text-white/80">
                      The game will begin in a few seconds...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
