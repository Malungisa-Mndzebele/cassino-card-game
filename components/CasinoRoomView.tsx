import React from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Crown, Users, Sparkles, Play } from 'lucide-react'

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

const AVATARS = ['👤', '🎩', '🎭', '🎪', '🃏', '🎰', '🎲', '🎴']

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
  const isPlayer1 = playerId === 1
  const bothReady = player1Ready && player2Ready
  const currentReady = isPlayer1 ? player1Ready : player2Ready

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Dealer Section */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border-2 border-yellow-500/30 shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-lg" />
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-4">
                    <Crown className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">The Dealer</h2>
                <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-blue-500/30 max-w-md">
                  {!bothReady ? (
                    <p className="text-white/90 text-sm">
                      {players.length < 2 
                        ? "Waiting for another player to join..."
                        : "Both players must confirm they're ready to begin."
                      }
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
                      <p className="text-green-400 font-bold">All players ready!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Casino Table */}
        <div className="w-full max-w-5xl mb-8">
          <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 rounded-3xl p-12 border-4 border-emerald-700/50 shadow-2xl min-h-[400px] flex items-center justify-center">
            {/* Table Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }} />
            </div>

            {/* Room Code / Cards Display */}
            {!bothReady ? (
              <div className="text-center z-10">
                <p className="text-white/60 text-sm mb-3">Share this code:</p>
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl px-8 py-4 shadow-lg border-2 border-yellow-300">
                  <code className="text-4xl font-mono font-black text-slate-900 tracking-wider">{roomId}</code>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 z-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative">
                    <div className="absolute -inset-2 bg-yellow-400/20 rounded-lg blur-md animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    <div className="relative bg-gradient-to-br from-red-600 to-red-800 rounded-lg w-16 h-24 border-2 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-3xl">🃏</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Players at Table Sides */}
            <div className="absolute inset-0 flex items-center justify-between px-8 z-10 pointer-events-none">
              {/* Player 1 - Left */}
              <div className="flex flex-col items-center">
                <div className={`relative transition-all duration-300 ${player1Ready ? 'scale-110' : 'scale-100'}`}>
                  {player1Ready && (
                    <div className="absolute -inset-4 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                  )}
                  <div className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-4 shadow-xl transition-all ${
                    player1Ready ? 'border-green-500 shadow-green-500/50' : 'border-yellow-500/30'
                  }`}>
                    <div className="text-6xl mb-2">{AVATARS[0]}</div>
                    <p className="text-white font-bold text-lg mb-1">{player1?.name || 'Player 1'}</p>
                    <Badge className={player1Ready ? 'bg-green-500' : 'bg-yellow-500/50'}>
                      {player1Ready ? '✓ Ready' : 'Waiting...'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Player 2 - Right */}
              <div className="flex flex-col items-center">
                <div className={`relative transition-all duration-300 ${player2Ready ? 'scale-110' : 'scale-100'}`}>
                  {player2Ready && (
                    <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                  )}
                  <div className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-4 shadow-xl transition-all ${
                    player2Ready ? 'border-blue-500 shadow-blue-500/50' : 'border-yellow-500/30'
                  }`}>
                    <div className="text-6xl mb-2">{AVATARS[1]}</div>
                    <p className="text-white font-bold text-lg mb-1">{player2?.name || 'Player 2'}</p>
                    <Badge className={player2Ready ? 'bg-blue-500' : 'bg-yellow-500/50'}>
                      {player2Ready ? '✓ Ready' : 'Waiting...'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md">
          {!bothReady ? (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-yellow-500/30">
              <p className="text-white font-medium mb-4 text-center">Are you ready to play?</p>
              <div className="flex gap-4">
                <Button
                  onClick={onPlayerReady}
                  disabled={currentReady}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                >
                  {currentReady ? '✓ Ready!' : 'I\'m Ready!'}
                </Button>
                <Button
                  onClick={onPlayerNotReady}
                  disabled={!currentReady}
                  variant="outline"
                  className="flex-1 h-12 border-red-500 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Not Ready
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {isPlayer1 && onStartShuffle ? (
                <Button
                  onClick={onStartShuffle}
                  className="w-full h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-900 font-bold text-xl shadow-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Shuffle the Deck
                </Button>
              ) : (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-yellow-500/30 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
                    <p className="text-yellow-400 font-bold">Waiting for shuffle...</p>
                  </div>
                  <p className="text-white/70 text-sm">{player1?.name || 'Player 1'} is preparing the deck.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Room Info */}
        <div className="mt-6 flex items-center gap-2 text-white/60 text-sm">
          <Users className="w-4 h-4" />
          <span>Room: <code className="font-mono font-bold text-white">{roomId}</code></span>
        </div>
      </div>
    </div>
  )
}
