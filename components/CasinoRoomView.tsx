
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
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 relative overflow-hidden">
      {/* Room Background - Classic Casino */}
      <div className="absolute inset-0">
        {/* Dark Wood Paneling */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 opacity-90"></div>
        
        {/* Red Velvet Curtains - Left */}
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-red-900 via-red-800 to-transparent opacity-40"></div>
        
        {/* Red Velvet Curtains - Right */}
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-red-900 via-red-800 to-transparent opacity-40"></div>
        
        {/* Gold Wall Sconces - Left */}
        <div className="absolute left-8 top-20 w-12 h-20">
          <div className="w-full h-full bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-400 rounded-lg opacity-30 blur-sm"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Gold Wall Sconces - Right */}
        <div className="absolute right-8 top-20 w-12 h-20">
          <div className="w-full h-full bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-400 rounded-lg opacity-30 blur-sm"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Classic Poker Table */}
        <div className="relative w-full max-w-5xl mb-8">
          {/* Table Surface - Green Felt */}
          <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 rounded-3xl p-12 border-8 border-amber-800 shadow-2xl min-h-[500px] flex items-center justify-center">
            {/* Felt Texture Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)'
              }} />
            </div>

            {/* DEALER Label - Top Center */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 px-6 py-2 rounded-lg shadow-lg border-2 border-yellow-300">
                <div className="text-amber-900 font-black text-lg tracking-wider">DEALER</div>
              </div>
            </div>

            {/* Dealer Position - Top */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
              <div className="relative">
                {/* Dealer Avatar */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-full p-6 border-4 border-yellow-400 shadow-2xl">
                  <div className="text-6xl mb-2">🎰</div>
                  <Crown className="w-8 h-8 text-yellow-400 mx-auto" />
                </div>
                
                {/* Dealer Speech */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border-2 border-yellow-400/50 shadow-xl">
                  {!bothReady ? (
                    <p className="text-white text-sm text-center">
                      "Welcome to the table! Both players must confirm they're ready to begin."
                    </p>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
                        <p className="text-green-400 font-bold text-sm">All players ready!</p>
                      </div>
                      <p className="text-white/80 text-xs">"Let's shuffle and deal the cards!"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Room Code / Cards Display - Center of Table */}
            {!bothReady ? (
              <div className="text-center z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <p className="text-white/60 text-xs mb-2">Share this code:</p>
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl px-8 py-4 shadow-lg border-2 border-yellow-300">
                  <code className="text-4xl font-mono font-black text-amber-900 tracking-wider">{roomId}</code>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
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

            {/* Player 1 - Left Side */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                {/* Holographic UI */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-lg p-3 border-2 border-blue-400/50 shadow-xl">
                  <div className="text-white font-bold text-sm text-center mb-2">{player1?.name || 'Player 1'}</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl">♠️</div>
                    <Badge className={player1Ready ? 'bg-green-500' : 'bg-yellow-500/50'}>
                      {player1Ready ? '✓ Ready' : 'Waiting...'}
                    </Badge>
                  </div>
                </div>
                
                {/* Player Avatar */}
                <div className={`relative transition-all duration-300 ${player1Ready ? 'scale-110' : 'scale-100'}`}>
                  {player1Ready && (
                    <div className="absolute -inset-4 bg-green-500/30 rounded-full blur-xl animate-pulse"></div>
                  )}
                  <div className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-4 shadow-xl transition-all ${
                    player1Ready ? 'border-green-500 shadow-green-500/50' : 'border-yellow-500/30'
                  }`}>
                    <div className="text-6xl mb-2">👤</div>
                    <p className="text-white font-bold text-sm text-center">{player1?.name || 'Player 1'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Player 2 - Right Side */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                {/* Holographic UI */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-lg p-3 border-2 border-blue-400/50 shadow-xl">
                  <div className="text-white font-bold text-sm text-center mb-2">{player2?.name || 'Player 2'}</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl">♣️</div>
                    <Badge className={player2Ready ? 'bg-green-500' : 'bg-yellow-500/50'}>
                      {player2Ready ? '✓ Ready' : 'Waiting...'}
                    </Badge>
                  </div>
                </div>
                
                {/* Player Avatar */}
                <div className={`relative transition-all duration-300 ${player2Ready ? 'scale-110' : 'scale-100'}`}>
                  {player2Ready && (
                    <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  )}
                  <div className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-4 shadow-xl transition-all ${
                    player2Ready ? 'border-blue-500 shadow-blue-500/50' : 'border-yellow-500/30'
                  }`}>
                    <div className="text-6xl mb-2">👤</div>
                    <p className="text-white font-bold text-sm text-center">{player2?.name || 'Player 2'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* COMMUNITY CARDS Label - Bottom Center */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-br from-yellow-400/80 via-yellow-500/80 to-yellow-600/80 px-6 py-2 rounded-lg backdrop-blur-sm border border-yellow-300/50">
                <div className="text-amber-900 font-black text-sm tracking-wider">COMMUNITY CARDS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Bottom */}
        <div className="w-full max-w-md mt-8">
          {!bothReady ? (
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border-2 border-yellow-500/30 shadow-xl">
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
                  className="w-full h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-amber-900 font-bold text-xl shadow-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Shuffle the Deck
                </Button>
              ) : (
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border-2 border-yellow-500/30 shadow-xl text-center">
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

        {/* Room Info - Bottom */}
        <div className="mt-6 flex items-center gap-2 text-white/60 text-sm">
          <Users className="w-4 h-4" />
          <span>Room: <code className="font-mono font-bold text-white">{roomId}</code></span>
        </div>
      </div>
    </div>
  )
}
