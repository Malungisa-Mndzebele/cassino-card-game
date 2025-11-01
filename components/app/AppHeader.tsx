import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { LogOut, Users, Trophy } from 'lucide-react'

interface AppHeaderProps {
  roomId: string
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  myName: string
  opponentName: string
  myScore: number
  opponentScore: number
  phase?: string
  round?: number
  onLeave: () => void
}

export function AppHeader({
  roomId,
  connectionStatus,
  myName,
  opponentName,
  myScore,
  opponentScore,
  phase,
  round,
  onLeave
}: AppHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 mb-4 border border-purple-500/30 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Room Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-white font-mono font-bold">{roomId}</span>
              </div>
          <Badge className={
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }>
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             'Disconnected'}
          </Badge>
          </div>

        {/* Center: Scores */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">{myName}</div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{myScore}</span>
              </div>
            </div>
          <div className="text-white/40">vs</div>
            <div className="text-center">
            <div className="text-xs text-white/60 mb-1">{opponentName}</div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-bold text-white">{opponentScore}</span>
              </div>
            </div>
          </div>

        {/* Right: Leave Button */}
              <Button
                onClick={onLeave}
                variant="outline"
                size="sm"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
          <LogOut className="w-4 h-4 mr-2" />
          Leave
              </Button>
            </div>

      {/* Phase/Round Info */}
      {(phase || round) && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <span className="text-white/60 text-sm">
            {phase && <span className="capitalize">{phase}</span>}
            {round && <span> • Round {round}</span>}
          </span>
          </div>
      )}
        </div>
  )
}
