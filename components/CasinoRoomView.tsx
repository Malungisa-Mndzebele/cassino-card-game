import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Crown, Users, Sparkles } from 'lucide-react'

interface CasinoRoomViewProps {
  roomId: string
  players: Array<{ id: number; name: string }>
  player1Ready: boolean
  player2Ready: boolean
  playerId: number
  onPlayerReady: () => void
  onPlayerNotReady: () => void
  onStartShuffle?: () => void
}

export function CasinoRoomView({
  roomId,
  players,
  player1Ready,
  player2Ready,
  playerId,
  onPlayerReady,
  onPlayerNotReady,
  onStartShuffle
}: CasinoRoomViewProps) {
  const player1 = players.find(p => p.id === 1)
  const player2 = players.find(p => p.id === 2)
  const currentPlayer = players.find(p => p.id === playerId)
  const isPlayer1 = playerId === 1
  const bothReady = player1Ready && player2Ready

  // Generate random avatar emoji based on player ID
  const getPlayerAvatar = (id: number) => {
    const avatars = ['👤', '🎩', '🎭', '🎪', '🃏', '🎰', '🎲', '🎴']
    return avatars[id % avatars.length]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-dark to-casino-purple/20 backdrop-blur-sm relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-casino-gold/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-casino-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-casino-blue/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Room Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-3 backdrop-casino-dark rounded-2xl px-6 py-3 shadow-glow-casino border border-casino-gold/30">
            <Users className="w-5 h-5 text-casino-gold" />
            <span className="text-white font-semibold text-lg">Room: <span className="font-mono font-black text-casino-gold">{roomId}</span></span>
          </div>
        </div>

        {/* Casino Table Layout */}
        <div className="relative w-full max-w-6xl">
          {/* Dealer Section - Top */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-2xl opacity-50 animate-pulse-slow"></div>
              <div className="relative backdrop-casino-dark rounded-3xl p-8 shadow-casino-lg border-4 border-casino-gold/50">
                <div className="flex flex-col items-center">
                  {/* Dealer Avatar */}
                  <div className="relative mb-4">
                    <div className="absolute -inset-2 bg-gradient-to-r from-casino-gold to-casino-purple rounded-full blur-lg opacity-60 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-casino-gold to-casino-gold-dark rounded-full p-6 shadow-glow-gold border-4 border-white/20">
                      <Crown className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">The Dealer</h2>
                  
                  {/* Dealer Message */}
                  <div className="mt-6 backdrop-casino rounded-xl p-6 border-2 border-casino-blue/50 max-w-md">
                    {!bothReady ? (
                      <div className="text-center">
                        <p className="text-white text-lg font-medium mb-2">
                          Welcome to the casino!
                        </p>
                        <p className="text-white/80 text-sm">
                          {players.length < 2 
                            ? "Waiting for another player to join..."
                            : "Both players must confirm they're ready to begin."
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Sparkles className="w-6 h-6 text-casino-green-light mr-2 animate-pulse" />
                          <p className="text-casino-green-light text-xl font-bold">
                            All players ready!
                          </p>
                        </div>
                        {isPlayer1 ? (
                          <p className="text-white text-base mt-2">
                            Please shuffle the deck to begin the game.
                          </p>
                        ) : (
                          <p className="text-white/80 text-sm mt-2">
                            Waiting for {player1?.name || 'Player 1'} to shuffle...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Casino Table */}
          <div className="relative">
            {/* Table Surface */}
            <div className="relative backdrop-casino-dark rounded-3xl p-12 shadow-casino-lg border-4 border-casino-green/30 min-h-[400px] flex flex-col items-center justify-center overflow-hidden">
              {/* Table Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              {/* Room Code in Center (when waiting) */}
              {!bothReady && (
                <div className="text-center z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <p className="text-white/60 text-sm mb-2">Share this code to invite:</p>
                  <div className="inline-flex items-center gradient-gold rounded-2xl px-8 py-4 shadow-gold border-2 border-casino-gold">
                    <code className="text-4xl font-mono font-black text-casino-green-dark tracking-wider shimmer">{roomId}</code>
                  </div>
                </div>
              )}

              {/* Cards Display (when both ready) - Center of Table */}
              {bothReady && (
                <div className="flex items-center justify-center space-x-4 mb-8 z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-casino-gold/20 rounded-lg blur-md animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-600 to-red-800 rounded-lg w-16 h-24 border-2 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-3xl">🃏</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-casino-blue/20 rounded-lg blur-md animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg w-16 h-24 border-2 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-3xl">🃏</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-casino-purple/20 rounded-lg blur-md animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg w-16 h-24 border-2 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-3xl">🃏</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Players at Table Sides */}
              <div className="absolute inset-0 flex items-center justify-between px-8 z-10">
                {/* Player 1 - Left Side */}
                <div className="flex flex-col items-center space-y-4">
                  <div className={`relative transition-all duration-300 ${
                    player1Ready ? 'scale-110' : 'scale-100'
                  }`}>
                    {player1Ready && (
                      <div className="absolute -inset-4 bg-casino-green/30 rounded-full blur-xl animate-pulse"></div>
                    )}
                    <div className={`relative backdrop-casino rounded-2xl p-6 border-4 shadow-casino-lg transition-all duration-300 ${
                      player1Ready 
                        ? 'border-casino-green shadow-glow-green' 
                        : 'border-casino-gold/30'
                    }`}>
                      {/* Player Avatar */}
                      <div className="text-6xl mb-2 animate-bounce-slow">
                        {getPlayerAvatar(1)}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">
                          {player1?.name || 'Player 1'}
                        </p>
                        {player1Ready ? (
                          <Badge className="bg-casino-green text-white border-0 shadow-glow-green">
                            ✓ Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-casino-gold text-casino-gold">
                            Waiting...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player 2 - Right Side */}
                <div className="flex flex-col items-center space-y-4">
                  <div className={`relative transition-all duration-300 ${
                    player2Ready ? 'scale-110' : 'scale-100'
                  }`}>
                    {player2Ready && (
                      <div className="absolute -inset-4 bg-casino-blue/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    )}
                    <div className={`relative backdrop-casino rounded-2xl p-6 border-4 shadow-casino-lg transition-all duration-300 ${
                      player2Ready 
                        ? 'border-casino-blue shadow-glow-blue' 
                        : 'border-casino-gold/30'
                    }`}>
                      {/* Player Avatar */}
                      <div className="text-6xl mb-2 animate-bounce-slow" style={{ animationDelay: '0.3s' }}>
                        {getPlayerAvatar(2)}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1">
                          {player2?.name || 'Player 2'}
                        </p>
                        {player2Ready ? (
                          <Badge className="bg-casino-blue text-white border-0 shadow-glow-blue">
                            ✓ Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-casino-gold text-casino-gold">
                            Waiting...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Bottom */}
          <div className="mt-8 flex justify-center">
            {!bothReady ? (
              <div className="space-y-4 max-w-md w-full">
                {currentPlayer && (
                  <div className="text-center backdrop-casino-dark rounded-xl p-6 border-2 border-casino-gold/30">
                    <p className="text-white text-lg font-medium mb-4">
                      Are you ready to play?
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={onPlayerReady}
                        disabled={isPlayer1 ? player1Ready : player2Ready}
                        className={`flex-1 h-14 rounded-xl font-semibold text-lg transition-all duration-300 ${
                          isPlayer1 && player1Ready || !isPlayer1 && player2Ready
                            ? 'bg-casino-green/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-casino-green to-casino-green-light hover:from-casino-green-light hover:to-casino-green text-white shadow-casino border-0'
                        }`}
                      >
                        {isPlayer1 ? (player1Ready ? '✓ Ready!' : "I'm Ready!") : (player2Ready ? '✓ Ready!' : "I'm Ready!")}
                      </button>
                      <button
                        onClick={onPlayerNotReady}
                        disabled={isPlayer1 ? !player1Ready : !player2Ready}
                        className={`flex-1 h-14 rounded-xl font-semibold text-lg transition-all duration-300 border-2 ${
                          isPlayer1 && !player1Ready || !isPlayer1 && !player2Ready
                            ? 'border-casino-red/50 text-casino-red/50 cursor-not-allowed bg-transparent'
                            : 'border-casino-red text-casino-red hover:bg-casino-red/10 backdrop-casino-dark'
                        }`}
                      >
                        Not Ready
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-md w-full">
                {isPlayer1 && onStartShuffle ? (
                  <button
                    onClick={onStartShuffle}
                    className="w-full h-16 bg-gradient-to-r from-casino-gold to-casino-gold-dark hover:from-casino-gold-dark hover:to-casino-gold text-white shadow-casino-lg border-0 rounded-xl transition-all duration-300 text-xl font-bold"
                  >
                    🎴 Shuffle the Deck
                  </button>
                ) : (
                  <div className="text-center backdrop-casino-dark rounded-xl p-6 border-2 border-casino-gold/30">
                    <div className="flex items-center justify-center mb-2">
                      <Sparkles className="w-6 h-6 text-casino-gold mr-2 animate-spin-slow" />
                      <p className="text-casino-gold font-bold text-lg">
                        Waiting for shuffle...
                      </p>
                    </div>
                    <p className="text-white/70 text-sm mt-2">
                      {player1?.name || 'Player 1'} is preparing to shuffle the deck.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

